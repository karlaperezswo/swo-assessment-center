// GCP Compute Engine catalog. us-central1 Linux on-demand × 730 hr/mo.
// Pricing approximated from public list prices Q1 2026; validated by certified
// architect before release (per the plan's pre-requisites). Windows multiplier
// ~1.5x reflects GCP's per-vCPU Windows licensing premium (~$0.04/vCPU-hr).
//
// Family mapping:
//   e2-*  → burstable           (custom-spec + sustained-use)
//   n2-*  → general              (mainstream)
//   c2-*  → compute_optimized
//   n2-highmem-* → memory_optimized

import type { ComputeInstanceType } from '../../../../../shared/types/cloud.types';

export const GCP_COMPUTE: readonly ComputeInstanceType[] = Object.freeze([
  // e2 — Burstable (cost-optimized, with sustained-use discount applied automatically)
  { provider: 'gcp', sku: 'e2-micro',  displayName: 'e2-micro',  family: 'burstable', vcpus: 2,  memoryGB: 1,   burstable: true,
    pricing: { onDemandMonthlyUSD: 6.11,  oneYearMonthlyUSD: 3.85,  threeYearMonthlyUSD: 2.75 },  osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'e2-small',  displayName: 'e2-small',  family: 'burstable', vcpus: 2,  memoryGB: 2,   burstable: true,
    pricing: { onDemandMonthlyUSD: 12.23, oneYearMonthlyUSD: 7.71,  threeYearMonthlyUSD: 5.50 },  osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'e2-medium', displayName: 'e2-medium', family: 'burstable', vcpus: 2,  memoryGB: 4,   burstable: true,
    pricing: { onDemandMonthlyUSD: 24.46, oneYearMonthlyUSD: 15.41, threeYearMonthlyUSD: 11.01 }, osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'e2-standard-2', displayName: 'e2-standard-2', family: 'burstable', vcpus: 2,  memoryGB: 8,  burstable: true,
    pricing: { onDemandMonthlyUSD: 48.91, oneYearMonthlyUSD: 30.81, threeYearMonthlyUSD: 22.01 }, osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'e2-standard-4', displayName: 'e2-standard-4', family: 'burstable', vcpus: 4,  memoryGB: 16, burstable: true,
    pricing: { onDemandMonthlyUSD: 97.83, oneYearMonthlyUSD: 61.63, threeYearMonthlyUSD: 44.02 }, osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'e2-standard-8', displayName: 'e2-standard-8', family: 'burstable', vcpus: 8,  memoryGB: 32, burstable: true,
    pricing: { onDemandMonthlyUSD: 195.66,oneYearMonthlyUSD: 123.27,threeYearMonthlyUSD: 88.05 }, osMultipliers: { windows: 1.5 } },

  // n2 — General Purpose (Cascade Lake / Ice Lake)
  { provider: 'gcp', sku: 'n2-standard-2',  displayName: 'n2-standard-2',  family: 'general', vcpus: 2,  memoryGB: 8,   burstable: false,
    pricing: { onDemandMonthlyUSD: 70.81,   oneYearMonthlyUSD: 44.61,  threeYearMonthlyUSD: 31.86 },   osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'n2-standard-4',  displayName: 'n2-standard-4',  family: 'general', vcpus: 4,  memoryGB: 16,  burstable: false,
    pricing: { onDemandMonthlyUSD: 141.62,  oneYearMonthlyUSD: 89.22,  threeYearMonthlyUSD: 63.73 },   osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'n2-standard-8',  displayName: 'n2-standard-8',  family: 'general', vcpus: 8,  memoryGB: 32,  burstable: false,
    pricing: { onDemandMonthlyUSD: 283.24,  oneYearMonthlyUSD: 178.44, threeYearMonthlyUSD: 127.45 },  osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'n2-standard-16', displayName: 'n2-standard-16', family: 'general', vcpus: 16, memoryGB: 64,  burstable: false,
    pricing: { onDemandMonthlyUSD: 566.48,  oneYearMonthlyUSD: 356.88, threeYearMonthlyUSD: 254.91 },  osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'n2-standard-32', displayName: 'n2-standard-32', family: 'general', vcpus: 32, memoryGB: 128, burstable: false,
    pricing: { onDemandMonthlyUSD: 1132.96, oneYearMonthlyUSD: 713.77, threeYearMonthlyUSD: 509.83 },  osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'n2-standard-48', displayName: 'n2-standard-48', family: 'general', vcpus: 48, memoryGB: 192, burstable: false,
    pricing: { onDemandMonthlyUSD: 1699.44, oneYearMonthlyUSD: 1070.65,threeYearMonthlyUSD: 764.74 },  osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'n2-standard-64', displayName: 'n2-standard-64', family: 'general', vcpus: 64, memoryGB: 256, burstable: false,
    pricing: { onDemandMonthlyUSD: 2265.92, oneYearMonthlyUSD: 1427.53,threeYearMonthlyUSD: 1019.66 }, osMultipliers: { windows: 1.5 } },

  // c2 — Compute Optimized (Cascade Lake)
  { provider: 'gcp', sku: 'c2-standard-4',  displayName: 'c2-standard-4',  family: 'compute_optimized', vcpus: 4,  memoryGB: 16,  burstable: false,
    pricing: { onDemandMonthlyUSD: 153.30,  oneYearMonthlyUSD: 96.58,  threeYearMonthlyUSD: 68.98 },   osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'c2-standard-8',  displayName: 'c2-standard-8',  family: 'compute_optimized', vcpus: 8,  memoryGB: 32,  burstable: false,
    pricing: { onDemandMonthlyUSD: 306.60,  oneYearMonthlyUSD: 193.16, threeYearMonthlyUSD: 137.97 },  osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'c2-standard-16', displayName: 'c2-standard-16', family: 'compute_optimized', vcpus: 16, memoryGB: 64,  burstable: false,
    pricing: { onDemandMonthlyUSD: 613.20,  oneYearMonthlyUSD: 386.32, threeYearMonthlyUSD: 275.94 },  osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'c2-standard-30', displayName: 'c2-standard-30', family: 'compute_optimized', vcpus: 30, memoryGB: 120, burstable: false,
    pricing: { onDemandMonthlyUSD: 1149.75, oneYearMonthlyUSD: 724.34, threeYearMonthlyUSD: 517.39 },  osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'c2-standard-60', displayName: 'c2-standard-60', family: 'compute_optimized', vcpus: 60, memoryGB: 240, burstable: false,
    pricing: { onDemandMonthlyUSD: 2299.50, oneYearMonthlyUSD: 1448.69,threeYearMonthlyUSD: 1034.78 }, osMultipliers: { windows: 1.5 } },

  // n2-highmem — Memory Optimized
  { provider: 'gcp', sku: 'n2-highmem-2',  displayName: 'n2-highmem-2',  family: 'memory_optimized', vcpus: 2,  memoryGB: 16,  burstable: false,
    pricing: { onDemandMonthlyUSD: 95.44,   oneYearMonthlyUSD: 60.13,  threeYearMonthlyUSD: 42.95 },   osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'n2-highmem-4',  displayName: 'n2-highmem-4',  family: 'memory_optimized', vcpus: 4,  memoryGB: 32,  burstable: false,
    pricing: { onDemandMonthlyUSD: 190.89,  oneYearMonthlyUSD: 120.26, threeYearMonthlyUSD: 85.90 },   osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'n2-highmem-8',  displayName: 'n2-highmem-8',  family: 'memory_optimized', vcpus: 8,  memoryGB: 64,  burstable: false,
    pricing: { onDemandMonthlyUSD: 381.78,  oneYearMonthlyUSD: 240.52, threeYearMonthlyUSD: 171.80 },  osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'n2-highmem-16', displayName: 'n2-highmem-16', family: 'memory_optimized', vcpus: 16, memoryGB: 128, burstable: false,
    pricing: { onDemandMonthlyUSD: 763.55,  oneYearMonthlyUSD: 481.04, threeYearMonthlyUSD: 343.60 },  osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'n2-highmem-32', displayName: 'n2-highmem-32', family: 'memory_optimized', vcpus: 32, memoryGB: 256, burstable: false,
    pricing: { onDemandMonthlyUSD: 1527.10, oneYearMonthlyUSD: 962.07, threeYearMonthlyUSD: 687.20 },  osMultipliers: { windows: 1.5 } },
  { provider: 'gcp', sku: 'n2-highmem-48', displayName: 'n2-highmem-48', family: 'memory_optimized', vcpus: 48, memoryGB: 384, burstable: false,
    pricing: { onDemandMonthlyUSD: 2290.65, oneYearMonthlyUSD: 1443.11,threeYearMonthlyUSD: 1030.79 }, osMultipliers: { windows: 1.5 } },
]);
