// GCP Cloud SQL catalog. us-central1 Linux on-demand × 730 hr/mo.
// Cloud SQL pricing has 2 dimensions: vCPU/RAM custom + storage. We model
// representative shapes equivalent to AWS RDS tiers for like-for-like compare.

import type { ManagedDbInstanceType } from '../../../../../shared/types/cloud.types';

export const GCP_DATABASE: readonly ManagedDbInstanceType[] = Object.freeze([
  // db-custom small (burstable equivalent)
  { provider: 'gcp', sku: 'db-custom-1-3840',  displayName: 'Cloud SQL 1vCPU/4GB',  family: 'burstable', vcpus: 1, memoryGB: 4,
    pricing: { onDemandMonthlyUSD: 52.12,  oneYearMonthlyUSD: 32.84,  threeYearMonthlyUSD: 23.45 },
    supportedEngines: ['mysql', 'postgresql', 'sqlserver'] },
  { provider: 'gcp', sku: 'db-custom-2-7680',  displayName: 'Cloud SQL 2vCPU/8GB',  family: 'burstable', vcpus: 2, memoryGB: 8,
    pricing: { onDemandMonthlyUSD: 104.24, oneYearMonthlyUSD: 65.67,  threeYearMonthlyUSD: 46.91 },
    supportedEngines: ['mysql', 'postgresql', 'sqlserver'] },

  // General Purpose tier
  { provider: 'gcp', sku: 'db-n1-standard-2',  displayName: 'Cloud SQL n1-std-2',   family: 'general', vcpus: 2,  memoryGB: 7.5,
    pricing: { onDemandMonthlyUSD: 131.78, oneYearMonthlyUSD: 83.02,  threeYearMonthlyUSD: 59.30 },
    supportedEngines: ['mysql', 'postgresql', 'sqlserver'] },
  { provider: 'gcp', sku: 'db-n1-standard-4',  displayName: 'Cloud SQL n1-std-4',   family: 'general', vcpus: 4,  memoryGB: 15,
    pricing: { onDemandMonthlyUSD: 263.66, oneYearMonthlyUSD: 166.10, threeYearMonthlyUSD: 118.65 },
    supportedEngines: ['mysql', 'postgresql', 'sqlserver'] },
  { provider: 'gcp', sku: 'db-n1-standard-8',  displayName: 'Cloud SQL n1-std-8',   family: 'general', vcpus: 8,  memoryGB: 30,
    pricing: { onDemandMonthlyUSD: 527.32, oneYearMonthlyUSD: 332.21, threeYearMonthlyUSD: 237.30 },
    supportedEngines: ['mysql', 'postgresql', 'sqlserver'] },
  { provider: 'gcp', sku: 'db-n1-standard-16', displayName: 'Cloud SQL n1-std-16',  family: 'general', vcpus: 16, memoryGB: 60,
    pricing: { onDemandMonthlyUSD: 1054.64,oneYearMonthlyUSD: 664.42, threeYearMonthlyUSD: 474.59 },
    supportedEngines: ['mysql', 'postgresql', 'sqlserver'] },

  // Memory Optimized (highmem)
  { provider: 'gcp', sku: 'db-n1-highmem-2',   displayName: 'Cloud SQL n1-highmem-2',  family: 'memory_optimized', vcpus: 2,  memoryGB: 13,
    pricing: { onDemandMonthlyUSD: 178.09, oneYearMonthlyUSD: 112.20, threeYearMonthlyUSD: 80.14 },
    supportedEngines: ['mysql', 'postgresql', 'sqlserver', 'oracle'] },
  { provider: 'gcp', sku: 'db-n1-highmem-4',   displayName: 'Cloud SQL n1-highmem-4',  family: 'memory_optimized', vcpus: 4,  memoryGB: 26,
    pricing: { onDemandMonthlyUSD: 356.20, oneYearMonthlyUSD: 224.41, threeYearMonthlyUSD: 160.29 },
    supportedEngines: ['mysql', 'postgresql', 'sqlserver', 'oracle'] },
  { provider: 'gcp', sku: 'db-n1-highmem-8',   displayName: 'Cloud SQL n1-highmem-8',  family: 'memory_optimized', vcpus: 8,  memoryGB: 52,
    pricing: { onDemandMonthlyUSD: 712.40, oneYearMonthlyUSD: 448.81, threeYearMonthlyUSD: 320.58 },
    supportedEngines: ['mysql', 'postgresql', 'sqlserver', 'oracle'] },
  { provider: 'gcp', sku: 'db-n1-highmem-16',  displayName: 'Cloud SQL n1-highmem-16', family: 'memory_optimized', vcpus: 16, memoryGB: 104,
    pricing: { onDemandMonthlyUSD: 1424.81,oneYearMonthlyUSD: 897.63, threeYearMonthlyUSD: 641.16 },
    supportedEngines: ['mysql', 'postgresql', 'sqlserver', 'oracle'] },
]);
