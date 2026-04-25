// Type alias for the per-provider docx payload to avoid a long inline type
// in ReportGenerationInput.

import type {
  CloudProvider,
  ComputeRecommendation,
  CloudDatabaseRecommendation,
  ProviderCostBreakdown,
} from '../../../shared/types/cloud.types';

export interface ProviderRunResultPayload {
  provider: CloudProvider;
  region: string;
  compute: ComputeRecommendation[];
  databases: CloudDatabaseRecommendation[];
  cost: ProviderCostBreakdown;
}

export type MultiCloudByProviderPayload = Partial<Record<CloudProvider, ProviderRunResultPayload>>;
