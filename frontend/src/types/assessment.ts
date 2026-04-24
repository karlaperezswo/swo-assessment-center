// Data source types
export type DataSourceType = 'AWS_MPA' | 'CONCIERTO' | 'MATILDA' | 'UNKNOWN';

// Server data from MPA Excel export
export interface Server {
  serverId: string;
  hostname: string;
  ipAddress?: string;
  isPhysical: boolean;
  osName: string;
  osVersion: string;
  numCpus: number;
  numCoresPerCpu: number;
  numThreadsPerCore: number;
  totalRAM: number;
  maxCpuUsage: number;
  avgCpuUsage: number;
  maxRamUsage: number;
  avgRamUsage: number;
  totalDiskSize: number;
  storageUtilization: number;
  uptime: number;
  environment?: string;
  vmFunctionality?: string;
  sqlEdition?: string;
}

export interface Database {
  databaseId: string;
  dbName: string;
  instanceName: string;
  engineType: string;
  engineVersion: string;
  engineEdition: string;
  totalSize: number;
  serverId: string;
  targetEngine?: string;
  licenseModel: string;
  maxTPS: number;
}

export interface Application {
  appId: string;
  name: string;
  description: string;
  type: string;
  totalConnections: number;
  inboundConnections: number;
  outboundConnections: number;
  environmentType: string;
}

export interface ExcelData {
  dataSource: DataSourceType;
  servers: Server[];
  databases: Database[];
  applications: Application[];
  serverApplicationMappings: any[];
  serverCommunications: any[];
  securityGroups?: any[];
}

export interface EC2Recommendation {
  hostname: string;
  originalSpecs: {
    vcpus: number;
    ram: number;
    storage: number;
  };
  recommendedInstance: string;
  instanceFamily: string;
  rightsizingNote: string;
  monthlyEstimate: number;
}

export interface DatabaseRecommendation {
  dbName: string;
  sourceEngine: string;
  targetEngine: string;
  instanceClass: string;
  storageGB: number;
  monthlyEstimate: number;
  licenseModel: string;
}

export interface CostEstimate {
  monthly: number;
  annual: number;
  threeYear: number;
}

export interface CostBreakdown {
  onDemand: CostEstimate;
  oneYearNuri: CostEstimate;
  threeYearNuri: CostEstimate;
}

export type ClientPriority =
  | 'reduced_costs'
  | 'operational_resilience'
  | 'business_agility'
  | 'environment_updated'
  | 'modernize_databases'
  | 'security_compliance';

export type MigrationReadiness = 'ready' | 'evaluating' | 'not_ready';

export type IndustryVertical =
  | 'Energy'
  | 'Insurance'
  | 'Healthcare'
  | 'Financial'
  | 'Retail'
  | 'Manufacturing'
  | 'Technology'
  | 'Other';

export type AWSRegion =
  | 'us-east-1'
  | 'us-east-2'
  | 'us-west-1'
  | 'us-west-2'
  | 'eu-west-1'
  | 'eu-west-2'
  | 'eu-central-1'
  | 'ap-southeast-1'
  | 'ap-southeast-2'
  | 'ap-northeast-1'
  | 'sa-east-1';

export interface ClientFormData {
  clientName: string;
  vertical: IndustryVertical;
  reportDate: string;
  awsRegion: AWSRegion;
  totalServers: number;
  onPremisesCost: number;
  companyDescription: string;
  priorities: ClientPriority[];
  migrationReadiness: MigrationReadiness;
}

export interface UploadSummary {
  serverCount: number;
  databaseCount: number;
  applicationCount: number;
  totalStorageGB: number;
  communicationCount?: number;
  securityGroupCount?: number;
  dataSource: DataSourceType;
}

export interface GenerateReportResponse {
  downloadUrl: string;
  calculatorLinks: {
    onDemand: string;
    oneYearNuri: string;
    threeYearNuri: string;
  };
  summary: {
    totalServers: number;
    totalDatabases: number;
    totalApplications: number;
    totalStorageGB: number;
    estimatedCosts: CostBreakdown;
    ec2Recommendations: EC2Recommendation[];
    databaseRecommendations: DatabaseRecommendation[];
  };
}

// ============================================
// Phase Navigation Types
// ============================================

export type MigrationPhase = 'assess' | 'mobilize' | 'migrate' | 'tech-memory';

export type PhaseStatusValue = 'not_started' | 'in_progress' | 'completed';

export interface PhaseStatus {
  assess: PhaseStatusValue;
  mobilize: PhaseStatusValue;
  migrate: PhaseStatusValue;
  'tech-memory': PhaseStatusValue;
}

// ============================================
// Assess Phase Types
// ============================================

export interface BriefingSession {
  id: string;
  title: string;
  type: 'briefing' | 'workshop' | 'deep-dive';
  date: string;
  status: 'planned' | 'completed' | 'cancelled';
  attendees: number;
  notes: string;
}

export interface ImmersionDayPlan {
  id: string;
  topic: string;
  date: string;
  duration: string;
  objectives: string[];
  status: 'planned' | 'in_progress' | 'completed';
  deliverables: string[];
}

// ============================================
// Mobilize Phase Types
// ============================================

export interface MigrationWave {
  id: string;
  name: string;
  waveNumber: number;
  startDate: string;
  endDate: string;
  serverCount: number;
  applicationCount: number;
  status: 'planned' | 'in_progress' | 'completed' | 'blocked';
  strategy: string;
  notes: string;
  servers?: string[];
}

export interface SkillAssessment {
  id: string;
  skillArea: string;
  currentLevel: 'none' | 'basic' | 'intermediate' | 'advanced';
  targetLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  gap: number;
  trainingRecommendation: string;
}

export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  notes: string;
}

export interface LandingZoneChecklist {
  accountStructure: ChecklistItem[];
  networking: ChecklistItem[];
  security: ChecklistItem[];
  logging: ChecklistItem[];
  governance: ChecklistItem[];
}

export interface SecurityComplianceChecklist {
  identityAccess: ChecklistItem[];
  dataProtection: ChecklistItem[];
  networkSecurity: ChecklistItem[];
  compliance: ChecklistItem[];
  incidentResponse: ChecklistItem[];
}

// Business Case Types
// Added: 2026-02-26 - Business Case Module

/**
 * OS Distribution by Environment
 */
export interface OSDistribution {
  osVersion: string;
  prod: number;
  dev: number;
  qa: number;
  total: number;
  sqlCount?: number; // Servers with SQL Server (excluding Express/Developer)
}

/**
 * Cloudamize Server Data
 */
export interface CloudamizeServer {
  serverId: string;
  hostname: string;
  osVersion: string;
  environment?: string; // Prod, Dev, QA
  cpus?: number;
  ram?: number;
  storage?: number;
}

/**
 * Business Case Data from Cloudamize
 */
export interface BusinessCaseData {
  dataSource: 'CLOUDAMIZE' | 'CONCIERTO' | 'MATILDA' | 'UNKNOWN';
  servers: CloudamizeServer[];
  osDistribution: OSDistribution[];
}

/**
 * Business Case Client Data
 */
export interface BusinessCaseClientData {
  clientName: string;
  assessmentTool: 'Cloudamize' | 'Matilda' | 'Concierto' | 'AWS Migration Evaluator' | 'Otra';
  otherToolName?: string;
  vertical: 'Energy' | 'Insurance' | 'Healthcare' | 'Financial' | 'Retail' | 'Manufacturing' | 'Technology' | 'Other';
  reportDate: string;
  awsRegion: 'us-east-1' | 'us-east-2' | 'us-west-1' | 'us-west-2' | 'eu-west-1' | 'eu-west-2' | 'eu-central-1' | 'ap-southeast-1' | 'ap-southeast-2' | 'ap-northeast-1' | 'sa-east-1';
  totalServers: number;
  onPremisesCost: number;
  companyDescription: string;
  priorities: string[];
  migrationReadiness: 'ready' | 'evaluating' | 'not_ready';
}

/**
 * Business Case Upload Summary
 */
export interface BusinessCaseUploadSummary {
  totalServers: number;
  prodServers: number;
  devServers: number;
  qaServers: number;
  osDistributionCount: number;
  dataSource: string;
}

/**
 * Business Case Upload Response
 */
export interface BusinessCaseUploadResponse {
  businessCaseData: BusinessCaseData;
  summary: BusinessCaseUploadSummary;
  clientData?: BusinessCaseClientData;
}


// TCO 1 Year Types
// Added: 2026-02-27 - TCO 1 Year Module

/**
 * Resource Optimization data for TCO 1 Year
 */
export interface ResourceOptimization {
  resource: string;
  observed: number;
  recommendedProd: number;
  recommendedDev: number;
  recommendedQA: number;
  recommendedTotal: number;
  optimizationPercent: string; // Can be "NA" for Network
}

/**
 * TCO 1 Year data from Cloudamize
 */
export interface TCO1YearData {
  dataSource: 'CLOUDAMIZE' | 'CONCIERTO' | 'MATILDA' | 'UNKNOWN';
  resourceOptimization: ResourceOptimization[];
  migrationStrategies?: OSMigrationStrategy[];
  migrationSummary?: MigrationStrategySummary;
  sqlLicensing?: SQLLicensingData[];
  sqlLicensingSummary?: SQLLicensingSummary;
  instanceTypes?: InstanceTypeData[];
  networkTransfer?: NetworkTransferData[];
  supportRisk?: SupportRiskSummary;
}

/**
 * Upload response for TCO 1 Year
 */
export interface TCO1YearUploadResponse {
  tco1YearData: TCO1YearData;
  summary: {
    totalResources: number;
    dataSource: string;
  };
}

/**
 * Migration Strategy Categories
 */
export type MigrationCategory = 'Purchase' | 'Migrate' | 'Modernize';

/**
 * Migration Strategies
 */
export type MigrationStrategy = 
  | 'Repurchase'      // Purchase: Replace with SaaS
  | 'Retire'          // Purchase: Retire application
  | 'Retain'          // Purchase: Keep on-premises
  | 'Rehost'          // Migrate: Lift & Shift
  | 'Relocate'        // Migrate: Change location
  | 'Replatform'      // Migrate: Minor changes
  | 'Refactor';       // Modernize: Redesign for cloud

/**
 * OS Migration Strategy
 */
export interface OSMigrationStrategy {
  osVersion: string;
  count: number;
  category: MigrationCategory;
  strategy: MigrationStrategy;
  supported: boolean;
  notes?: string;
}

/**
 * Migration Strategy Summary
 */
export interface MigrationStrategySummary {
  totalServers: number;
  byCategory: {
    purchase: number;
    migrate: number;
    modernize: number;
  };
  byStrategy: {
    repurchase: number;
    retire: number;
    retain: number;
    rehost: number;
    relocate: number;
    replatform: number;
    refactor: number;
  };
}

/**
 * Persisted state for the Business Case module.
 * Lifted to AssessPhase so data survives tab navigation.
 */
export interface BusinessCasePersistedState {
  businessCaseData: BusinessCaseUploadResponse | null;
  tco1YearData: TCO1YearUploadResponse | null;
  carbonReportData: CarbonReportUploadResponse | null;
  businessCaseFileName: string;
  tco1YearFileName: string;
  carbonReportFileName: string;
  assessmentTool: string;
  clientData: BusinessCaseClientData;
  onDemandAsIs: number;
  oneYearOptimized: number;
  threeYearOptimized: number;
  onDemandAsIsRDS: number;
  oneYearOptimizedRDS: number;
  threeYearOptimizedRDS: number;
  enableRDSScenario: boolean;
}

/**
 * Carbon Report Data
 */
export interface CarbonReportData {
  currentUsage: number;      // kgCO2eq - Current usage
  awsUsage: number;          // kgCO2eq - AWS usage
  savings: number;           // kgCO2eq - Carbon savings
  savingsPercent: number;    // Percentage of savings
}

/**
 * Upload response for Carbon Report
 */
export interface CarbonReportUploadResponse {
  carbonData: CarbonReportData;
  summary: {
    totalCurrentUsage: number;
    totalAWSUsage: number;
    totalSavings: number;
    savingsPercent: number;
  };
}

/**
 * SQL Server Edition Licensing Data
 */
export interface SQLLicensingData {
  edition: string;                    // SQL Server edition (Enterprise, Standard, etc.)
  observedVCPUs: number;             // Total observed vCPUs for this edition
  recommendedVCPUs: number;          // Total recommended vCPUs for this edition
  optimizationPercent: number;       // Percentage of optimization
  listPrice: number;                 // Price per 2 cores (USD)
  observedCost: number;              // Cost for observed vCPUs
  recommendedCost: number;           // Cost for recommended vCPUs
  savings: number;                   // Cost savings
  savingsPercent: number;            // Percentage of savings
  isOutOfSupport: boolean;           // True if version is out of support
}

/**
 * SQL Server Licensing Summary
 */
export interface SQLLicensingSummary {
  totalObservedVCPUs: number;
  totalRecommendedVCPUs: number;
  totalOptimizationPercent: number;
  totalObservedCost: number;
  totalRecommendedCost: number;
  totalSavings: number;
  totalSavingsPercent: number;
  totalSQLServers: number;           // Total servers with SQL Server
  totalDeveloperServers: number;     // Servers with Developer Edition (free)
  totalExpressServers: number;       // Servers with Express Edition (free)
}

/**
 * Default SQL Server Prices (Microsoft Official - per 2 cores)
 */
export const DEFAULT_SQL_PRICES: { [key: string]: number } = {
  'Enterprise': 15123,
  'Standard': 3945,
  'Web': 0,           // Consultar con hosting partner
  'Developer': 0,     // Gratis
  'Express': 0        // Gratis
};

/**
 * Instance Type Data
 */
export interface InstanceTypeData {
  instanceType: string;    // EC2 instance type (e.g., t3.medium, m5.large)
  count: number;           // Number of servers using this instance type
  percentage: number;      // Percentage of total instances
}

/**
 * Network Transfer Data
 */
export interface NetworkTransferData {
  serverName: string;      // Server hostname or identifier
  transferGB: number;      // GB/month leaving server
  percentage: number;      // Percentage of total transfer
}

/**
 * Support Risk Level
 */
export type SupportRiskLevel = 'High' | 'Med' | 'Low';

/**
 * Support Cycle Status
 */
export type SupportCycleStatus = 'Unsupported' | 'Extended Support' | 'Mainstream Support' | 'Supported';

/**
 * OS Support Risk Data
 */
export interface OSSupportRiskData {
  version: string;                    // OS version (e.g., "Windows Server 2019", "SQL Server 2016")
  count: number;                      // Number of servers with this version
  percentage: number;                 // Percentage of total in category
  supportCycle: SupportCycleStatus;   // Current support status
  endOfSupport: string;               // End of support date (YYYY-MM-DD or "---")
  risk: SupportRiskLevel;             // Risk level
}

/**
 * Support Risk Summary by Category
 */
export interface SupportRiskSummary {
  windowsServers: OSSupportRiskData[];
  sqlServers: OSSupportRiskData[];
  linuxServers: OSSupportRiskData[];
}

