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
}
