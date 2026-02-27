import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PdfParserService } from '../services/PdfParserService';
import { ExcelService } from '../services/excelService';
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
  private pdfParser: PdfParserService;
  private excelService: ExcelService;
  private anonymizationService: AnonymizationService;
  private bedrockService: BedrockService;
  private analyzerService: OpportunityAnalyzerService;
  private storage: InMemoryOpportunityStorage;
  private exportService: ExportService;
  private knowledgeBaseService: KnowledgeBaseService;
  private questionnaireParser: QuestionnaireParserService;

  constructor() {
    this.pdfParser = new PdfParserService();
    this.excelService = new ExcelService();
    this.anonymizationService = new AnonymizationService();
    this.bedrockService = new BedrockService();
    this.analyzerService = new OpportunityAnalyzerService();
    this.storage = new InMemoryOpportunityStorage();
    this.exportService = new ExportService();
    this.knowledgeBaseService = new KnowledgeBaseService();
    this.questionnaireParser = new QuestionnaireParserService();
  }

  /**
   * POST /api/opportunities/analyze
   * Analyze MPA Excel, MRA PDF, and optional Questionnaire Word files to generate opportunities
   */
  analyze = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[ANALYZE] Request received');
      console.log('[ANALYZE] req.files:', req.files);
      console.log('[ANALYZE] req.body:', req.body);
      
      // Validate files are present
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      console.log('[ANALYZE] Parsed files:', files);
      console.log('[ANALYZE] mpaFile present:', !!files?.mpaFile);
      console.log('[ANALYZE] mraFile present:', !!files?.mraFile);
      console.log('[ANALYZE] questionnaireFile present:', !!files?.questionnaireFile);
      
      if (!files || !files.mpaFile || !files.mraFile) {
        console.log('[ANALYZE] Missing required files - returning 400');
        res.status(400).json({
          success: false,
          error: 'Both mpaFile and mraFile are required',
        } as AnalyzeResponseBody);
        return;
      }

      const mpaFile = files.mpaFile[0];
      const mraFile = files.mraFile[0];
      const questionnaireFile = files.questionnaireFile ? files.questionnaireFile[0] : undefined;

      // Validate file sizes (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (mpaFile.size > maxSize) {
        res.status(400).json({
          success: false,
          error: `MPA file exceeds 50MB limit (${(mpaFile.size / 1024 / 1024).toFixed(2)}MB)`,
        } as AnalyzeResponseBody);
        return;
      }

      if (mraFile.size > maxSize) {
        res.status(400).json({
          success: false,
          error: `MRA file exceeds 50MB limit (${(mraFile.size / 1024 / 1024).toFixed(2)}MB)`,
        } as AnalyzeResponseBody);
        return;
      }

      if (questionnaireFile && questionnaireFile.size > maxSize) {
        res.status(400).json({
          success: false,
          error: `Questionnaire file exceeds 50MB limit (${(questionnaireFile.size / 1024 / 1024).toFixed(2)}MB)`,
        } as AnalyzeResponseBody);
        return;
      }

      console.log('[ANALYZE] Starting analysis...');
      console.log(`[ANALYZE] MPA file: ${mpaFile.originalname} (${(mpaFile.size / 1024).toFixed(2)}KB)`);
      console.log(`[ANALYZE] MRA file: ${mraFile.originalname} (${(mraFile.size / 1024).toFixed(2)}KB)`);
      if (questionnaireFile) {
        console.log(`[ANALYZE] Questionnaire file: ${questionnaireFile.originalname} (${(questionnaireFile.size / 1024).toFixed(2)}KB)`);
      }

      // Generate session ID
      const sessionId = uuidv4();

      // Step 1: Parse PDF
      console.log('[ANALYZE] Parsing PDF...');
      const mraData = await this.pdfParser.parsePdf(mraFile.buffer);
      console.log(`[ANALYZE] PDF parsed: maturity level ${mraData.maturityLevel}, ${mraData.securityGaps.length} security gaps`);

      // Step 2: Parse MPA (Excel or JSON)
      console.log('[ANALYZE] Parsing MPA data...');
      let mpaData;
      
      try {
        // Check if MPA file is JSON (from frontend) or Excel
        if (mpaFile.mimetype === 'application/json' || mpaFile.originalname.endsWith('.json')) {
          // Parse JSON directly
          console.log('[ANALYZE] Detected JSON format');
          const jsonString = mpaFile.buffer.toString('utf-8');
          console.log(`[ANALYZE] JSON string length: ${jsonString.length} characters`);
          mpaData = JSON.parse(jsonString);
          console.log(`[ANALYZE] MPA JSON parsed: ${mpaData.servers?.length || 0} servers, ${mpaData.databases?.length || 0} databases`);
        } else {
          // Parse Excel file
          console.log('[ANALYZE] Detected Excel format');
          console.log(`[ANALYZE] Excel file size: ${(mpaFile.size / 1024).toFixed(2)}KB`);
          mpaData = this.excelService.parseExcelFromBuffer(mpaFile.buffer);
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

      // Step 3: Parse Questionnaire (if provided)
      let questionnaireData;
      if (questionnaireFile) {
        console.log('[ANALYZE] Parsing Questionnaire...');
        questionnaireData = await this.questionnaireParser.parseQuestionnaire(questionnaireFile.buffer);
        console.log(`[ANALYZE] Questionnaire parsed: ${questionnaireData.priorities?.length || 0} priorities identified`);
      }

      // Step 4: Store files in S3 (with encryption)
      console.log('[ANALYZE] Storing files in S3...');
      const s3Promises = [
        this.storeFileInS3(mpaFile.buffer, `mpa-${sessionId}.${mpaFile.originalname.endsWith('.json') ? 'json' : 'xlsx'}`, mpaFile.mimetype),
        this.storeFileInS3(mraFile.buffer, `mra-${sessionId}.pdf`, mraFile.mimetype),
      ];
      
      if (questionnaireFile) {
        s3Promises.push(
          this.storeFileInS3(questionnaireFile.buffer, `questionnaire-${sessionId}.docx`, questionnaireFile.mimetype)
        );
      }
      
      await Promise.all(s3Promises);

      // Step 5: Anonymize data
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

