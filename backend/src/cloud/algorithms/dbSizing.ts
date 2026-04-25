// Pure database-sizing algorithm. Extracted from
// backend/src/services/ec2RecommendationService.ts (lines 139-186).
// Heuristic: instance class scales by total DB size in GB; storage at $0.08/GB/month.

import type {
  ManagedDbInstanceType,
  CloudDatabaseRecommendation,
  CloudProvider,
  ComputeFamily,
} from '../../../../shared/types/cloud.types';
import type { DbRecommendationInput } from '../types';

export interface DbSizingTier {
  /** Inclusive lower bound on total DB size in GB. The first tier whose `minSizeGB` is exceeded wins. */
  minSizeGB: number;
  /** Preferred family (memory_optimized for big DBs, general for mid, burstable for small). */
  family: ComputeFamily;
  /** Minimum required vcpus for the tier. SKU selection picks the cheapest catalog entry meeting this. */
  minVcpus: number;
  /** Minimum required memoryGB for the tier. */
  minMemoryGB: number;
}

// Default tiers preserve the AWS legacy heuristic exactly:
//   > 500 GB → db.r5.2xlarge  (memory, 8/64)
//   > 200 GB → db.r5.xlarge   (memory, 4/32)
//   > 100 GB → db.m5.xlarge   (general, 4/16)
//   >  50 GB → db.m5.large    (general, 2/8)
//   >  20 GB → db.t3.large    (burstable, 2/8)
//   else     → db.t3.medium   (burstable, 2/4)
export const DEFAULT_DB_TIERS: readonly DbSizingTier[] = Object.freeze([
  { minSizeGB: 500, family: 'memory_optimized', minVcpus: 8, minMemoryGB: 64 },
  { minSizeGB: 200, family: 'memory_optimized', minVcpus: 4, minMemoryGB: 32 },
  { minSizeGB: 100, family: 'general',          minVcpus: 4, minMemoryGB: 16 },
  { minSizeGB: 50,  family: 'general',          minVcpus: 2, minMemoryGB: 8 },
  { minSizeGB: 20,  family: 'burstable',        minVcpus: 2, minMemoryGB: 8 },
  { minSizeGB: 0,   family: 'burstable',        minVcpus: 2, minMemoryGB: 4 },
]);

export function selectDbTier(sizeGB: number, tiers: readonly DbSizingTier[] = DEFAULT_DB_TIERS): DbSizingTier {
  for (const tier of tiers) {
    if (sizeGB > tier.minSizeGB) return tier;
  }
  return tiers[tiers.length - 1];
}

export function pickBestDbSku(
  catalog: readonly ManagedDbInstanceType[],
  tier: DbSizingTier
): ManagedDbInstanceType | null {
  let candidates = catalog.filter(
    (c) => c.family === tier.family && c.vcpus >= tier.minVcpus && c.memoryGB >= tier.minMemoryGB
  );

  // Fallback when provider lacks the requested family (e.g., Oracle has no burstable DB).
  if (candidates.length === 0 && tier.family === 'burstable') {
    candidates = catalog.filter(
      (c) => c.family === 'general' && c.vcpus >= tier.minVcpus && c.memoryGB >= tier.minMemoryGB
    );
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.pricing.onDemandMonthlyUSD - b.pricing.onDemandMonthlyUSD);
  return candidates[0];
}

export interface DbRecommendOptions {
  storagePerGBMonth: number;          // gp3 equivalent — varies by provider ($0.08 AWS gp3, ~$0.17 GCP, ~$0.12 Azure, ~$0.0255 OCI)
  tiers?: readonly DbSizingTier[];
}

export function recommendDb(
  input: DbRecommendationInput,
  catalog: readonly ManagedDbInstanceType[],
  provider: CloudProvider,
  targetService: string,              // resolved by IDatabaseService.mapEngine()
  opts: DbRecommendOptions
): CloudDatabaseRecommendation {
  const tier = selectDbTier(input.totalSizeGB, opts.tiers);
  const sku =
    pickBestDbSku(catalog, tier) ??
    catalog.find((c) => c.family === 'general') ??
    catalog[0];

  const storageCost = input.totalSizeGB * opts.storagePerGBMonth;

  return {
    provider,
    dbName: input.dbName,
    sourceEngine: input.engineType,
    targetService,
    recommendedSku: sku.sku,
    storageGB: input.totalSizeGB,
    monthlyEstimateOnDemand: sku.pricing.onDemandMonthlyUSD + storageCost,
    monthlyEstimateOneYear: sku.pricing.oneYearMonthlyUSD + storageCost,
    monthlyEstimateThreeYear: sku.pricing.threeYearMonthlyUSD + storageCost,
    licenseModel: input.licenseModel || 'license-included',
  };
}
