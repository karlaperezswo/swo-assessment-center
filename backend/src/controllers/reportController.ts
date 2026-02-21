import { Request, Response } from 'express';
import { ExcelService } from '../services/excelService';
import { DocxService } from '../services/docxService';
import { EC2RecommendationService } from '../services/ec2RecommendationService';
import { AWSCalculatorService } from '../services/awsCalculatorService';
import { StorageService } from '../services/storageService';
import { ReportInput } from '../types';
import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'assessment-center-files-assessment-dashboard';

export class ReportController {
  private excelService: ExcelService;
  private docxService: DocxService;
  private ec2Service: EC2RecommendationService;
  private calculatorService: AWSCalculatorService;

  constructor() {
    this.excelService = new ExcelService();
    this.docxService = new DocxService();
    this.ec2Service = new EC2RecommendationService();
    this.calculatorService = new AWSCalculatorService();
  }

  uploadExcel = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      console.log('[UPLOAD] Start - Request received');

      if (!req.file) {
        console.log('[UPLOAD] Error - No file in request');
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      console.log(`[UPLOAD] File received - Size: ${req.file.buffer.length} bytes, Name: ${req.file.originalname}`);

      // Use buffer from memory storage (no filesystem access needed)
      const fileBuffer = req.file.buffer;

      // Parse Excel file from buffer
      console.log('[UPLOAD] Starting Excel parse...');
      const parseStart = Date.now();
      const excelData = this.excelService.parseExcelFromBuffer(fileBuffer);
      console.log(`[UPLOAD] Excel parsed in ${Date.now() - parseStart}ms`);

      // No cleanup needed - file is only in memory

      // Calculate summary
      const summary = {
        serverCount: excelData.servers.length,
        databaseCount: excelData.databases.length,
        applicationCount: excelData.applications.length,
        totalStorageGB: excelData.servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0),
        communicationCount: excelData.serverCommunications.length,
        securityGroupCount: excelData.securityGroups?.length || 0,
        dataSource: excelData.dataSource
      };

      console.log(`[UPLOAD] Success - Total time: ${Date.now() - startTime}ms`);
      console.log(`[UPLOAD] Data Source: ${excelData.dataSource}`);
      console.log(`[UPLOAD] Summary:`, summary);
      res.json({
        success: true,
        data: {
          excelData,
          summary
        }
      });
    } catch (error) {
      console.error(`[UPLOAD] Error after ${Date.now() - startTime}ms:`, error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse Excel file'
      });
    }
  };

  /**
   * Process Excel file from S3 (for direct S3 uploads)
   */
  uploadExcelFromS3 = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      console.log('[UPLOAD-S3] Start - Request received');

      const { key } = req.body;

      if (!key) {
        console.log('[UPLOAD-S3] Error - No S3 key provided');
        res.status(400).json({ success: false, error: 'S3 key is required' });
        return;
      }

      console.log(`[UPLOAD-S3] Fetching file from S3: ${key}`);

      // Get file from S3
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });

      const response = await s3Client.send(command);

      if (!response.Body) {
        throw new Error('No file content received from S3');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);

      console.log(`[UPLOAD-S3] File downloaded - Size: ${fileBuffer.length} bytes`);

      // Parse Excel file from buffer
      console.log('[UPLOAD-S3] Starting Excel parse...');
      const parseStart = Date.now();
      const excelData = this.excelService.parseExcelFromBuffer(fileBuffer);
      console.log(`[UPLOAD-S3] Excel parsed in ${Date.now() - parseStart}ms`);

      // Delete file from S3 after parsing (cleanup)
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });
      await s3Client.send(deleteCommand);
      console.log(`[UPLOAD-S3] Cleaned up S3 file: ${key}`);

      // Calculate summary
      const summary = {
        serverCount: excelData.servers.length,
        databaseCount: excelData.databases.length,
        applicationCount: excelData.applications.length,
        totalStorageGB: excelData.servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0),
        communicationCount: excelData.serverCommunications.length,
        securityGroupCount: excelData.securityGroups?.length || 0,
        dataSource: excelData.dataSource
      };

      // Save full excelData to S3 to avoid Lambda 6MB response limit
      const dataKey = `processed-data/${Date.now()}-${Math.random().toString(36).substring(7)}.json`;
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: dataKey,
        Body: JSON.stringify(excelData),
        ContentType: 'application/json'
      });
      await s3Client.send(putCommand);
      console.log(`[UPLOAD-S3] Saved full data to S3: ${dataKey}`);

      console.log(`[UPLOAD-S3] Success - Total time: ${Date.now() - startTime}ms`);
      console.log(`[UPLOAD-S3] Data Source: ${excelData.dataSource}`);
      console.log(`[UPLOAD-S3] Summary:`, summary);

      // Return only summary and dataKey to avoid 6MB Lambda response limit
      // Frontend can fetch full excelData from S3 using dataKey if needed
      res.json({
        success: true,
        data: {
          summary,
          dataKey,
          // Include only essential data for UI
          excelData: {
            dataSource: excelData.dataSource,
            servers: excelData.servers,
            databases: excelData.databases,
            applications: excelData.applications
            // Exclude large arrays: serverCommunications, securityGroups
          }
        }
      });
    } catch (error) {
      console.error(`[UPLOAD-S3] Error after ${Date.now() - startTime}ms:`, error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process Excel file from S3'
      });
    }
  };

  generateReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: ReportInput = req.body;

      // Validate input
      if (!input.clientName || !input.excelData) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
      }

      // Generate EC2 recommendations
      const ec2Recommendations = this.ec2Service.generateRecommendations(
        input.excelData.servers,
        input.awsRegion
      );

      // Generate database recommendations
      const dbRecommendations = this.ec2Service.generateDatabaseRecommendations(
        input.excelData.databases,
        input.awsRegion
      );

      // Calculate costs
      const costs = this.calculatorService.calculateCosts(
        ec2Recommendations,
        dbRecommendations,
        input.excelData.servers
      );

      // Generate calculator links
      const calculatorLinks = this.calculatorService.generateCalculatorLinks(
        input.awsRegion,
        ec2Recommendations,
        dbRecommendations
      );

      // Generate Word document
      const documentBuffer = await this.docxService.generateReport({
        ...input,
        ec2Recommendations,
        dbRecommendations,
        costs,
        calculatorLinks
      });

      // Save document (automatically uses S3 in production, local filesystem in development)
      const filename = `assessment-${input.clientName.replace(/\s+/g, '-')}-${Date.now()}.docx`;
      const fileKey = await StorageService.saveFile(
        filename,
        documentBuffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'generated'
      );

      // Get download URL (S3 signed URL in production, local path in development)
      const downloadUrl = await StorageService.getDownloadUrl(fileKey, 'generated');

      // Schedule file deletion after 1 hour
      StorageService.scheduleFileDeletion(fileKey, 'generated', 60 * 60 * 1000);

      res.json({
        success: true,
        data: {
          downloadUrl,
          calculatorLinks,
          summary: {
            totalServers: input.excelData.servers.length,
            totalDatabases: input.excelData.databases.length,
            totalApplications: input.excelData.applications.length,
            totalStorageGB: input.excelData.servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0),
            estimatedCosts: costs,
            ec2Recommendations,
            databaseRecommendations: dbRecommendations
          }
        }
      });
    } catch (error) {
      console.error('Generate report error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report'
      });
    }
  };

  downloadReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename } = req.params;

      // Check if file exists (works both local and S3)
      const exists = await StorageService.fileExists(filename, 'generated');

      if (!exists) {
        res.status(404).json({ success: false, error: 'File not found' });
        return;
      }

      // Get file (works both local and S3)
      const fileBuffer = await StorageService.getFile(filename, 'generated');

      // Set headers and send file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to download file'
      });
    }
  };
}
