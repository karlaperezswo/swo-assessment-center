import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuración de AWS S3
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'assessment-center-files';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Validar configuración
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.warn('⚠️  AWS credentials not configured. S3 uploads will fail.');
  console.warn('📝 Please configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in backend/.env');
  console.warn('📖 See GUIA-CONFIGURACION-AWS-S3.md for setup instructions');
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

// Log configuration on startup
console.log(`📦 S3 Configuration:`);
console.log(`   Region: ${AWS_REGION}`);
console.log(`   Bucket: ${BUCKET_NAME}`);
console.log(`   Credentials: ${AWS_ACCESS_KEY_ID ? '✅ Configured' : '❌ Not configured'}`);

export class S3Service {
  /**
   * Upload file to S3
   */
  static async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType
    });

    await s3Client.send(command);
    return key;
  }

  /**
   * Get signed URL for download (valid for 1 hour by default)
   */
  static async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Delete file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
  }

  /**
   * Get file from S3 as Buffer
   */
  static async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);
    const stream = response.Body as any;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * Check if file exists in S3
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });
      await s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
}
