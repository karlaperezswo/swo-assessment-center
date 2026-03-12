import { v4 as uuidv4 } from 'uuid';
import {
  Opportunity,
  RawOpportunity,
  BedrockResponse,
  AnonymizationMapping,
  OpportunityPriority,
} from '../../../shared/types/opportunity.types';
import { S3Service } from './s3Service';
import { ExcelService } from './excelService';
import { AnonymizationService } from './AnonymizationService';
import { BedrockService } from './BedrockService';
import { KnowledgeBaseService } from './KnowledgeBaseService';
import { QuestionnaireParserService } from './QuestionnaireParserService';
import { InMemoryOpportunityStorage } from './OpportunityStorageService';

export class OpportunityAnalyzerError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'OpportunityAnalyzerError';
  }
}

export class OpportunityAnalyzerService {
  private excelService: ExcelService;
  private anonymizationService: AnonymizationService;
  private bedrockService: BedrockService;
  private knowledgeBaseService: KnowledgeBaseService;
  private questionnaireParser: QuestionnaireParserService;
  private storage: InMemoryOpportunityStorage;
  private pdfParser: any; // Lazy loaded

  constructor() {
    this.excelService = new ExcelService();
    this.anonymizationService = new AnonymizationService();
    this.bedrockService = new BedrockService();
    this.knowledgeBaseService = new KnowledgeBaseService();
    this.questionnaireParser = new QuestionnaireParserService();
    this.storage = InMemoryOpportunityStorage.getInstance();
    this.pdfParser = null;
  }

  private async getPdfParser() {
    if (!this.pdfParser) {
      const { PdfParserService } = await import('./PdfParserService');
      this.pdfParser = new PdfParserService();
    }
    return this.pdfParser;
  }

  /**
   * Analyze opportunities from S3 files (for async processing)
   * @param files - Array of file metadata with S3 keys
   * @param clientInfo - Optional client information
   * @returns Analysis result with sessionId, opportunities, and summary
   */
  async analyzeOpportunities(
    files: Array<{ filename: string; s3Key: string; contentType: string }>,
    clientInfo?: any
  ): Promise<{ sessionId: string; opportunities: Opportunity[]; summary: any }> {
    console.log('[OpportunityAnalyzerService] ========== STARTING ANALYSIS ==========');
    console.log('[OpportunityAnalyzerService] Files:', files.length);

    // Extract file keys
    const mpaFile = files.find(f => f.filename === 'mpa');
    const mraFile = files.find(f => f.filename === 'mra');
    const questionnaireFile = files.find(f => f.filename === 'questionnaire');

    if (!mpaFile || !mraFile) {
      throw new Error('MPA and MRA files are required');
    }

    const mpaKey = mpaFile.s3Key;
    const mraKey = mraFile.s3Key;
    const questionnaireKey = questionnaireFile?.s3Key;

    // Extract session ID from keys (format: opportunities/mpa-{sessionId}.json)
    const sessionId = mpaKey.split('/')[1].split('-')[1].split('.')[0];
    console.log(`[OpportunityAnalyzerService] Session ID: ${sessionId}`);

    // Step 1: Read files from S3
    console.log('[OpportunityAnalyzerService] Reading files from S3...');
    const mpaBuffer = await S3Service.getFile(mpaKey);
    const mraBuffer = await S3Service.getFile(mraKey);
    console.log(`[OpportunityAnalyzerService] MPA file size: ${(mpaBuffer.length / 1024).toFixed(2)}KB`);
    console.log(`[OpportunityAnalyzerService] MRA file size: ${(mraBuffer.length / 1024).toFixed(2)}KB`);

    let questionnaireBuffer: Buffer | undefined;
    if (questionnaireKey) {
      questionnaireBuffer = await S3Service.getFile(questionnaireKey);
      console.log(`[OpportunityAnalyzerService] Questionnaire file size: ${(questionnaireBuffer.length / 1024).toFixed(2)}KB`);
    }

    // Step 2: Parse PDF
    console.log('[OpportunityAnalyzerService] Parsing PDF...');
    const pdfParser = await this.getPdfParser();
    const mraData = await pdfParser.parsePdf(mraBuffer);
    console.log(`[OpportunityAnalyzerService] PDF parsed: maturity level ${mraData.maturityLevel}, ${mraData.securityGaps.length} security gaps`);

    // Step 3: Parse MPA (Excel or JSON)
    console.log('[OpportunityAnalyzerService] Parsing MPA data...');
    let mpaData;

    try {
      // Check if MPA file is JSON or Excel based on key
      if (mpaKey.endsWith('.json')) {
        // Parse JSON directly
        console.log('[OpportunityAnalyzerService] Detected JSON format');
        const jsonString = mpaBuffer.toString('utf-8');
        console.log(`[OpportunityAnalyzerService] JSON string length: ${jsonString.length} characters`);
        mpaData = JSON.parse(jsonString);
        console.log(`[OpportunityAnalyzerService] MPA JSON parsed: ${mpaData.servers?.length || 0} servers, ${mpaData.databases?.length || 0} databases`);
      } else {
        // Parse Excel file
        console.log('[OpportunityAnalyzerService] Detected Excel format');
        mpaData = this.excelService.parseExcelFromBuffer(mpaBuffer);
        console.log(`[OpportunityAnalyzerService] Excel parsed: ${mpaData.servers?.length || 0} servers, ${mpaData.databases?.length || 0} databases`);
      }

      // Validate parsed data
      if (!mpaData || !mpaData.servers || !mpaData.databases) {
        throw new Error('Invalid MPA data structure: missing servers or databases arrays');
      }

      console.log(`[OpportunityAnalyzerService] MPA validation passed: ${mpaData.servers.length} servers, ${mpaData.databases.length} databases, ${mpaData.applications?.length || 0} applications`);
    } catch (parseError) {
      console.error('[OpportunityAnalyzerService] Error parsing MPA:', parseError);
      throw new Error(`Failed to parse MPA file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // Step 4: Parse Questionnaire (if provided)
    let questionnaireData;
    if (questionnaireBuffer) {
      console.log('[OpportunityAnalyzerService] Parsing Questionnaire...');
      questionnaireData = await this.questionnaireParser.parseQuestionnaire(questionnaireBuffer);
      console.log(`[OpportunityAnalyzerService] Questionnaire parsed: ${questionnaireData.priorities?.length || 0} priorities identified`);
    }

    // Step 5: Anonymize data
    console.log('[OpportunityAnalyzerService] Anonymizing data...');
    const anonymizedData = this.anonymizationService.anonymize(mpaData, mraData, questionnaireData);
    console.log(`[OpportunityAnalyzerService] Anonymized: ${anonymizedData.mapping.ipAddresses.size} IPs, ${anonymizedData.mapping.hostnames.size} hostnames`);
    if (questionnaireData) {
      console.log(`[OpportunityAnalyzerService] Questionnaire anonymized: ${anonymizedData.mapping.companyNames.size} companies, ${anonymizedData.mapping.locations.size} locations`);
    }

    // Step 6: Add knowledge base for Microsoft cost optimization
    console.log('[OpportunityAnalyzerService] Loading knowledge base...');
    const knowledgeBase = this.knowledgeBaseService.getMicrosoftCostOptimizationKnowledgeBase();
    anonymizedData.knowledgeBase = knowledgeBase;
    console.log(`[OpportunityAnalyzerService] Knowledge base loaded: ${knowledgeBase.title}`);

    // Step 7: Call Bedrock
    console.log('[OpportunityAnalyzerService] Calling Bedrock AI...');
    const bedrockResponse = await this.bedrockService.analyzeOpportunities(anonymizedData);
    console.log(`[OpportunityAnalyzerService] Bedrock response: ${bedrockResponse.usage.inputTokens} input tokens, ${bedrockResponse.usage.outputTokens} output tokens`);

    // Step 8: Parse opportunities
    console.log('[OpportunityAnalyzerService] Parsing opportunities...');
    const opportunities = this.parseOpportunities(
      bedrockResponse,
      anonymizedData.mapping
    );
    console.log(`[OpportunityAnalyzerService] Generated ${opportunities.length} opportunities`);

    // Step 9: Store opportunities
    await this.storage.storeOpportunities(opportunities, sessionId);

    // Step 10: Calculate summary
    const summary = {
      totalOpportunities: opportunities.length,
      totalEstimatedARR: opportunities.reduce((sum, opp) => sum + opp.estimatedARR, 0),
      highPriorityCount: opportunities.filter(opp => opp.priority === 'High').length,
    };

    console.log('[OpportunityAnalyzerService] Analysis complete');
    console.log(`[OpportunityAnalyzerService] Summary: ${summary.totalOpportunities} opportunities, ${summary.totalEstimatedARR.toLocaleString()} total ARR`);
    console.log('[OpportunityAnalyzerService] ========== ANALYSIS COMPLETE ==========');

    return {
      sessionId,
      opportunities,
      summary,
    };
  }

  /**
   * Parse Bedrock response into structured opportunities
   * @param response - Raw Bedrock response
   * @param mapping - Anonymization mapping for deanonymization
   * @returns Array of structured opportunities
   */
  parseOpportunities(
    response: BedrockResponse,
    mapping: AnonymizationMapping
  ): Opportunity[] {
    try {
      // Parse JSON response
      const rawOpportunities: RawOpportunity[] = JSON.parse(response.content);

      if (!Array.isArray(rawOpportunities)) {
        throw new OpportunityAnalyzerError('Bedrock response is not an array');
      }

      // Validate and enrich each opportunity
      const opportunities = rawOpportunities.map(raw => 
        this.validateOpportunity(raw, mapping)
      );

      // Sort by priority then ARR
      return this.sortOpportunities(opportunities);
    } catch (error) {
      if (error instanceof OpportunityAnalyzerError) {
        throw error;
      }
      throw new OpportunityAnalyzerError(
        `Failed to parse opportunities: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Validate and enrich opportunity data
   * @param opportunity - Raw opportunity from Bedrock
   * @param mapping - Anonymization mapping for deanonymization
   * @returns Validated and enriched opportunity
   */
  validateOpportunity(
    opportunity: RawOpportunity,
    mapping: AnonymizationMapping
  ): Opportunity {
    // Validate required fields
    if (!opportunity.title || typeof opportunity.title !== 'string') {
      throw new OpportunityAnalyzerError('Opportunity missing valid title');
    }

    if (!opportunity.category || typeof opportunity.category !== 'string') {
      throw new OpportunityAnalyzerError('Opportunity missing valid category');
    }

    if (!this.isValidPriority(opportunity.priority)) {
      throw new OpportunityAnalyzerError(
        `Invalid priority: ${opportunity.priority}. Must be High, Medium, or Low`
      );
    }

    if (typeof opportunity.estimatedARR !== 'number' || opportunity.estimatedARR <= 0) {
      throw new OpportunityAnalyzerError(
        `Invalid estimatedARR: ${opportunity.estimatedARR}. Must be a positive number`
      );
    }

    if (!opportunity.reasoning || typeof opportunity.reasoning !== 'string') {
      throw new OpportunityAnalyzerError('Opportunity missing valid reasoning');
    }

    if (!Array.isArray(opportunity.evidence) || opportunity.evidence.length < 2) {
      throw new OpportunityAnalyzerError(
        `Opportunity must have at least 2 evidence points, got ${opportunity.evidence?.length || 0}`
      );
    }

    if (!Array.isArray(opportunity.talkingPoints) || opportunity.talkingPoints.length < 3) {
      throw new OpportunityAnalyzerError(
        `Opportunity must have at least 3 talking points, got ${opportunity.talkingPoints?.length || 0}`
      );
    }

    if (!Array.isArray(opportunity.nextSteps) || opportunity.nextSteps.length < 2) {
      throw new OpportunityAnalyzerError(
        `Opportunity must have at least 2 next steps, got ${opportunity.nextSteps?.length || 0}`
      );
    }

    if (!Array.isArray(opportunity.relatedServices) || opportunity.relatedServices.length === 0) {
      throw new OpportunityAnalyzerError('Opportunity must have at least 1 related service');
    }

    // Deanonymize text fields
    const deanonymizedTitle = this.deanonymizeText(opportunity.title, mapping);
    const deanonymizedReasoning = this.deanonymizeText(opportunity.reasoning, mapping);
    const deanonymizedEvidence = opportunity.evidence.map(ev =>
      this.deanonymizeText(ev, mapping)
    );
    const deanonymizedTalkingPoints = opportunity.talkingPoints.map(point =>
      this.deanonymizeText(point, mapping)
    );
    const deanonymizedNextSteps = opportunity.nextSteps.map(step =>
      this.deanonymizeText(step, mapping)
    );

    // Create enriched opportunity
    const now = new Date();
    return {
      id: uuidv4(),
      title: deanonymizedTitle,
      category: opportunity.category as any, // Will be validated by TypeScript
      priority: opportunity.priority as OpportunityPriority,
      estimatedARR: opportunity.estimatedARR,
      reasoning: deanonymizedReasoning,
      evidence: deanonymizedEvidence,
      talkingPoints: deanonymizedTalkingPoints,
      nextSteps: deanonymizedNextSteps,
      relatedServices: opportunity.relatedServices,
      status: 'Nueva', // Initial status
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Check if priority value is valid
   */
  private isValidPriority(priority: string): boolean {
    return priority === 'High' || priority === 'Medium' || priority === 'Low';
  }

  /**
   * Deanonymize text by replacing tokens with original values
   */
  private deanonymizeText(text: string, mapping: AnonymizationMapping): string {
    let deanonymized = text;

    // Replace tokens with original values using reverse map
    for (const [token, original] of mapping.reverseMap.entries()) {
      const regex = new RegExp(this.escapeRegex(token), 'g');
      deanonymized = deanonymized.replace(regex, original);
    }

    return deanonymized;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Sort opportunities by priority then ARR
   * Priority order: High > Medium > Low
   */
  private sortOpportunities(opportunities: Opportunity[]): Opportunity[] {
    const priorityOrder: Record<OpportunityPriority, number> = {
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return opportunities.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Then sort by ARR (descending)
      return b.estimatedARR - a.estimatedARR;
    });
  }
}
