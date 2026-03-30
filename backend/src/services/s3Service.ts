import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuración de AWS S3
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'assessment-center-files';

// Credenciales: si están en variables de entorno las usa, si no deja que el SDK
// resuelva automáticamente (IAM Role en Lambda, perfil AWS CLI en local)
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const clientConfig: any = { region: AWS_REGION };

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };
  console.log('🔑 Using AWS credentials from environment variables');
} else if (isLambda) {
  // En Lambda: dejar que el SDK use el IAM Role automáticamente (no pasar credentials)
  console.log('🔑 Using Lambda IAM Role credentials');
} else {
  // Local: intentar perfil de AWS CLI
  try {
    const { fromIni } = require('@aws-sdk/credential-providers');
    const AWS_PROFILE = process.env.AWS_PROFILE || 'default';
    clientConfig.credentials = fromIni({ profile: AWS_PROFILE });
    console.log(`🔑 Using AWS credentials from profile: ${AWS_PROFILE}`);
  } catch (error) {
    console.warn('⚠️  No AWS credentials found, SDK will use default credential chain');
  }
}

const s3Client = new S3Client(clientConfig);

// Log configuration on startup
console.log(`📦 S3 Configuration:`);
console.log(`   Region: ${AWS_REGION}`);
console.log(`   Bucket: ${BUCKET_NAME}`);
console.log(`   Mode: ${isLambda ? 'Lambda (IAM Role)' : 'Local'}`);

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

  /**
   * Upload JSON object to S3
   */
  static async uploadJSON(key: string, data: any): Promise<string> {
    const body = Buffer.from(JSON.stringify(data), 'utf-8');
    return this.uploadFile(key, body, 'application/json');
  }

  /**
   * Download and parse JSON from S3
   */
  static async downloadJSON(key: string): Promise<any> {
    const buffer = await this.getFile(key);
    const jsonString = buffer.toString('utf-8');
    return JSON.parse(jsonString);
  }
}
