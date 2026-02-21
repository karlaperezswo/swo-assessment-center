// Data source types
export type DataSourceType = 'AWS_MPA' | 'CONCIERTO' | 'MATILDA' | 'UNKNOWN';

// Server data from MPA Excel export
export interface Server {
  serverId: string;
  hostname: string;
  ipAddress?: string; // IP address for the server
  isPhysical: boolean;
  osName: string;
  osVersion: string;
  numCpus: number;
  numCoresPerCpu: number;
  numThreadsPerCore: number;
  totalRAM: number; // GB
  maxCpuUsage: number;
  avgCpuUsage: number;
  maxRamUsage: number;
  avgRamUsage: number;
  totalDiskSize: number; // GB
  storageUtilization: number;
  uptime: number;
  environment?: string; // Prod, Dev, UAT, SIT, DR
  vmFunctionality?: string; // VM Functionality description
  sqlEdition?: string; // SQL Server Edition if applicable
}

// Database data from MPA Excel export
export interface Database {
  databaseId: string;
  dbName: string;
  instanceName: string;
  engineType: 'MSSQL' | 'PostgreSQL' | 'MySQL' | 'MariaDB' | 'Oracle' | string;
  engineVersion: string;
  engineEdition: string;
  totalSize: number; // GB
  serverId: string;
  targetEngine?: string;
  licenseModel: string;
  maxTPS: number;
}

// Application data from MPA Excel export
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

// Server to Application mapping
export interface ServerApplicationMapping {
  serverId: string;
  appId: string;
  hostname: string;
  applicationName: string;
}

// Server Communication data
export interface ServerCommunication {
  sourceServerId: string;
  targetServerId: string;
  sourceHostname: string;
  targetHostname: string;
  sourceIpAddress?: string;
  targetIpAddress?: string;
  sourcePort?: number; // Source port for connection
  destinationPort: number; // Destination port (was 'port')
  protocol: string; // tcp, udp, icmp, etc.
  sourceEnvironment?: string; // Prod, Dev, UAT, etc.
  targetEnvironment?: string; // Prod, Dev, UAT, etc.
  connectionType?: 'Upstream' | 'Downstream' | 'Bidirectional';
  category?: string; // VMWareVMInstance, ComputerSystem, etc.
  sourceService?: string; // Service name if available
  sourceAppName?: string; // Application name for source
  targetAppName?: string; // Application name for target
}

// Security Group Rule derived from communications
export interface SecurityGroupRule {
  ruleId: string;
  direction: 'inbound' | 'outbound';
  protocol: string; // tcp, udp, icmp, all
  port?: number; // Specific port or undefined for all
  portRange?: { from: number; to: number }; // Port range
  source?: string; // CIDR, IP, or security group ID
  destination?: string; // CIDR, IP, or security group ID
  description: string;
  relatedApplications: string[]; // Apps using this rule
  relatedServers: string[]; // Servers using this rule
}

// Security Group for a server or application tier
export interface SecurityGroup {
  groupId: string;
  groupName: string;
  description: string;
  vpcId?: string;
  inboundRules: SecurityGroupRule[];
  outboundRules: SecurityGroupRule[];
  associatedServers: string[]; // Server IDs or hostnames
  associatedApplications: string[]; // Application names
  environment?: string; // Prod, Dev, etc.
}

// EC2 Instance recommendation
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

// Database recommendation for RDS
export interface DatabaseRecommendation {
  dbName: string;
  sourceEngine: string;
  targetEngine: string;
  instanceClass: string;
  storageGB: number;
  monthlyEstimate: number;
  licenseModel: string;
}

// Storage configuration
export interface StorageConfig {
  ebsVolumes: {
    type: 'gp3' | 'gp2' | 'io1' | 'io2' | 'st1' | 'sc1';
    sizeGB: number;
    iops?: number;
    throughput?: number;
  }[];
  totalGB: number;
  monthlyEstimate: number;
}

// Networking configuration
export interface NetworkingConfig {
  vpcCount: number;
  natGatewayCount: number;
  dataTransferGB: number;
  monthlyEstimate: number;
}

// AWS Calculator configuration
export interface AWSCalculatorConfig {
  region: string;
  servers: EC2Recommendation[];
  databases: DatabaseRecommendation[];
  storage: StorageConfig;
  networking: NetworkingConfig;
}

// Client priorities
export type ClientPriority =
  | 'reduced_costs'
  | 'operational_resilience'
  | 'business_agility'
  | 'environment_updated'
  | 'modernize_databases'
  | 'security_compliance';

// Migration readiness status
export type MigrationReadiness = 'ready' | 'evaluating' | 'not_ready';

// Industry verticals
export type IndustryVertical =
  | 'Energy'
  | 'Insurance'
  | 'Healthcare'
  | 'Financial'
  | 'Retail'
  | 'Manufacturing'
  | 'Technology'
  | 'Other';

// AWS Regions
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

// Excel parsed data
export interface ExcelData {
  dataSource: DataSourceType; // Type of data source
  servers: Server[];
  databases: Database[];
  applications: Application[];
  serverApplicationMappings: ServerApplicationMapping[];
  serverCommunications: ServerCommunication[];
  securityGroups?: SecurityGroup[]; // Generated security groups
}

// Report input from client form
export interface ReportInput {
  clientName: string;
  vertical: IndustryVertical;
  reportDate: string;
  awsRegion: AWSRegion;
  totalServers: number;
  onPremisesCost: number;
  companyDescription: string;
  priorities: ClientPriority[];
  migrationReadiness: MigrationReadiness;
  excelData: ExcelData;
}

// Cost estimation for different pricing models
export interface CostEstimate {
  monthly: number;
  annual: number;
  threeYear: number;
}

// Generated report output
export interface GeneratedReport {
  documentBuffer: Buffer;
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
    estimatedCosts: {
      onDemand: CostEstimate;
      oneYearNuri: CostEstimate;
      threeYearNuri: CostEstimate;
    };
    ec2Recommendations: EC2Recommendation[];
    databaseRecommendations: DatabaseRecommendation[];
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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

export interface UploadResponse {
  excelData: ExcelData;
  summary: UploadSummary;
}

export interface GenerateReportResponse {
  downloadUrl: string;
  calculatorLinks: {
    onDemand: string;
    oneYearNuri: string;
    threeYearNuri: string;
  };
  summary: GeneratedReport['summary'];
}
