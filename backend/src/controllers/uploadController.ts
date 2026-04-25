import { Request, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { getS3BucketName } from '../config/awsResources';

// Configuración de AWS S3 — usa IAM Role del Lambda automáticamente
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const s3Client = new S3Client({ region: AWS_REGION });

console.log(`📦 [UploadController] S3 Configuration: Region=${AWS_REGION}`);

const ALLOWED_UPLOAD_CONTENT_TYPES = new Set([
  'application/json',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
]);
const ALLOWED_EXTENSIONS = new Set(['json', 'pdf', 'xlsx', 'xls', 'docx']);

export class UploadController {
  /**
   * Generate a pre-signed URL for direct S3 upload
   */
  getUploadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename, contentType } = req.body;

      if (!filename || typeof filename !== 'string') {
        res.status(400).json({ success: false, error: 'Filename is required' });
        return;
      }

      // Strict allow-list of extensions and content-types so a caller can't
      // smuggle arbitrary file types through the upload URL.
      const rawExt = (filename.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!ALLOWED_EXTENSIONS.has(rawExt)) {
        res.status(400).json({ success: false, error: `Unsupported file extension: ${rawExt}` });
        return;
      }
      const safeContentType =
        typeof contentType === 'string' && ALLOWED_UPLOAD_CONTENT_TYPES.has(contentType)
          ? contentType
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      // The S3 key is fully server-controlled (UUID + validated extension).
      const key = `uploads/${uuidv4()}.${rawExt}`;

      // Create pre-signed URL for PUT operation (15 minutes expiry)
      const command = new PutObjectCommand({
        Bucket: getS3BucketName(),
        Key: key,
        ContentType: safeContentType,
        ServerSideEncryption: 'AES256',
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
