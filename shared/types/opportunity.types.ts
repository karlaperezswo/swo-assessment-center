// Sales Opportunity Analyzer Types

// Opportunity status values
export type OpportunityStatus = 'Nueva' | 'En Progreso' | 'Ganada' | 'Perdida' | 'Descartada';

// Opportunity priority levels
export type OpportunityPriority = 'High' | 'Medium' | 'Low';

// Opportunity category (for grouping)
export type OpportunityCategory = 
  | 'Workshop'
  | 'Seguridad'
  | 'Optimización de Costos'
  | 'Confiabilidad'
  | 'Excelencia Operacional'
  | 'Eficiencia de Rendimiento'
  | 'Sostenibilidad'
  | 'Migración'
  | 'Modernización'
  | 'Otro';

// Core Opportunity entity
export interface Opportunity {
  id: string;
  title: string;
  category: OpportunityCategory;
  priority: OpportunityPriority;
  estimatedARR: number;
  reasoning: string;
  evidence: string[]; // Data-backed evidence from MPA/MRA
  talkingPoints: string[];
  nextSteps: string[];
  relatedServices: string[];
  status: OpportunityStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Raw opportunity from Bedrock (before enrichment)
export interface RawOpportunity {
  title: string;
  category: string;
  priority: string;
  estimatedARR: number;
  reasoning: string;
  evidence: string[];
  talkingPoints: string[];
  nextSteps: string[];
  relatedServices: string[];
}

// MRA parsed data from PDF
export interface MraData {
  maturityLevel: number; // 1-5
  securityGaps: string[];
  drStrategy: string;
  backupStrategy: string;
  complianceRequirements: string[];
  technicalDebt: string[];
  recommendations: string[];
  rawText: string; // Full extracted text
}

// Infrastructure Questionnaire data (from Word document)
export interface QuestionnaireData {
  // Client Information
  clientName: string;
  industry: string;
  location: string;
  companySize: string;
  executiveContact: string;
  technicalContact: string;
  
  // Infrastructure
  primaryDatacenter: string;
  secondaryDatacenters: string[];
  cloudProviders: string[];
  connectivity: string;
  
  // Workloads
  criticalApplications: string[];
  databases: string[];
  middleware: string[];
  operatingSystems: string[];
  
  // Priorities (ordered by importance)
  priorities: string[];
  
  // Constraints and Requirements
  complianceRequirements: string[];
  maintenanceWindows: string[];
  migrationRestrictions: string[];
  budget: string;
  timeline: string;
  
  // Current Situation
  licenseContracts: string[];
  endOfSupport: string[];
  currentProblems: string[];
  ongoingProjects: string[];
  
  // Team and Capabilities
  teamSize: string;
  awsExperience: string;
  certifications: string[];
  currentSupport: string[];
  
  // Business Objectives
  expectedGrowth: string;
  newMarkets: string[];
  digitalInitiatives: string[];
  kpis: string[];
  decisionDrivers: string[];
  
  // Raw text for additional context
  rawText: string;
}

// Knowledge Base data (cost optimization document)
export interface KnowledgeBaseData {
  title: string;
  content: string; // Summarized or full content
  topics: string[]; // Main topics covered
  source: string; // PDF filename or URL
}

// PDF validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Anonymization mapping
export interface AnonymizationMapping {
  ipAddresses: Map<string, string>; // original -> token
  hostnames: Map<string, string>;
  companyNames: Map<string, string>;
  locations: Map<string, string>; // locations -> token
  contacts: Map<string, string>; // contacts -> token
  reverseMap: Map<string, string>; // token -> original
}

// Anonymized data structure
export interface AnonymizedData {
  mpaData: any; // Partial ExcelData
  mraData: Partial<MraData>;
  questionnaireData?: Partial<QuestionnaireData>; // Optional questionnaire
  knowledgeBase?: KnowledgeBaseData; // Optional knowledge base
  mapping: AnonymizationMapping;
}

// Bedrock API response
export interface BedrockResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  modelId: string;
}

// Opportunity filters for retrieval
export interface OpportunityFilters {
  priority?: string[];
  minARR?: number;
  maxARR?: number;
  status?: OpportunityStatus[];
  searchTerm?: string;
}

// Analysis request
export interface AnalysisRequest {
  mpaFile: Buffer;
  mraFile: Buffer;
  sessionId?: string;
}

// Analysis response
export interface AnalysisResponse {
  sessionId: string;
  opportunities: Opportunity[];
  summary: {
    totalOpportunities: number;
    totalEstimatedARR: number;
    highPriorityCount: number;
  };
}

// Export request
export interface ExportRequest {
  sessionId: string;
  format: 'pdf' | 'docx';
  opportunityIds?: string[];
}

// Export response
export interface ExportResponse {
  downloadUrl: string;
  expiresAt: Date;
  filename: string;
}

// API Request/Response types

// POST /api/opportunities/analyze
export interface AnalyzeRequestBody {
  // Multipart form data - files handled by multer
}

export interface AnalyzeResponseBody {
  success: boolean;
  data?: AnalysisResponse;
  error?: string;
}

// GET /api/opportunities/list
export interface ListRequestQuery {
  sessionId: string;
  priority?: string; // Comma-separated: High,Medium,Low
  minARR?: string; // Number as string
  maxARR?: string;
  status?: string; // Comma-separated status values
  search?: string;
}

export interface ListResponseBody {
  success: boolean;
  data?: {
    opportunities: Opportunity[];
    total: number;
  };
  error?: string;
}

// PATCH /api/opportunities/:id/status
export interface UpdateStatusRequestBody {
  status: OpportunityStatus;
}

export interface UpdateStatusResponseBody {
  success: boolean;
  data?: Opportunity;
  error?: string;
}

// POST /api/opportunities/export
export interface ExportRequestBody {
  sessionId: string;
  format: 'pdf' | 'docx';
  opportunityIds?: string[];
}

export interface ExportResponseBody {
  success: boolean;
  data?: ExportResponse;
  error?: string;
}

// Error response format
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    requestId: string;
  };
}
