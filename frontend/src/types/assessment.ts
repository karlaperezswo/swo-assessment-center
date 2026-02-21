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

export type MigrationPhase = 'assess' | 'mobilize' | 'migrate';

export type PhaseStatusValue = 'not_started' | 'in_progress' | 'completed';

export interface PhaseStatus {
  assess: PhaseStatusValue;
  mobilize: PhaseStatusValue;
  migrate: PhaseStatusValue;
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
