/**
 * Unified Storage Service
 *
 * Detecta automáticamente el entorno y usa:
 * - Filesystem local en desarrollo (NODE_ENV=development)
 * - S3 en producción/AWS (NODE_ENV=production)
 */

import fs from 'fs';
import path from 'path';
import { S3Service } from './s3Service';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_AWS_LAMBDA = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

export class StorageService {
  private static uploadDir = path.join(__dirname, '../../uploads');
  private static generatedDir = path.join(__dirname, '../../generated');

  /**
   * Ensure local directories exist (only for local development)
   */
  private static ensureLocalDirectories(): void {
    if (!IS_PRODUCTION && !IS_AWS_LAMBDA) {
      [this.uploadDir, this.generatedDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
    }
  }

  /**
   * Save a file (automatically chooses local or S3)
   */
  static async saveFile(
    filename: string,
    data: Buffer,
    contentType: string,
    folder: 'uploads' | 'generated' = 'generated'
  ): Promise<string> {
    if (IS_PRODUCTION || IS_AWS_LAMBDA) {
      // AWS: Use S3
      const key = `${folder}/${filename}`;
      await S3Service.uploadFile(key, data, contentType);
      console.log(`[Storage] Saved to S3: ${key}`);
      return key;
    } else {
      // Local: Use filesystem
      this.ensureLocalDirectories();
      const localPath = path.join(
        folder === 'uploads' ? this.uploadDir : this.generatedDir,
        filename
      );
      fs.writeFileSync(localPath, data);
      console.log(`[Storage] Saved locally: ${localPath}`);
      return localPath;
    }
  }

  /**
   * Get a file (automatically chooses local or S3)
   */
  static async getFile(
    filenameOrKey: string,
    folder: 'uploads' | 'generated' = 'generated'
  ): Promise<Buffer> {
    if (IS_PRODUCTION || IS_AWS_LAMBDA) {
      // AWS: Get from S3
      const key = filenameOrKey.startsWith('uploads/') || filenameOrKey.startsWith('generated/')
        ? filenameOrKey
        : `${folder}/${filenameOrKey}`;

      console.log(`[Storage] Getting from S3: ${key}`);
      return await S3Service.getFile(key);
    } else {
      // Local: Get from filesystem
      const localPath = path.isAbsolute(filenameOrKey)
        ? filenameOrKey
        : path.join(
            folder === 'uploads' ? this.uploadDir : this.generatedDir,
            filenameOrKey
          );

      console.log(`[Storage] Getting locally: ${localPath}`);

      if (!fs.existsSync(localPath)) {
        throw new Error(`File not found: ${localPath}`);
      }

      return fs.readFileSync(localPath);
    }
  }

  /**
   * Delete a file (automatically chooses local or S3)
   */
  static async deleteFile(
    filenameOrKey: string,
    folder: 'uploads' | 'generated' = 'generated'
  ): Promise<void> {
    if (IS_PRODUCTION || IS_AWS_LAMBDA) {
      // AWS: Delete from S3
      const key = filenameOrKey.startsWith('uploads/') || filenameOrKey.startsWith('generated/')
        ? filenameOrKey
        : `${folder}/${filenameOrKey}`;

      console.log(`[Storage] Deleting from S3: ${key}`);
      await S3Service.deleteFile(key);
    } else {
      // Local: Delete from filesystem
      const localPath = path.isAbsolute(filenameOrKey)
        ? filenameOrKey
        : path.join(
            folder === 'uploads' ? this.uploadDir : this.generatedDir,
            filenameOrKey
          );

      console.log(`[Storage] Deleting locally: ${localPath}`);

      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
  }

  /**
   * Check if file exists (automatically chooses local or S3)
   */
  static async fileExists(
    filenameOrKey: string,
    folder: 'uploads' | 'generated' = 'generated'
  ): Promise<boolean> {
    if (IS_PRODUCTION || IS_AWS_LAMBDA) {
      // AWS: Check S3
      const key = filenameOrKey.startsWith('uploads/') || filenameOrKey.startsWith('generated/')
        ? filenameOrKey
        : `${folder}/${filenameOrKey}`;

      return await S3Service.fileExists(key);
    } else {
      // Local: Check filesystem
      const localPath = path.isAbsolute(filenameOrKey)
        ? filenameOrKey
        : path.join(
            folder === 'uploads' ? this.uploadDir : this.generatedDir,
            filenameOrKey
          );

      return fs.existsSync(localPath);
    }
  }

  /**
   * Get download URL (for S3 returns signed URL, for local returns relative path)
   */
  static async getDownloadUrl(
    filenameOrKey: string,
    folder: 'uploads' | 'generated' = 'generated'
  ): Promise<string> {
    if (IS_PRODUCTION || IS_AWS_LAMBDA) {
      // AWS: Generate S3 signed URL (valid for 1 hour)
      const key = filenameOrKey.startsWith('uploads/') || filenameOrKey.startsWith('generated/')
        ? filenameOrKey
        : `${folder}/${filenameOrKey}`;

      console.log(`[Storage] Generating S3 signed URL: ${key}`);
      return await S3Service.getDownloadUrl(key, 3600); // 1 hour expiry
    } else {
      // Local: Return API endpoint
      const filename = path.basename(filenameOrKey);
      return `/api/report/download/${filename}`;
    }
  }

  /**
   * Schedule file deletion after specified time (in milliseconds)
   */
  static scheduleFileDeletion(
    filenameOrKey: string,
    folder: 'uploads' | 'generated',
    delayMs: number = 60 * 60 * 1000 // Default: 1 hour
  ): void {
    setTimeout(async () => {
      try {
        await this.deleteFile(filenameOrKey, folder);
        console.log(`[Storage] Scheduled deletion completed: ${filenameOrKey}`);
      } catch (error) {
        console.error(`[Storage] Failed to delete file: ${filenameOrKey}`, error);
      }
    }, delayMs);
  }

  /**
   * Get environment info (useful for debugging)
   */
  static getEnvironmentInfo(): {
    isProduction: boolean;
    isLambda: boolean;
    storageType: 'S3' | 'Local Filesystem';
  } {
    return {
      isProduction: IS_PRODUCTION,
      isLambda: IS_AWS_LAMBDA,
      storageType: (IS_PRODUCTION || IS_AWS_LAMBDA) ? 'S3' : 'Local Filesystem'
    };
  }
}
