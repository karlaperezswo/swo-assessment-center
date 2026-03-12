import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ExcelService } from '../services/excelService';
import { S3Service } from '../services/s3Service';
import { AnonymizationService } from '../services/AnonymizationService';
import { BedrockService } from '../services/BedrockService';
import { OpportunityAnalyzerService } from '../services/OpportunityAnalyzerService';
import { InMemoryOpportunityStorage } from '../services/OpportunityStorageService';
import { ExportService } from '../services/ExportService';
import { KnowledgeBaseService } from '../services/KnowledgeBaseService';
import { QuestionnaireParserService } from '../services/QuestionnaireParserService';
import {
  AnalyzeResponseBody,
  ListResponseBody,
  UpdateStatusResponseBody,
  ExportResponseBody,
  OpportunityStatus,
} from '../../../shared/types/opportunity.types';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'assessment-center-files-assessment-dashboard';

export class OpportunityController {
  private pdfParser: any; // Lazy loaded
  private excelService: ExcelService;
  private anonymizationService: AnonymizationService;
  private bedrockService: BedrockService;
  private analyzerService: OpportunityAnalyzerService;
  private storage: InMemoryOpportunityStorage;
  private exportService: ExportService;
  private knowledgeBaseService: KnowledgeBaseService;
  private questionnaireParser: QuestionnaireParserService;

  constructor() {
    this.pdfParser = null; // Will be loaded on demand
    this.excelService = new ExcelService();
    this.anonymizationService = new AnonymizationService();
    this.bedrockService = new BedrockService();
    this.analyzerService = new OpportunityAnalyzerService();
    this.storage = new InMemoryOpportunityStorage();
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

      // Generate presigned URLs for each file
      const urlPromises = files.map(async (file: { filename: string; contentType: string }, index: number) => {
        // Determine file type based on index or content type
        let fileType = 'unknown';
        let key = '';

        if (index === 0 || file.contentType === 'application/json' || file.filename.endsWith('.json') || file.filename.endsWith('.xlsx')) {
          fileType = 'mpa';
          key = `opportunities/mpa-${sessionId}.${file.filename.endsWith('.json') ? 'json' : 'xlsx'}`;
        } else if (index === 1 || file.contentType === 'application/pdf' || file.filename.endsWith('.pdf')) {
          fileType = 'mra';
          key = `opportunities/mra-${sessionId}.pdf`;
        } else if (index === 2 || file.contentType.includes('wordprocessingml') || file.filename.endsWith('.docx')) {
          fileType = 'questionnaire';
          key = `opportunities/questionnaire-${sessionId}.docx`;
        }

        // Create presigned URL for PUT operation (15 minutes expiry)
        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          ContentType: file.contentType
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

        console.log(`[GET-UPLOAD-URLS] Generated URL for ${fileType}: ${key}`);

        return {
          fileType,
          uploadUrl,
          key,
        };
      });

      const urls = await Promise.all(urlPromises);

      // Organize URLs by file type
      const result: any = { sessionId };
      urls.forEach(({ fileType, uploadUrl, key }) => {
        result[`${fileType}Url`] = uploadUrl;
        result[`${fileType}Key`] = key;
      });

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
   * Analyze MPA Excel, MRA PDF, and optional Questionnaire Word files to generate opportunities
   * Files are read from S3 using provided keys (after direct S3 upload)
   */
  analyze = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[ANALYZE] Request received');
      console.log('[ANALYZE] req.body:', req.body);
      
      // Validate S3 keys are present
      const { mpaKey, mraKey, questionnaireKey } = req.body;
      
      console.log('[ANALYZE] mpaKey present:', !!mpaKey);
      console.log('[ANALYZE] mraKey present:', !!mraKey);
      console.log('[ANALYZE] questionnaireKey present:', !!questionnaireKey);
      
      if (!mpaKey || !mraKey) {
        console.log('[ANALYZE] Missing required S3 keys - returning 400');
        res.status(400).json({
          success: false,
          error: 'Both mpaKey and mraKey are required',
        } as AnalyzeResponseBody);
        return;
      }

      console.log('[ANALYZE] Starting analysis...');
      console.log(`[ANALYZE] MPA key: ${mpaKey}`);
      console.log(`[ANALYZE] MRA key: ${mraKey}`);
      if (questionnaireKey) {
        console.log(`[ANALYZE] Questionnaire key: ${questionnaireKey}`);
      }

      // Extract session ID from keys (format: opportunities/mpa-{sessionId}.json)
      const sessionId = mpaKey.split('/')[1].split('-')[1].split('.')[0];
      console.log(`[ANALYZE] Session ID: ${sessionId}`);

      // Step 1: Read files from S3
      console.log('[ANALYZE] Reading files from S3...');
      const mpaBuffer = await S3Service.getFile(mpaKey);
      const mraBuffer = await S3Service.getFile(mraKey);
      console.log(`[ANALYZE] MPA file size: ${(mpaBuffer.length / 1024).toFixed(2)}KB`);
      console.log(`[ANALYZE] MRA file size: ${(mraBuffer.length / 1024).toFixed(2)}KB`);

      let questionnaireBuffer: Buffer | undefined;
      if (questionnaireKey) {
        questionnaireBuffer = await S3Service.getFile(questionnaireKey);
        console.log(`[ANALYZE] Questionnaire file size: ${(questionnaireBuffer.length / 1024).toFixed(2)}KB`);
      }

      // Validate file sizes (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (mpaBuffer.length > maxSize) {
        res.status(400).json({
          success: false,
          error: `MPA file exceeds 50MB limit (${(mpaBuffer.length / 1024 / 1024).toFixed(2)}MB)`,
        } as AnalyzeResponseBody);
        return;
      }

      if (mraBuffer.length > maxSize) {
        res.status(400).json({
          success: false,
          error: `MRA file exceeds 50MB limit (${(mraBuffer.length / 1024 / 1024).toFixed(2)}MB)`,
        } as AnalyzeResponseBody);
        return;
      }

      if (questionnaireBuffer && questionnaireBuffer.length > maxSize) {
        res.status(400).json({
          success: false,
          error: `Questionnaire file exceeds 50MB limit (${(questionnaireBuffer.length / 1024 / 1024).toFixed(2)}MB)`,
        } as AnalyzeResponseBody);
        return;
      }

      // Step 2: Parse PDF
      console.log('[ANALYZE] Parsing PDF...');
      const pdfParser = await this.getPdfParser();
      const mraData = await pdfParser.parsePdf(mraBuffer);
      console.log(`[ANALYZE] PDF parsed: maturity level ${mraData.maturityLevel}, ${mraData.securityGaps.length} security gaps`);

      // Step 3: Parse MPA (Excel or JSON)
      console.log('[ANALYZE] Parsing MPA data...');
      let mpaData;
      
      try {
        // Check if MPA file is JSON or Excel based on key
        if (mpaKey.endsWith('.json')) {
          // Parse JSON directly
          console.log('[ANALYZE] Detected JSON format');
          const jsonString = mpaBuffer.toString('utf-8');
          console.log(`[ANALYZE] JSON string length: ${jsonString.length} characters`);
          mpaData = JSON.parse(jsonString);
          console.log(`[ANALYZE] MPA JSON parsed: ${mpaData.servers?.length || 0} servers, ${mpaData.databases?.length || 0} databases`);
        } else {
          // Parse Excel file
          console.log('[ANALYZE] Detected Excel format');
          mpaData = this.excelService.parseExcelFromBuffer(mpaBuffer);
          console.log(`[ANALYZE] Excel parsed: ${mpaData.servers?.length || 0} servers, ${mpaData.databases?.length || 0} databases`);
        }
        
        // Validate parsed data
        if (!mpaData || !mpaData.servers || !mpaData.databases) {
          throw new Error('Invalid MPA data structure: missing servers or databases arrays');
        }
        
        console.log(`[ANALYZE] MPA validation passed: ${mpaData.servers.length} servers, ${mpaData.databases.length} databases, ${mpaData.applications?.length || 0} applications`);
      } catch (parseError) {
        console.error('[ANALYZE] Error parsing MPA:', parseError);
        throw new Error(`Failed to parse MPA file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      // Step 4: Parse Questionnaire (if provided)
      let questionnaireData;
      if (questionnaireBuffer) {
        console.log('[ANALYZE] Parsing Questionnaire...');
        questionnaireData = await this.questionnaireParser.parseQuestionnaire(questionnaireBuffer);
        console.log(`[ANALYZE] Questionnaire parsed: ${questionnaireData.priorities?.length || 0} priorities identified`);
      }

      // Step 5: Files are already in S3, no need to store again
      console.log('[ANALYZE] Files already stored in S3');

      // Step 6: Anonymize data
      console.log('[ANALYZE] Anonymizing data...');
      const anonymizedData = this.anonymizationService.anonymize(mpaData, mraData, questionnaireData);
      console.log(`[ANALYZE] Anonymized: ${anonymizedData.mapping.ipAddresses.size} IPs, ${anonymizedData.mapping.hostnames.size} hostnames`);
      if (questionnaireData) {
        console.log(`[ANALYZE] Questionnaire anonymized: ${anonymizedData.mapping.companyNames.size} companies, ${anonymizedData.mapping.locations.size} locations`);
      }

      // Step 6: Add knowledge base for Microsoft cost optimization
      console.log('[ANALYZE] Loading knowledge base...');
      const knowledgeBase = this.knowledgeBaseService.getMicrosoftCostOptimizationKnowledgeBase();
      anonymizedData.knowledgeBase = knowledgeBase;
      console.log(`[ANALYZE] Knowledge base loaded: ${knowledgeBase.title}`);

      // Step 7: Call Bedrock
      console.log('[ANALYZE] Calling Bedrock AI...');
      const bedrockResponse = await this.bedrockService.analyzeOpportunities(anonymizedData);
      console.log(`[ANALYZE] Bedrock response: ${bedrockResponse.usage.inputTokens} input tokens, ${bedrockResponse.usage.outputTokens} output tokens`);

      // Step 8: Parse opportunities
      console.log('[ANALYZE] Parsing opportunities...');
      const opportunities = this.analyzerService.parseOpportunities(
        bedrockResponse,
        anonymizedData.mapping
      );
      console.log(`[ANALYZE] Generated ${opportunities.length} opportunities`);

      // Step 9: Store opportunities
      await this.storage.storeOpportunities(opportunities, sessionId);

      // Step 10: Calculate summary
      const summary = {
        totalOpportunities: opportunities.length,
        totalEstimatedARR: opportunities.reduce((sum, opp) => sum + opp.estimatedARR, 0),
        highPriorityCount: opportunities.filter(opp => opp.priority === 'High').length,
      };

      console.log('[ANALYZE] Analysis complete');
      console.log(`[ANALYZE] Summary: ${summary.totalOpportunities} opportunities, $${summary.totalEstimatedARR.toLocaleString()} total ARR`);

      res.json({
        success: true,
        data: {
          sessionId,
          opportunities,
          summary,
        },
      } as AnalyzeResponseBody);
    } catch (error) {
      console.error('[ANALYZE] Error:', error);
      console.error('[ANALYZE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Provide more specific error messages
      let errorMessage = 'Analysis failed';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Add context based on error message
        if (error.message.includes('parse') || error.message.includes('JSON')) {
          errorMessage = `Error parsing files: ${error.message}. Please verify the file formats are correct.`;
        } else if (error.message.includes('Bedrock') || error.message.includes('AWS')) {
          errorMessage = `AWS Bedrock error: ${error.message}. Please check AWS credentials and permissions.`;
        } else if (error.message.includes('timeout')) {
          errorMessage = `Analysis timeout: ${error.message}. The dataset may be too large.`;
        } else if (error.message.includes('NoSuchKey') || error.message.includes('not found')) {
          errorMessage = `File not found in S3: ${error.message}. Please try uploading again.`;
        }
      }
      
      res.status(500).json({
        success: false,
        error: errorMessage,
      } as AnalyzeResponseBody);
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
      Bucket: BUCKET_NAME,
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
}

