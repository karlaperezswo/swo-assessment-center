import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ExcelService } from '../services/excelService';
import { S3Service } from '../services/s3Service';
import { AnonymizationService } from '../services/AnonymizationService';
import { BedrockService } from '../services/BedrockService';
import { OpportunityAnalyzerService } from '../services/OpportunityAnalyzerService';
import { OpportunityStorageService } from '../services/OpportunityStorageService';
import { getOpportunityStorage } from '../services/opportunityStorageFactory';
import { ExportService } from '../services/ExportService';
import { KnowledgeBaseService } from '../services/KnowledgeBaseService';
import { QuestionnaireParserService } from '../services/QuestionnaireParserService';
import { OpportunityJobService } from '../services/OpportunityJobService';
import { classifyAWSError, logAWSError } from '../utils/awsErrorHandler';
import {
  AnalyzeResponseBody,
  ListResponseBody,
  UpdateStatusResponseBody,
  ExportResponseBody,
  OpportunityStatus,
} from '../../../shared/types/opportunity.types';
import {
  CreateJobResponse,
  JobStatusResponse,
  JobResultResponse,
} from '../types/job';
import { getS3BucketName } from '../config/awsResources';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

export class OpportunityController {
  private pdfParser: any; // Lazy loaded
  private excelService: ExcelService;
  private anonymizationService: AnonymizationService;
  private bedrockService: BedrockService;
  private analyzerService: OpportunityAnalyzerService;
  private storage: OpportunityStorageService;
  private exportService: ExportService;
  private knowledgeBaseService: KnowledgeBaseService;
  private questionnaireParser: QuestionnaireParserService;

  constructor() {
    this.pdfParser = null; // Will be loaded on demand
    this.excelService = new ExcelService();
    this.anonymizationService = new AnonymizationService();
    this.bedrockService = new BedrockService();
    this.analyzerService = new OpportunityAnalyzerService();
    this.storage = getOpportunityStorage();
    this.exportService = new ExportService();
    this.knowledgeBaseService = new KnowledgeBaseService();
    this.questionnaireParser = new QuestionnaireParserService();
  }

  private async getPdfParser() {
    if (!this.pdfParser) {
      const { PdfParserService } = await import('../services/PdfParserService');
      this.pdfParser = new PdfParserService();
    }
    return this.pdfParser;
  }

  /**
   * POST /api/opportunities/get-upload-urls
   * Generate presigned URLs for direct S3 upload of MPA, MRA, and optional Questionnaire files
   */
  getUploadUrls = async (req: Request, res: Response): Promise<void> => {
    try {
      const { files } = req.body;

      if (!files || !Array.isArray(files) || files.length < 2) {
        res.status(400).json({
          success: false,
          error: 'At least 2 files required (mpaFile and mraFile)',
        });
        return;
      }

      console.log(`[GET-UPLOAD-URLS] Generating presigned URLs for ${files.length} files`);

      // Generate unique session ID for this upload
      const sessionId = uuidv4();

      // Strict allow-list per slot. We bind the S3 key to a server-decided
      // extension so a caller can't smuggle a different file type through the
      // upload URL by lying about Content-Type or filename.
      type SlotConfig = {
        fileType: 'mpa' | 'mra' | 'questionnaire';
        allowedContentTypes: string[];
        allowedExtensions: string[];
        // Extension chosen by the server based on the (validated) caller hint.
        extensionFor: (file: { filename: string; contentType: string }) => string;
      };
      const SLOTS: SlotConfig[] = [
        {
          fileType: 'mpa',
          allowedContentTypes: [
            'application/json',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
          ],
          allowedExtensions: ['.json', '.xlsx', '.xls'],
          extensionFor: (f) =>
            f.contentType === 'application/json' || f.filename.toLowerCase().endsWith('.json')
              ? 'json'
              : 'xlsx',
        },
        {
          fileType: 'mra',
          allowedContentTypes: ['application/pdf'],
          allowedExtensions: ['.pdf'],
          extensionFor: () => 'pdf',
        },
        {
          fileType: 'questionnaire',
          allowedContentTypes: [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
          allowedExtensions: ['.docx'],
          extensionFor: () => 'docx',
        },
      ];

      const lowerName = (n: string) => (typeof n === 'string' ? n.toLowerCase() : '');
      const validationErrors: string[] = [];

      const urlPromises = files.map(
        async (file: { filename: string; contentType: string }, index: number) => {
          if (index >= SLOTS.length) {
            validationErrors.push(`File at index ${index} is unexpected (max ${SLOTS.length - 1})`);
            return null;
          }
          const slot = SLOTS[index];
          const ct = (file.contentType ?? '').toLowerCase();
          const fname = lowerName(file.filename ?? '');
          const ctOk = slot.allowedContentTypes.includes(ct);
          const extOk = slot.allowedExtensions.some((e) => fname.endsWith(e));
          if (!ctOk || !extOk) {
            validationErrors.push(
              `Slot ${slot.fileType} (index ${index}) rejects content-type "${ct}" / filename "${fname}"`
            );
            return null;
          }

          const ext = slot.extensionFor(file);
          // Filename pattern is fully server-controlled — no caller-supplied
          // bytes end up in the S3 key.
          const key = `opportunities/${slot.fileType}-${sessionId}.${ext}`;

          const command = new PutObjectCommand({
            Bucket: getS3BucketName(),
            Key: key,
            // Use the validated content-type, never the raw header.
            ContentType: ct,
            ServerSideEncryption: 'AES256',
          });

          const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

          console.log(`[GET-UPLOAD-URLS] Generated URL for ${slot.fileType}: ${key}`);

          return { fileType: slot.fileType, uploadUrl, key };
        }
      );

      const urls = await Promise.all(urlPromises);

      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid file(s) for upload',
          details: validationErrors,
        });
        return;
      }

      // Organize URLs by file type
      const result: Record<string, string> = { sessionId };
      for (const item of urls) {
        if (!item) continue;
        result[`${item.fileType}Url`] = item.uploadUrl;
        result[`${item.fileType}Key`] = item.key;
      }

      console.log(`[GET-UPLOAD-URLS] Generated ${urls.length} presigned URLs for session ${sessionId}`);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[GET-UPLOAD-URLS] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate upload URLs',
      });
    }
  };

    /**
   * POST /api/opportunities/analyze
   * Start asynchronous analysis of MPA Excel, MRA PDF, and optional Questionnaire Word files
   * Returns immediately with a jobId for polling
   */
  analyze = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[ANALYZE] Request received for async processing');

      // Validate S3 keys are present
      const { mpaKey, mraKey, questionnaireKey } = req.body;

      console.log(
        `[ANALYZE] keys present: mpa=${!!mpaKey} mra=${!!mraKey} questionnaire=${!!questionnaireKey}`
      );
      
      if (!mpaKey || !mraKey) {
        console.log('[ANALYZE] Missing required S3 keys - returning 400');
        res.status(400).json({
          success: false,
          error: 'Both mpaKey and mraKey are required',
        });
        return;
      }

      // Create job with input data
      const jobInput = {
        files: [
          { filename: 'mpa', s3Key: mpaKey, contentType: mpaKey.endsWith('.json') ? 'application/json' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
          { filename: 'mra', s3Key: mraKey, contentType: 'application/pdf' },
        ],
      };

      if (questionnaireKey) {
        jobInput.files.push({
          filename: 'questionnaire',
          s3Key: questionnaireKey,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
      }

      console.log('[ANALYZE] Creating job...');
      const jobId = await OpportunityJobService.createJob(jobInput);
      console.log('[ANALYZE] Job created:', jobId);

      // Start background processing (don't await)
      OpportunityJobService.processJob(jobId).catch(err => {
        console.error('[ANALYZE] Background processing error:', err);
      });

      // Respond immediately with 202 Accepted
      const response: CreateJobResponse = {
        success: true,
        jobId,
        message: 'Analysis started. Use the status endpoint to check progress.',
        statusUrl: `/api/opportunities/status/${jobId}`,
        resultUrl: `/api/opportunities/result/${jobId}`,
      };

      console.log('[ANALYZE] Responding with 202 Accepted');
      res.status(202).json(response);
    } catch (error) {
      console.error('[ANALYZE] Error creating job:', error);
      const awsInfo = classifyAWSError(error);
      if (awsInfo.isCredentialError || awsInfo.isPermissionError) {
        logAWSError('ANALYZE', error);
        res.status(500).json({
          success: false,
          error: awsInfo.userMessage,
          hint: awsInfo.isCredentialError
            ? 'Run "aws configure" locally or assign an IAM Role in production.'
            : 'Add s3:PutObject, s3:GetObject and bedrock:InvokeModel permissions to your IAM user/role.',
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start analysis',
        });
      }
    }
  };

  /**
   * GET /api/opportunities/list
   * Retrieve opportunities with optional filters
   */
  list = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, priority, minARR, maxARR, status, search } = req.query;

      if (!sessionId || typeof sessionId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'sessionId is required',
        } as ListResponseBody);
        return;
      }

      // Build filters
      const filters: any = {};

      if (priority && typeof priority === 'string') {
        filters.priority = priority.split(',');
      }

      if (minARR && typeof minARR === 'string') {
        filters.minARR = parseInt(minARR, 10);
      }

      if (maxARR && typeof maxARR === 'string') {
        filters.maxARR = parseInt(maxARR, 10);
      }

      if (status && typeof status === 'string') {
        filters.status = status.split(',') as OpportunityStatus[];
      }

      if (search && typeof search === 'string') {
        filters.searchTerm = search;
      }

      // Retrieve opportunities
      const opportunities = await this.storage.getOpportunities(sessionId, filters);

      console.log(`[LIST] Retrieved ${opportunities.length} opportunities for session ${sessionId}`);

      res.json({
        success: true,
        data: {
          opportunities,
          total: opportunities.length,
        },
      } as ListResponseBody);
    } catch (error) {
      console.error('[LIST] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve opportunities',
      } as ListResponseBody);
    }
  };

  /**
   * PATCH /api/opportunities/:id/status
   * Update opportunity status
   */
  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Opportunity ID is required',
        } as UpdateStatusResponseBody);
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required',
        } as UpdateStatusResponseBody);
        return;
      }

      // Validate status
      const validStatuses: OpportunityStatus[] = [
        'Nueva',
        'En Progreso',
        'Ganada',
        'Perdida',
        'Descartada',
      ];

      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        } as UpdateStatusResponseBody);
        return;
      }

      // Update status
      await this.storage.updateStatus(id, status);

      // Retrieve updated opportunity
      const opportunity = await this.storage.getOpportunity(id);

      if (!opportunity) {
        res.status(404).json({
          success: false,
          error: 'Opportunity not found',
        } as UpdateStatusResponseBody);
        return;
      }

      console.log(`[UPDATE] Updated opportunity ${id} status to ${status}`);

      res.json({
        success: true,
        data: opportunity,
      } as UpdateStatusResponseBody);
    } catch (error) {
      console.error('[UPDATE] Error:', error);
      
      // Check if it's a not found error
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        } as UpdateStatusResponseBody);
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update status',
      } as UpdateStatusResponseBody);
    }
  };

  /**
   * Store file in S3 with encryption
   */
  private async storeFileInS3(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: getS3BucketName(),
      Key: `opportunities/${key}`,
      Body: buffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256', // Enable server-side encryption
    });

    await s3Client.send(command);
    console.log(`[S3] Stored file: opportunities/${key}`);
  }

  /**
   * POST /api/opportunities/export
   * Export sales playbook in PDF or Word format
   */
  export = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, format, opportunityIds } = req.body;

      // Validate required fields
      if (!sessionId || typeof sessionId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'sessionId is required',
        } as ExportResponseBody);
        return;
      }

      if (!format || (format !== 'pdf' && format !== 'docx')) {
        res.status(400).json({
          success: false,
          error: 'format must be either "pdf" or "docx"',
        } as ExportResponseBody);
        return;
      }

      console.log(`[EXPORT] Exporting playbook for session ${sessionId} in ${format} format`);

      // Retrieve opportunities
      let opportunities = await this.storage.getOpportunities(sessionId);

      if (opportunities.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No opportunities found for this session',
        } as ExportResponseBody);
        return;
      }

      // Filter by specific opportunity IDs if provided
      if (opportunityIds && Array.isArray(opportunityIds) && opportunityIds.length > 0) {
        opportunities = opportunities.filter(opp => opportunityIds.includes(opp.id));
        
        if (opportunities.length === 0) {
          res.status(404).json({
            success: false,
            error: 'No matching opportunities found',
          } as ExportResponseBody);
          return;
        }
      }

      console.log(`[EXPORT] Generating playbook with ${opportunities.length} opportunities`);

      // Generate playbook
      const fileKey = await this.exportService.generatePlaybook(opportunities, format);

      // Get download URL
      const downloadUrl = await this.exportService.getDownloadUrl(fileKey);

      // Calculate expiration time (1 hour from now)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // Extract filename from key
      const filename = fileKey.split('/').pop() || `playbook-${Date.now()}.${format}`;

      console.log(`[EXPORT] Playbook generated: ${filename}`);

      res.json({
        success: true,
        data: {
          downloadUrl,
          expiresAt,
          filename,
        },
      } as ExportResponseBody);
    } catch (error) {
      console.error('[EXPORT] Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export playbook',
      } as ExportResponseBody);
    }
  };


  /**
   * GET /api/opportunities/status/:jobId
   * Get the status of an analysis job
   */
  getJobStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        res.status(400).json({
          success: false,
          error: 'jobId is required',
        });
        return;
      }

      console.log('[GET-JOB-STATUS] Getting status for job:', jobId);

      // Get job from storage
      const job = await OpportunityJobService.getJob(jobId);

      const response: JobStatusResponse = {
        success: true,
        jobId: job.jobId,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        progress: job.progress,
      };

      if (job.status === 'failed' && job.error) {
        response.error = job.error;
      }

      console.log('[GET-JOB-STATUS] Job status:', job.status);

      res.json(response);
    } catch (error) {
      console.error('[GET-JOB-STATUS] Error:', error);

      // If job not found, return 404
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Job not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get job status',
      });
    }
  };

  /**
   * GET /api/opportunities/result/:jobId
   * Get the result of a completed analysis job
   */
  getJobResult = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        res.status(400).json({
          success: false,
          error: 'jobId is required',
        });
        return;
      }

      console.log('[GET-JOB-RESULT] Getting result for job:', jobId);

      // Get job from storage
      const job = await OpportunityJobService.getJob(jobId);

      // Check if job is completed
      if (job.status !== 'completed') {
        res.status(400).json({
          success: false,
          error: `Job is ${job.status}, not completed. Use the status endpoint to check progress.`,
        });
        return;
      }

      // Return result
      const response: JobResultResponse = {
        success: true,
        result: job.result,
      };

      console.log('[GET-JOB-RESULT] Returning result');

      res.json(response);
    } catch (error) {
      console.error('[GET-JOB-RESULT] Error:', error);

      // If job not found, return 404
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Job not found',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get job result',
      });
    }
  };

}

