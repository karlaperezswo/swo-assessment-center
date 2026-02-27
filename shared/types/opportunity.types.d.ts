export type OpportunityStatus = 'Nueva' | 'En Progreso' | 'Ganada' | 'Perdida' | 'Descartada';
export type OpportunityPriority = 'High' | 'Medium' | 'Low';
export type OpportunityCategory = 'Workshop' | 'Seguridad' | 'Optimización de Costos' | 'Confiabilidad' | 'Excelencia Operacional' | 'Eficiencia de Rendimiento' | 'Sostenibilidad' | 'Migración' | 'Modernización' | 'Otro';
export interface Opportunity {
    id: string;
    title: string;
    category: OpportunityCategory;
    priority: OpportunityPriority;
    estimatedARR: number;
    reasoning: string;
    evidence: string[];
    talkingPoints: string[];
    nextSteps: string[];
    relatedServices: string[];
    status: OpportunityStatus;
    createdAt: Date;
    updatedAt: Date;
}
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
export interface MraData {
    maturityLevel: number;
    securityGaps: string[];
    drStrategy: string;
    backupStrategy: string;
    complianceRequirements: string[];
    technicalDebt: string[];
    recommendations: string[];
    rawText: string;
}
export interface QuestionnaireData {
    clientName: string;
    industry: string;
    location: string;
    companySize: string;
    executiveContact: string;
    technicalContact: string;
    primaryDatacenter: string;
    secondaryDatacenters: string[];
    cloudProviders: string[];
    connectivity: string;
    criticalApplications: string[];
    databases: string[];
    middleware: string[];
    operatingSystems: string[];
    priorities: string[];
    complianceRequirements: string[];
    maintenanceWindows: string[];
    migrationRestrictions: string[];
    budget: string;
    timeline: string;
    licenseContracts: string[];
    endOfSupport: string[];
    currentProblems: string[];
    ongoingProjects: string[];
    teamSize: string;
    awsExperience: string;
    certifications: string[];
    currentSupport: string[];
    expectedGrowth: string;
    newMarkets: string[];
    digitalInitiatives: string[];
    kpis: string[];
    decisionDrivers: string[];
    rawText: string;
}
export interface KnowledgeBaseData {
    title: string;
    content: string;
    topics: string[];
    source: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface AnonymizationMapping {
    ipAddresses: Map<string, string>;
    hostnames: Map<string, string>;
    companyNames: Map<string, string>;
    locations: Map<string, string>;
    contacts: Map<string, string>;
    reverseMap: Map<string, string>;
}
export interface AnonymizedData {
    mpaData: any;
    mraData: Partial<MraData>;
    questionnaireData?: Partial<QuestionnaireData>;
    knowledgeBase?: KnowledgeBaseData;
    mapping: AnonymizationMapping;
}
export interface BedrockResponse {
    content: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
    modelId: string;
}
export interface OpportunityFilters {
    priority?: string[];
    minARR?: number;
    maxARR?: number;
    status?: OpportunityStatus[];
    searchTerm?: string;
}
export interface AnalysisRequest {
    mpaFile: Buffer;
    mraFile: Buffer;
    sessionId?: string;
}
export interface AnalysisResponse {
    sessionId: string;
    opportunities: Opportunity[];
    summary: {
        totalOpportunities: number;
        totalEstimatedARR: number;
        highPriorityCount: number;
    };
}
export interface ExportRequest {
    sessionId: string;
    format: 'pdf' | 'docx';
    opportunityIds?: string[];
}
export interface ExportResponse {
    downloadUrl: string;
    expiresAt: Date;
    filename: string;
}
export interface AnalyzeRequestBody {
}
export interface AnalyzeResponseBody {
    success: boolean;
    data?: AnalysisResponse;
    error?: string;
}
export interface ListRequestQuery {
    sessionId: string;
    priority?: string;
    minARR?: string;
    maxARR?: string;
    status?: string;
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
export interface UpdateStatusRequestBody {
    status: OpportunityStatus;
}
export interface UpdateStatusResponseBody {
    success: boolean;
    data?: Opportunity;
    error?: string;
}
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
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
        requestId: string;
    };
}
//# sourceMappingURL=opportunity.types.d.ts.map