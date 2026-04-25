// AWS EC2 catalog. Literal port of the prices/specs hardcoded in
// backend/src/services/ec2RecommendationService.ts (lines 12-44, T3/M5/R5/C5).
// Pricing is us-east-1, Linux, on-demand × 730 hr/mo. Windows multiplier 1.8x.

import type { ComputeInstanceType } from '../../../../../shared/types/cloud.types';

export const AWS_COMPUTE: readonly ComputeInstanceType[] = Object.freeze([
  // T3 — Burstable
  { provider: 'aws', sku: 't3.micro',  displayName: 't3.micro',  family: 'burstable', vcpus: 2,  memoryGB: 1,   burstable: true,
    pricing: { onDemandMonthlyUSD: 7.59,    oneYearMonthlyUSD: 4.82,    threeYearMonthlyUSD: 3.07 },    osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 't3.small',  displayName: 't3.small',  family: 'burstable', vcpus: 2,  memoryGB: 2,   burstable: true,
    pricing: { onDemandMonthlyUSD: 15.18,   oneYearMonthlyUSD: 9.64,    threeYearMonthlyUSD: 6.13 },    osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 't3.medium', displayName: 't3.medium', family: 'burstable', vcpus: 2,  memoryGB: 4,   burstable: true,
    pricing: { onDemandMonthlyUSD: 30.37,   oneYearMonthlyUSD: 19.27,   threeYearMonthlyUSD: 12.26 },   osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 't3.large',  displayName: 't3.large',  family: 'burstable', vcpus: 2,  memoryGB: 8,   burstable: true,
    pricing: { onDemandMonthlyUSD: 60.74,   oneYearMonthlyUSD: 38.54,   threeYearMonthlyUSD: 24.53 },   osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 't3.xlarge', displayName: 't3.xlarge', family: 'burstable', vcpus: 4,  memoryGB: 16,  burstable: true,
    pricing: { onDemandMonthlyUSD: 121.47,  oneYearMonthlyUSD: 77.09,   threeYearMonthlyUSD: 49.06 },   osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 't3.2xlarge',displayName: 't3.2xlarge',family: 'burstable', vcpus: 8,  memoryGB: 32,  burstable: true,
    pricing: { onDemandMonthlyUSD: 242.94,  oneYearMonthlyUSD: 154.18,  threeYearMonthlyUSD: 98.11 },   osMultipliers: { windows: 1.8 } },

  // M5 — General Purpose
  { provider: 'aws', sku: 'm5.large',   displayName: 'm5.large',   family: 'general', vcpus: 2,  memoryGB: 8,   burstable: false,
    pricing: { onDemandMonthlyUSD: 70.08,   oneYearMonthlyUSD: 44.53,   threeYearMonthlyUSD: 29.57 },   osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'm5.xlarge',  displayName: 'm5.xlarge',  family: 'general', vcpus: 4,  memoryGB: 16,  burstable: false,
    pricing: { onDemandMonthlyUSD: 140.16,  oneYearMonthlyUSD: 89.06,   threeYearMonthlyUSD: 59.13 },   osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'm5.2xlarge', displayName: 'm5.2xlarge', family: 'general', vcpus: 8,  memoryGB: 32,  burstable: false,
    pricing: { onDemandMonthlyUSD: 280.32,  oneYearMonthlyUSD: 178.12,  threeYearMonthlyUSD: 118.26 },  osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'm5.4xlarge', displayName: 'm5.4xlarge', family: 'general', vcpus: 16, memoryGB: 64,  burstable: false,
    pricing: { onDemandMonthlyUSD: 560.64,  oneYearMonthlyUSD: 356.24,  threeYearMonthlyUSD: 236.52 },  osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'm5.8xlarge', displayName: 'm5.8xlarge', family: 'general', vcpus: 32, memoryGB: 128, burstable: false,
    pricing: { onDemandMonthlyUSD: 1121.28, oneYearMonthlyUSD: 712.48,  threeYearMonthlyUSD: 473.04 },  osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'm5.12xlarge',displayName: 'm5.12xlarge',family: 'general', vcpus: 48, memoryGB: 192, burstable: false,
    pricing: { onDemandMonthlyUSD: 1681.92, oneYearMonthlyUSD: 1068.72, threeYearMonthlyUSD: 709.56 },  osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'm5.16xlarge',displayName: 'm5.16xlarge',family: 'general', vcpus: 64, memoryGB: 256, burstable: false,
    pricing: { onDemandMonthlyUSD: 2242.56, oneYearMonthlyUSD: 1424.96, threeYearMonthlyUSD: 946.08 },  osMultipliers: { windows: 1.8 } },

  // R5 — Memory Optimized
  { provider: 'aws', sku: 'r5.large',    displayName: 'r5.large',    family: 'memory_optimized', vcpus: 2,  memoryGB: 16,  burstable: false,
    pricing: { onDemandMonthlyUSD: 91.98,   oneYearMonthlyUSD: 58.40,   threeYearMonthlyUSD: 38.69 },   osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'r5.xlarge',   displayName: 'r5.xlarge',   family: 'memory_optimized', vcpus: 4,  memoryGB: 32,  burstable: false,
    pricing: { onDemandMonthlyUSD: 183.96,  oneYearMonthlyUSD: 116.80,  threeYearMonthlyUSD: 77.38 },   osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'r5.2xlarge',  displayName: 'r5.2xlarge',  family: 'memory_optimized', vcpus: 8,  memoryGB: 64,  burstable: false,
    pricing: { onDemandMonthlyUSD: 367.92,  oneYearMonthlyUSD: 233.60,  threeYearMonthlyUSD: 154.75 },  osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'r5.4xlarge',  displayName: 'r5.4xlarge',  family: 'memory_optimized', vcpus: 16, memoryGB: 128, burstable: false,
    pricing: { onDemandMonthlyUSD: 735.84,  oneYearMonthlyUSD: 467.20,  threeYearMonthlyUSD: 309.50 },  osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'r5.8xlarge',  displayName: 'r5.8xlarge',  family: 'memory_optimized', vcpus: 32, memoryGB: 256, burstable: false,
    pricing: { onDemandMonthlyUSD: 1471.68, oneYearMonthlyUSD: 934.40,  threeYearMonthlyUSD: 619.01 },  osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'r5.12xlarge', displayName: 'r5.12xlarge', family: 'memory_optimized', vcpus: 48, memoryGB: 384, burstable: false,
    pricing: { onDemandMonthlyUSD: 2207.52, oneYearMonthlyUSD: 1401.60, threeYearMonthlyUSD: 928.51 },  osMultipliers: { windows: 1.8 } },

  // C5 — Compute Optimized
  { provider: 'aws', sku: 'c5.large',   displayName: 'c5.large',   family: 'compute_optimized', vcpus: 2,  memoryGB: 4,   burstable: false,
    pricing: { onDemandMonthlyUSD: 62.05,   oneYearMonthlyUSD: 39.42,   threeYearMonthlyUSD: 26.06 },   osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'c5.xlarge',  displayName: 'c5.xlarge',  family: 'compute_optimized', vcpus: 4,  memoryGB: 8,   burstable: false,
    pricing: { onDemandMonthlyUSD: 124.10,  oneYearMonthlyUSD: 78.84,   threeYearMonthlyUSD: 52.12 },   osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'c5.2xlarge', displayName: 'c5.2xlarge', family: 'compute_optimized', vcpus: 8,  memoryGB: 16,  burstable: false,
    pricing: { onDemandMonthlyUSD: 248.20,  oneYearMonthlyUSD: 157.68,  threeYearMonthlyUSD: 104.24 },  osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'c5.4xlarge', displayName: 'c5.4xlarge', family: 'compute_optimized', vcpus: 16, memoryGB: 32,  burstable: false,
    pricing: { onDemandMonthlyUSD: 496.40,  oneYearMonthlyUSD: 315.36,  threeYearMonthlyUSD: 208.48 },  osMultipliers: { windows: 1.8 } },
  { provider: 'aws', sku: 'c5.9xlarge', displayName: 'c5.9xlarge', family: 'compute_optimized', vcpus: 36, memoryGB: 72,  burstable: false,
    pricing: { onDemandMonthlyUSD: 1116.90, oneYearMonthlyUSD: 709.56,  threeYearMonthlyUSD: 469.08 },  osMultipliers: { windows: 1.8 } },
]);
