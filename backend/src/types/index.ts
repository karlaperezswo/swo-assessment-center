// Re-export shared types
export * from '../../../shared/types/assessment.types';

// Backend-specific types
export interface EC2InstanceSpec {
  vcpus: number;
  memory: number; // GB
  storage: 'ebs' | 'instance';
  networkPerformance: string;
  monthlyPriceOnDemand: number;
  monthlyPrice1YearNuri: number;
  monthlyPrice3YearNuri: number;
}

export interface RDSInstanceSpec {
  vcpus: number;
  memory: number;
  monthlyPriceOnDemand: number;
  monthlyPrice1YearNuri: number;
  monthlyPrice3YearNuri: number;
}

export interface ReportGenerationInput {
  clientName: string;
  vertical: string;
  reportDate: string;
  awsRegion: string;
  totalServers: number;
  onPremisesCost: number;
  companyDescription: string;
  priorities: string[];
  migrationReadiness: string;
  excelData: {
    servers: any[];
    databases: any[];
    applications: any[];
    serverApplicationMappings: any[];
    serverCommunications: any[];
  };
  ec2Recommendations: any[];
  dbRecommendations: any[];
  costs: any;
  calculatorLinks: {
    onDemand: string;
    oneYearNuri: string;
    threeYearNuri: string;
  };
  // Multi-cloud — populated only when reportController ran the orchestrator
  // because more than one provider was selected. The docx generator appends
  // per-provider sections at the end of the document when these are present.
  selectedProviders?: import('../../../shared/types/cloud.types').CloudProvider[];
  multiCloud?: import('../../../shared/types/cloud.types').MultiCloudCostBreakdown;
  multiCloudByProvider?: import('./multiCloud').MultiCloudByProviderPayload;
}

