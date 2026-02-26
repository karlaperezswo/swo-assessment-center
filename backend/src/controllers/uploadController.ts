import { Request, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fromIni } from '@aws-sdk/credential-providers';
import { v4 as uuidv4 } from 'uuid';

// Configuración de AWS S3
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'assessment-center-files-assessment-dashboard';
const AWS_PROFILE = process.env.AWS_PROFILE || 'default';

// Configurar credenciales (igual que en s3Service.ts)
let credentials;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  credentials = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };
  console.log('🔑 [UploadController] Using AWS credentials from environment variables');
} else {
  try {
    credentials = fromIni({ profile: AWS_PROFILE });
    console.log(`🔑 [UploadController] Using AWS credentials from profile: ${AWS_PROFILE}`);
  } catch (error) {
    console.warn('⚠️  [UploadController] No AWS credentials found');
  }
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials,
});

console.log(`📦 [UploadController] S3 Configuration:`);
console.log(`   Region: ${AWS_REGION}`);
console.log(`   Bucket: ${BUCKET_NAME}`);
console.log(`   Profile: ${AWS_PROFILE}`);

export class UploadController {
  /**
   * Generate a pre-signed URL for direct S3 upload
   */
  getUploadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename, contentType } = req.body;

      if (!filename) {
        res.status(400).json({ success: false, error: 'Filename is required' });
        return;
      }

      // Generate unique key for S3
      const fileExtension = filename.split('.').pop();
      const key = `uploads/${uuidv4()}.${fileExtension}`;

      // Create pre-signed URL for PUT operation (15 minutes expiry)
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

      console.log(`[PRESIGNED] Generated URL for key: ${key}`);

      res.json({
        success: true,
        data: {
          uploadUrl,
          key,
          expiresIn: 900
        }
      });
    } catch (error) {
      console.error('[PRESIGNED] Error generating URL:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate upload URL'
      });
    }
  };
}
