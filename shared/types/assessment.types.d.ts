export interface Server {
    serverId: string;
    hostname: string;
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
}
export interface Database {
    databaseId: string;
    dbName: string;
    instanceName: string;
    engineType: 'MSSQL' | 'PostgreSQL' | 'MySQL' | 'MariaDB' | 'Oracle' | string;
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
export interface ServerApplicationMapping {
    serverId: string;
    appId: string;
    hostname: string;
    applicationName: string;
}
export interface ServerCommunication {
    sourceServerId: string;
    targetServerId: string;
    sourceHostname: string;
    targetHostname: string;
    port: number;
    protocol: string;
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
export interface NetworkingConfig {
    vpcCount: number;
    natGatewayCount: number;
    dataTransferGB: number;
    monthlyEstimate: number;
}
export interface AWSCalculatorConfig {
    region: string;
    servers: EC2Recommendation[];
    databases: DatabaseRecommendation[];
    storage: StorageConfig;
    networking: NetworkingConfig;
}
export type ClientPriority = 'reduced_costs' | 'operational_resilience' | 'business_agility' | 'environment_updated' | 'modernize_databases' | 'security_compliance';
export type MigrationReadiness = 'ready' | 'evaluating' | 'not_ready';
export type IndustryVertical = 'Energy' | 'Insurance' | 'Healthcare' | 'Financial' | 'Retail' | 'Manufacturing' | 'Technology' | 'Other';
export type AWSRegion = 'us-east-1' | 'us-east-2' | 'us-west-1' | 'us-west-2' | 'eu-west-1' | 'eu-west-2' | 'eu-central-1' | 'ap-southeast-1' | 'ap-southeast-2' | 'ap-northeast-1' | 'sa-east-1';
export interface ExcelData {
    servers: Server[];
    databases: Database[];
    applications: Application[];
    serverApplicationMappings: ServerApplicationMapping[];
    serverCommunications: ServerCommunication[];
}
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
export interface CostEstimate {
    monthly: number;
    annual: number;
    threeYear: number;
}
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
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface UploadResponse {
    excelData: ExcelData;
    summary: {
        serverCount: number;
        databaseCount: number;
        applicationCount: number;
        totalStorageGB: number;
    };
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
//# sourceMappingURL=assessment.types.d.ts.map