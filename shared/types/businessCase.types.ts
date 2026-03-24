// Business Case Types
// Created: 2026-02-26 - Business Case Module

/**
 * OS Distribution by environment
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
 * Cloudamize server data
 */
export interface CloudamizeServer {
  serverId: string;
  hostname: string;
  osVersion: string;
  environment?: string; // Prod, Dev, QA
  instanceType?: string;
  vcpus?: number;
  memory?: number;
  storage?: number;
  monthlyOnDemand?: number;
  monthly1Year?: number;
  monthly3Year?: number;
  hasSQLServer?: boolean; // True if SQL Server is installed (from Databases/Caches column)
  sqlEdition?: string;   // Normalized SQL edition: Standard | Enterprise | Web
}

/**
 * Business Case data from Cloudamize
 */
export interface BusinessCaseData {
  dataSource: 'CLOUDAMIZE' | 'CONCIERTO' | 'MATILDA' | 'UNKNOWN';
  servers: CloudamizeServer[];
  osDistribution: OSDistribution[];
  summary: {
    totalServers: number;
    prodServers: number;
    devServers: number;
    qaServers: number;
  };
}

/**
 * Upload summary for Business Case
 */
export interface BusinessCaseUploadSummary {
  totalServers: number;
  prodServers: number;
  devServers: number;
  qaServers: number;
  osDistributionCount: number;
  dataSource: 'CLOUDAMIZE' | 'CONCIERTO' | 'MATILDA' | 'UNKNOWN';
}

/**
 * Upload response for Business Case
 */
export interface BusinessCaseUploadResponse {
  businessCaseData: BusinessCaseData;
  summary: BusinessCaseUploadSummary;
}

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
 * SQL Server Licensing Response
 */
export interface SQLLicensingResponse {
  sqlLicensing: SQLLicensingData[];
  summary: SQLLicensingSummary;
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
