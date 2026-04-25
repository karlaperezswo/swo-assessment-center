// Azure VM catalog. East US Linux PAYG × 730 hr/mo.
// Family mapping:
//   B-series (Bs/Bms) → burstable
//   D v5             → general
//   F v2             → compute_optimized
//   E v5             → memory_optimized
// Windows multiplier ~1.42x; Hybrid Benefit modeled as a -30% extra in pricing.ts.

import type { ComputeInstanceType } from '../../../../../shared/types/cloud.types';

export const AZURE_COMPUTE: readonly ComputeInstanceType[] = Object.freeze([
  // B-series — Burstable
  { provider: 'azure', sku: 'Standard_B1s',  displayName: 'B1s',  family: 'burstable', vcpus: 1, memoryGB: 1,  burstable: true,
    pricing: { onDemandMonthlyUSD: 7.59,   oneYearMonthlyUSD: 4.55,   threeYearMonthlyUSD: 2.88 },   osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_B1ms', displayName: 'B1ms', family: 'burstable', vcpus: 1, memoryGB: 2,  burstable: true,
    pricing: { onDemandMonthlyUSD: 15.18,  oneYearMonthlyUSD: 9.11,   threeYearMonthlyUSD: 5.77 },   osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_B2s',  displayName: 'B2s',  family: 'burstable', vcpus: 2, memoryGB: 4,  burstable: true,
    pricing: { onDemandMonthlyUSD: 30.37,  oneYearMonthlyUSD: 18.22,  threeYearMonthlyUSD: 11.54 },  osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_B2ms', displayName: 'B2ms', family: 'burstable', vcpus: 2, memoryGB: 8,  burstable: true,
    pricing: { onDemandMonthlyUSD: 60.74,  oneYearMonthlyUSD: 36.44,  threeYearMonthlyUSD: 23.08 },  osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_B4ms', displayName: 'B4ms', family: 'burstable', vcpus: 4, memoryGB: 16, burstable: true,
    pricing: { onDemandMonthlyUSD: 121.47, oneYearMonthlyUSD: 72.88,  threeYearMonthlyUSD: 46.16 },  osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_B8ms', displayName: 'B8ms', family: 'burstable', vcpus: 8, memoryGB: 32, burstable: true,
    pricing: { onDemandMonthlyUSD: 242.94, oneYearMonthlyUSD: 145.76, threeYearMonthlyUSD: 92.32 },  osMultipliers: { windows: 1.42 } },

  // D v5 — General Purpose
  { provider: 'azure', sku: 'Standard_D2s_v5',  displayName: 'D2s v5',  family: 'general', vcpus: 2,  memoryGB: 8,   burstable: false,
    pricing: { onDemandMonthlyUSD: 70.08,   oneYearMonthlyUSD: 42.05,  threeYearMonthlyUSD: 26.63 },  osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_D4s_v5',  displayName: 'D4s v5',  family: 'general', vcpus: 4,  memoryGB: 16,  burstable: false,
    pricing: { onDemandMonthlyUSD: 140.16,  oneYearMonthlyUSD: 84.10,  threeYearMonthlyUSD: 53.26 },  osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_D8s_v5',  displayName: 'D8s v5',  family: 'general', vcpus: 8,  memoryGB: 32,  burstable: false,
    pricing: { onDemandMonthlyUSD: 280.32,  oneYearMonthlyUSD: 168.19, threeYearMonthlyUSD: 106.52 }, osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_D16s_v5', displayName: 'D16s v5', family: 'general', vcpus: 16, memoryGB: 64,  burstable: false,
    pricing: { onDemandMonthlyUSD: 560.64,  oneYearMonthlyUSD: 336.38, threeYearMonthlyUSD: 213.04 }, osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_D32s_v5', displayName: 'D32s v5', family: 'general', vcpus: 32, memoryGB: 128, burstable: false,
    pricing: { onDemandMonthlyUSD: 1121.28, oneYearMonthlyUSD: 672.77, threeYearMonthlyUSD: 426.09 }, osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_D48s_v5', displayName: 'D48s v5', family: 'general', vcpus: 48, memoryGB: 192, burstable: false,
    pricing: { onDemandMonthlyUSD: 1681.92, oneYearMonthlyUSD: 1009.15,threeYearMonthlyUSD: 639.13 }, osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_D64s_v5', displayName: 'D64s v5', family: 'general', vcpus: 64, memoryGB: 256, burstable: false,
    pricing: { onDemandMonthlyUSD: 2242.56, oneYearMonthlyUSD: 1345.54,threeYearMonthlyUSD: 852.17 }, osMultipliers: { windows: 1.42 } },

  // F v2 — Compute Optimized
  { provider: 'azure', sku: 'Standard_F2s_v2',  displayName: 'F2s v2',  family: 'compute_optimized', vcpus: 2,  memoryGB: 4,   burstable: false,
    pricing: { onDemandMonthlyUSD: 62.05,   oneYearMonthlyUSD: 37.23,  threeYearMonthlyUSD: 23.58 },  osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_F4s_v2',  displayName: 'F4s v2',  family: 'compute_optimized', vcpus: 4,  memoryGB: 8,   burstable: false,
    pricing: { onDemandMonthlyUSD: 124.10,  oneYearMonthlyUSD: 74.46,  threeYearMonthlyUSD: 47.16 },  osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_F8s_v2',  displayName: 'F8s v2',  family: 'compute_optimized', vcpus: 8,  memoryGB: 16,  burstable: false,
    pricing: { onDemandMonthlyUSD: 248.20,  oneYearMonthlyUSD: 148.92, threeYearMonthlyUSD: 94.32 },  osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_F16s_v2', displayName: 'F16s v2', family: 'compute_optimized', vcpus: 16, memoryGB: 32,  burstable: false,
    pricing: { onDemandMonthlyUSD: 496.40,  oneYearMonthlyUSD: 297.84, threeYearMonthlyUSD: 188.63 }, osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_F32s_v2', displayName: 'F32s v2', family: 'compute_optimized', vcpus: 32, memoryGB: 64,  burstable: false,
    pricing: { onDemandMonthlyUSD: 992.80,  oneYearMonthlyUSD: 595.68, threeYearMonthlyUSD: 377.26 }, osMultipliers: { windows: 1.42 } },

  // E v5 — Memory Optimized
  { provider: 'azure', sku: 'Standard_E2s_v5',  displayName: 'E2s v5',  family: 'memory_optimized', vcpus: 2,  memoryGB: 16,  burstable: false,
    pricing: { onDemandMonthlyUSD: 92.34,   oneYearMonthlyUSD: 55.40,  threeYearMonthlyUSD: 35.09 },  osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_E4s_v5',  displayName: 'E4s v5',  family: 'memory_optimized', vcpus: 4,  memoryGB: 32,  burstable: false,
    pricing: { onDemandMonthlyUSD: 184.69,  oneYearMonthlyUSD: 110.81, threeYearMonthlyUSD: 70.18 },  osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_E8s_v5',  displayName: 'E8s v5',  family: 'memory_optimized', vcpus: 8,  memoryGB: 64,  burstable: false,
    pricing: { onDemandMonthlyUSD: 369.38,  oneYearMonthlyUSD: 221.62, threeYearMonthlyUSD: 140.36 }, osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_E16s_v5', displayName: 'E16s v5', family: 'memory_optimized', vcpus: 16, memoryGB: 128, burstable: false,
    pricing: { onDemandMonthlyUSD: 738.76,  oneYearMonthlyUSD: 443.25, threeYearMonthlyUSD: 280.72 }, osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_E32s_v5', displayName: 'E32s v5', family: 'memory_optimized', vcpus: 32, memoryGB: 256, burstable: false,
    pricing: { onDemandMonthlyUSD: 1477.52, oneYearMonthlyUSD: 886.51, threeYearMonthlyUSD: 561.45 }, osMultipliers: { windows: 1.42 } },
  { provider: 'azure', sku: 'Standard_E48s_v5', displayName: 'E48s v5', family: 'memory_optimized', vcpus: 48, memoryGB: 384, burstable: false,
    pricing: { onDemandMonthlyUSD: 2216.28, oneYearMonthlyUSD: 1329.77,threeYearMonthlyUSD: 842.18 }, osMultipliers: { windows: 1.42 } },
]);
