// Pure cost rollup — replaces the AWS-specific calculation in
// backend/src/services/awsCalculatorService.ts.
//
// Aggregates compute + managed DB + block storage + networking and applies
// each provider's commitment-discount function. Returns a ProviderCostBreakdown
// with the same shape regardless of which cloud is being modeled.

import type {
  ComputeRecommendation,
  CloudDatabaseRecommendation,
  CostEstimate,
  ProviderCostBreakdown,
  CloudProvider,
} from '../../../../shared/types/cloud.types';
import type { IPricingService, PricingFlags, PricingSubtotal } from '../types';

export interface CostCalculatorInput {
  provider: CloudProvider;
  computeRecs: readonly ComputeRecommendation[];
  dbRecs: readonly CloudDatabaseRecommendation[];
  totalBlockStorageGB: number;
  blockStoragePricePerGBMonth: number;
  pricing: IPricingService;
  flags?: PricingFlags;
}

function toEstimate(monthly: number): CostEstimate {
  return {
    monthly,
    annual: monthly * 12,
    threeYear: monthly * 36,
  };
}

export function calculateProviderCosts(input: CostCalculatorInput): ProviderCostBreakdown {
  const computeOnDemand = input.computeRecs.reduce((acc, r) => acc + r.monthlyEstimateOnDemand, 0);
  const computeOneYear  = input.computeRecs.reduce((acc, r) => acc + r.monthlyEstimateOneYear, 0);
  const computeThreeYr  = input.computeRecs.reduce((acc, r) => acc + r.monthlyEstimateThreeYear, 0);

  const dbOnDemand = input.dbRecs.reduce((acc, r) => acc + r.monthlyEstimateOnDemand, 0);
  const dbOneYear  = input.dbRecs.reduce((acc, r) => acc + r.monthlyEstimateOneYear, 0);
  const dbThreeYr  = input.dbRecs.reduce((acc, r) => acc + r.monthlyEstimateThreeYear, 0);

  const blockStorageMonthly = input.totalBlockStorageGB * input.blockStoragePricePerGBMonth;
  const networkingMonthly = (computeOnDemand + dbOnDemand) * input.pricing.networkingRatio;

  const buildSubtotal = (compute: number, db: number): PricingSubtotal => ({
    compute,
    managedDb: db,
    blockStorage: blockStorageMonthly,
    networking: networkingMonthly,
  });

  const onDemandMonthly = input.pricing.applyCommitmentDiscount(
    buildSubtotal(computeOnDemand, dbOnDemand),
    'on_demand',
    input.flags
  );
  const oneYearMonthly = input.pricing.applyCommitmentDiscount(
    buildSubtotal(computeOneYear, dbOneYear),
    'one_year',
    input.flags
  );
  const threeYearMonthly = input.pricing.applyCommitmentDiscount(
    buildSubtotal(computeThreeYr, dbThreeYr),
    'three_year',
    input.flags
  );

  return {
    provider: input.provider,
    onDemand: toEstimate(onDemandMonthly),
    oneYearCommit: toEstimate(oneYearMonthly),
    threeYearCommit: toEstimate(threeYearMonthly),
    componentBreakdown: {
      compute: computeOnDemand,
      managedDb: dbOnDemand,
      blockStorage: blockStorageMonthly,
      networking: networkingMonthly,
    },
  };
}
