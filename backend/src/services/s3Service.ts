import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fromIni } from '@aws-sdk/credential-providers';

// Configuración de AWS S3
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'assessment-center-files';
const AWS_PROFILE = process.env.AWS_PROFILE || 'default';

// Intentar usar credenciales en este orden:
// 1. Variables de entorno (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
// 2. Perfil de AWS CLI (~/.aws/credentials)
// 3. Credenciales de instancia EC2/Lambda (en producción)

let credentials;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  // Usar credenciales de variables de entorno
  credentials = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };
  console.log('🔑 Using AWS credentials from environment variables');
} else {
  // Usar credenciales del perfil de AWS CLI
  try {
    credentials = fromIni({ profile: AWS_PROFILE });
    console.log(`🔑 Using AWS credentials from profile: ${AWS_PROFILE}`);
  } catch (error) {
    console.warn('⚠️  No AWS credentials found in environment or AWS CLI profile');
    console.warn('📝 Configure credentials using one of these methods:');
    console.warn('   1. Run: aws configure');
    console.warn('   2. Set environment variables in backend/.env');
    console.warn('📖 See GUIA-CONFIGURACION-AWS-S3.md for details');
  }
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials,
});

// Log configuration on startup
console.log(`📦 S3 Configuration:`);
console.log(`   Region: ${AWS_REGION}`);
console.log(`   Bucket: ${BUCKET_NAME}`);
console.log(`   Profile: ${AWS_PROFILE}`);

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
