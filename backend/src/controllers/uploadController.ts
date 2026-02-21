import { Request, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'assessment-center-files-assessment-dashboard';

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
