import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3BucketName } from '../config/awsResources';

// SDK resolves credentials automatically:
// - In Lambda: uses the IAM Role assigned to the function
// - Locally: uses AWS CLI profile or environment variables
// Never hardcode credentials in code
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

export class S3Service {
  static async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: getS3BucketName(),
      Key: key,
      Body: body,
      ContentType: contentType
    });
    await s3Client.send(command);
    return key;
  }

  static async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: getS3BucketName(), Key: key });
    return getSignedUrl(s3Client, command, { expiresIn });
  }

  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: getS3BucketName(), Key: key });
    await s3Client.send(command);
  }

  static async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({ Bucket: getS3BucketName(), Key: key });
    const response = await s3Client.send(command);
    const stream = response.Body as any;
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  static async fileExists(key: string): Promise<boolean> {
    try {
      await s3Client.send(new GetObjectCommand({ Bucket: getS3BucketName(), Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  static async uploadJSON(key: string, data: any): Promise<string> {
    const body = Buffer.from(JSON.stringify(data), 'utf-8');
    return this.uploadFile(key, body, 'application/json');
  }

  static async downloadJSON(key: string): Promise<any> {
    const buffer = await this.getFile(key);
    return JSON.parse(buffer.toString('utf-8'));
  }
}
