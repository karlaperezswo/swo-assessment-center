// OCI Compute catalog. us-ashburn-1 Linux PAYG × 730 hr/mo.
// OCI Flex shapes are configurable (1 OCPU = 2 vCPUs equivalent on x86; 1 OCPU
// = 1 vCPU on Ampere ARM). We model representative configurations equivalent to
// AWS T3/M5/R5/C5 sizes for like-for-like compare.
//
// Family mapping (no native burstable in OCI — burstable workloads fall back to general):
//   VM.Standard.A1.Flex  (Ampere ARM)  → general (cost-optimized)
//   VM.Standard.E4.Flex  (AMD x86)     → general (mainstream)
//   VM.Optimized3.Flex   (Intel x86)   → compute_optimized
//   VM.Standard.E5.Flex with high RAM  → memory_optimized
// Windows multiplier ~1.6x reflects OCI BYOL-friendly Windows licensing.

import type { ComputeInstanceType } from '../../../../../shared/types/cloud.types';

export const ORACLE_COMPUTE: readonly ComputeInstanceType[] = Object.freeze([
  // Ampere A1.Flex (ARM) — small/cheap baseline; substitute for burstable
  { provider: 'oracle', sku: 'VM.Standard.A1.Flex-1-6',  displayName: 'A1.Flex 1OCPU/6GB',  family: 'general', vcpus: 1,  memoryGB: 6,   burstable: false, archHint: 'arm',
    pricing: { onDemandMonthlyUSD: 7.30,    oneYearMonthlyUSD: 5.40,   threeYearMonthlyUSD: 4.38 } },
  { provider: 'oracle', sku: 'VM.Standard.A1.Flex-2-12', displayName: 'A1.Flex 2OCPU/12GB', family: 'general', vcpus: 2,  memoryGB: 12,  burstable: false, archHint: 'arm',
    pricing: { onDemandMonthlyUSD: 14.60,   oneYearMonthlyUSD: 10.79,  threeYearMonthlyUSD: 8.76 } },
  { provider: 'oracle', sku: 'VM.Standard.A1.Flex-4-24', displayName: 'A1.Flex 4OCPU/24GB', family: 'general', vcpus: 4,  memoryGB: 24,  burstable: false, archHint: 'arm',
    pricing: { onDemandMonthlyUSD: 29.20,   oneYearMonthlyUSD: 21.59,  threeYearMonthlyUSD: 17.52 } },
  { provider: 'oracle', sku: 'VM.Standard.A1.Flex-8-48', displayName: 'A1.Flex 8OCPU/48GB', family: 'general', vcpus: 8,  memoryGB: 48,  burstable: false, archHint: 'arm',
    pricing: { onDemandMonthlyUSD: 58.40,   oneYearMonthlyUSD: 43.18,  threeYearMonthlyUSD: 35.04 } },

  // E4.Flex (AMD) — General Purpose
  { provider: 'oracle', sku: 'VM.Standard.E4.Flex-2-16',  displayName: 'E4.Flex 2OCPU/16GB',   family: 'general', vcpus: 2,  memoryGB: 16,  burstable: false,
    pricing: { onDemandMonthlyUSD: 36.50,   oneYearMonthlyUSD: 27.01,  threeYearMonthlyUSD: 24.45 },  osMultipliers: { windows: 1.6 } },
  { provider: 'oracle', sku: 'VM.Standard.E4.Flex-4-32',  displayName: 'E4.Flex 4OCPU/32GB',   family: 'general', vcpus: 4,  memoryGB: 32,  burstable: false,
    pricing: { onDemandMonthlyUSD: 73.00,   oneYearMonthlyUSD: 54.02,  threeYearMonthlyUSD: 48.91 },  osMultipliers: { windows: 1.6 } },
  { provider: 'oracle', sku: 'VM.Standard.E4.Flex-8-64',  displayName: 'E4.Flex 8OCPU/64GB',   family: 'general', vcpus: 8,  memoryGB: 64,  burstable: false,
    pricing: { onDemandMonthlyUSD: 146.00,  oneYearMonthlyUSD: 108.04, threeYearMonthlyUSD: 97.82 },  osMultipliers: { windows: 1.6 } },
  { provider: 'oracle', sku: 'VM.Standard.E4.Flex-16-128',displayName: 'E4.Flex 16OCPU/128GB', family: 'general', vcpus: 16, memoryGB: 128, burstable: false,
    pricing: { onDemandMonthlyUSD: 292.00,  oneYearMonthlyUSD: 216.08, threeYearMonthlyUSD: 195.64 }, osMultipliers: { windows: 1.6 } },
  { provider: 'oracle', sku: 'VM.Standard.E4.Flex-32-256',displayName: 'E4.Flex 32OCPU/256GB', family: 'general', vcpus: 32, memoryGB: 256, burstable: false,
    pricing: { onDemandMonthlyUSD: 584.00,  oneYearMonthlyUSD: 432.16, threeYearMonthlyUSD: 391.28 }, osMultipliers: { windows: 1.6 } },

  // Optimized3.Flex (Intel) — Compute Optimized
  { provider: 'oracle', sku: 'VM.Optimized3.Flex-2-8',    displayName: 'Optimized3.Flex 2OCPU/8GB',  family: 'compute_optimized', vcpus: 2,  memoryGB: 8,   burstable: false,
    pricing: { onDemandMonthlyUSD: 51.10,   oneYearMonthlyUSD: 37.81,  threeYearMonthlyUSD: 34.24 },  osMultipliers: { windows: 1.6 } },
  { provider: 'oracle', sku: 'VM.Optimized3.Flex-4-16',   displayName: 'Optimized3.Flex 4OCPU/16GB', family: 'compute_optimized', vcpus: 4,  memoryGB: 16,  burstable: false,
    pricing: { onDemandMonthlyUSD: 102.20,  oneYearMonthlyUSD: 75.63,  threeYearMonthlyUSD: 68.47 },  osMultipliers: { windows: 1.6 } },
  { provider: 'oracle', sku: 'VM.Optimized3.Flex-8-32',   displayName: 'Optimized3.Flex 8OCPU/32GB', family: 'compute_optimized', vcpus: 8,  memoryGB: 32,  burstable: false,
    pricing: { onDemandMonthlyUSD: 204.40,  oneYearMonthlyUSD: 151.26, threeYearMonthlyUSD: 136.95 }, osMultipliers: { windows: 1.6 } },
  { provider: 'oracle', sku: 'VM.Optimized3.Flex-16-64',  displayName: 'Optimized3.Flex 16OCPU/64GB',family: 'compute_optimized', vcpus: 16, memoryGB: 64,  burstable: false,
    pricing: { onDemandMonthlyUSD: 408.80,  oneYearMonthlyUSD: 302.51, threeYearMonthlyUSD: 273.90 }, osMultipliers: { windows: 1.6 } },
  { provider: 'oracle', sku: 'VM.Optimized3.Flex-32-128', displayName: 'Optimized3.Flex 32OCPU/128GB',family: 'compute_optimized', vcpus: 32, memoryGB: 128, burstable: false,
    pricing: { onDemandMonthlyUSD: 817.60,  oneYearMonthlyUSD: 605.02, threeYearMonthlyUSD: 547.79 }, osMultipliers: { windows: 1.6 } },

  // E5.Flex with high RAM ratio — Memory Optimized
  { provider: 'oracle', sku: 'VM.Standard.E5.Flex-2-32',   displayName: 'E5.Flex 2OCPU/32GB',   family: 'memory_optimized', vcpus: 2,  memoryGB: 32,  burstable: false,
    pricing: { onDemandMonthlyUSD: 57.67,   oneYearMonthlyUSD: 42.68,  threeYearMonthlyUSD: 38.64 },  osMultipliers: { windows: 1.6 } },
  { provider: 'oracle', sku: 'VM.Standard.E5.Flex-4-64',   displayName: 'E5.Flex 4OCPU/64GB',   family: 'memory_optimized', vcpus: 4,  memoryGB: 64,  burstable: false,
    pricing: { onDemandMonthlyUSD: 115.34,  oneYearMonthlyUSD: 85.35,  threeYearMonthlyUSD: 77.28 },  osMultipliers: { windows: 1.6 } },
  { provider: 'oracle', sku: 'VM.Standard.E5.Flex-8-128',  displayName: 'E5.Flex 8OCPU/128GB',  family: 'memory_optimized', vcpus: 8,  memoryGB: 128, burstable: false,
    pricing: { onDemandMonthlyUSD: 230.68,  oneYearMonthlyUSD: 170.70, threeYearMonthlyUSD: 154.56 }, osMultipliers: { windows: 1.6 } },
  { provider: 'oracle', sku: 'VM.Standard.E5.Flex-16-256', displayName: 'E5.Flex 16OCPU/256GB', family: 'memory_optimized', vcpus: 16, memoryGB: 256, burstable: false,
    pricing: { onDemandMonthlyUSD: 461.36,  oneYearMonthlyUSD: 341.41, threeYearMonthlyUSD: 309.11 }, osMultipliers: { windows: 1.6 } },
  { provider: 'oracle', sku: 'VM.Standard.E5.Flex-32-512', displayName: 'E5.Flex 32OCPU/512GB', family: 'memory_optimized', vcpus: 32, memoryGB: 512, burstable: false,
    pricing: { onDemandMonthlyUSD: 922.72,  oneYearMonthlyUSD: 682.81, threeYearMonthlyUSD: 618.22 }, osMultipliers: { windows: 1.6 } },
]);
