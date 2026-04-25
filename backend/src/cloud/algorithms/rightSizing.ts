// Pure right-sizing + family-selection + SKU-picking algorithm.
// Extracted from backend/src/services/ec2RecommendationService.ts (lines 70-133)
// so it can be reused by any cloud provider with its own catalog.

import type {
  ComputeFamily,
  ComputeInstanceType,
  ComputeRecommendation,
  CloudProvider,
  NormalizedOS,
} from '../../../../shared/types/cloud.types';
import type { RecommendationInput } from '../types';

export interface RightSizingRules {
  veryLow: { cpuThreshold: number; ramThreshold: number; multiplier: number };
  low:     { cpuThreshold: number; ramThreshold: number; multiplier: number };
  floor:   { vcpus: number; ramGB: number };
}

export interface FamilySelectionRules {
  memoryOptimizedRatio: number;       // ≥ this ratio (RAM/vCPU) → memory_optimized
  computeOptimizedRatio: number;      // ≤ this ratio → compute_optimized
  burstableMaxVcpus: number;          // workload fits burstable when both bounds satisfied
  burstableMaxMemoryGB: number;
  fallbackFamily: ComputeFamily;
}

export const DEFAULT_RIGHT_SIZING: RightSizingRules = {
  veryLow: { cpuThreshold: 20, ramThreshold: 30, multiplier: 0.5 },
  low:     { cpuThreshold: 40, ramThreshold: 50, multiplier: 0.75 },
  floor:   { vcpus: 2, ramGB: 2 },
};

export const DEFAULT_FAMILY_RULES: FamilySelectionRules = {
  memoryOptimizedRatio: 8,
  computeOptimizedRatio: 2,
  burstableMaxVcpus: 4,
  burstableMaxMemoryGB: 16,
  fallbackFamily: 'general',
};

export function rightSize(
  input: RecommendationInput,
  rules: RightSizingRules = DEFAULT_RIGHT_SIZING
): { targetVcpus: number; targetRam: number; note: string } {
  const cpu = input.avgCpuUsage ?? 0;
  const ram = input.avgRamUsage ?? 0;

  if (cpu === 0 && ram === 0) {
    return { targetVcpus: input.totalVcpus, targetRam: input.totalRamGB, note: 'Direct match' };
  }

  if (cpu < rules.veryLow.cpuThreshold && ram < rules.veryLow.ramThreshold) {
    return {
      targetVcpus: Math.max(rules.floor.vcpus, Math.ceil(input.totalVcpus * rules.veryLow.multiplier)),
      targetRam:   Math.max(rules.floor.ramGB, Math.ceil(input.totalRamGB * rules.veryLow.multiplier)),
      note: `Rightsized (${rules.veryLow.multiplier * 100}%): Very low utilization detected`,
    };
  }

  if (cpu < rules.low.cpuThreshold && ram < rules.low.ramThreshold) {
    return {
      targetVcpus: Math.max(rules.floor.vcpus, Math.ceil(input.totalVcpus * rules.low.multiplier)),
      targetRam:   Math.max(rules.floor.ramGB, Math.ceil(input.totalRamGB * rules.low.multiplier)),
      note: `Rightsized (${rules.low.multiplier * 100}%): Low utilization detected`,
    };
  }

  return { targetVcpus: input.totalVcpus, targetRam: input.totalRamGB, note: 'Direct match' };
}

export function selectFamily(
  targetVcpus: number,
  targetRamGB: number,
  rules: FamilySelectionRules = DEFAULT_FAMILY_RULES
): ComputeFamily {
  const ratio = targetRamGB / Math.max(targetVcpus, 1);
  if (ratio >= rules.memoryOptimizedRatio) return 'memory_optimized';
  if (ratio <= rules.computeOptimizedRatio) return 'compute_optimized';
  if (targetVcpus <= rules.burstableMaxVcpus && targetRamGB <= rules.burstableMaxMemoryGB) return 'burstable';
  return rules.fallbackFamily;
}

export function pickBestSku(
  catalog: readonly ComputeInstanceType[],
  family: ComputeFamily,
  targetVcpus: number,
  targetRamGB: number,
  os: NormalizedOS
): ComputeInstanceType | null {
  let candidates = catalog.filter(
    (c) => c.family === family && c.vcpus >= targetVcpus && c.memoryGB >= targetRamGB
  );

  // Providers without burstable family (Oracle) fall back to general.
  if (candidates.length === 0 && family === 'burstable') {
    candidates = catalog.filter(
      (c) => c.family === 'general' && c.vcpus >= targetVcpus && c.memoryGB >= targetRamGB
    );
  }

  if (candidates.length === 0) return null;

  candidates.sort(
    (a, b) =>
      a.pricing.onDemandMonthlyUSD * (a.osMultipliers?.[os] ?? 1) -
      b.pricing.onDemandMonthlyUSD * (b.osMultipliers?.[os] ?? 1)
  );

  return candidates[0];
}

export function recommendCompute(
  input: RecommendationInput,
  catalog: readonly ComputeInstanceType[],
  provider: CloudProvider,
  rightSizingRules: RightSizingRules = DEFAULT_RIGHT_SIZING,
  familyRules: FamilySelectionRules = DEFAULT_FAMILY_RULES
): ComputeRecommendation {
  const sized = rightSize(input, rightSizingRules);
  const family = selectFamily(sized.targetVcpus, sized.targetRam, familyRules);

  const sku =
    pickBestSku(catalog, family, sized.targetVcpus, sized.targetRam, input.os) ??
    catalog.find((c) => c.family === 'general') ??
    catalog[0];

  const mult = sku.osMultipliers?.[input.os] ?? 1;

  return {
    provider,
    hostname: input.hostname,
    originalSpecs: {
      vcpus: input.totalVcpus,
      ram: input.totalRamGB,
      storage: input.totalDiskGB,
    },
    recommendedSku: sku.sku,
    family: sku.family,
    rightsizingNote: sized.note,
    monthlyEstimateOnDemand: sku.pricing.onDemandMonthlyUSD * mult,
    monthlyEstimateOneYear: sku.pricing.oneYearMonthlyUSD * mult,
    monthlyEstimateThreeYear: sku.pricing.threeYearMonthlyUSD * mult,
  };
}

// OS normalizer used by provider adapters when converting raw inventory `osName` strings.
export function normalizeOs(osName: string | undefined): NormalizedOS {
  const o = (osName ?? '').toLowerCase();
  if (o.includes('windows')) return 'windows';
  if (o.includes('rhel') || o.includes('red hat')) return 'rhel';
  if (o.includes('sles') || o.includes('suse')) return 'sles';
  return 'linux';
}
