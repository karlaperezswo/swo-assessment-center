// AWS RDS catalog. Literal port of pricing in
// backend/src/services/ec2RecommendationService.ts (lines 50-63).

import type { ManagedDbInstanceType } from '../../../../../shared/types/cloud.types';

export const AWS_DATABASE: readonly ManagedDbInstanceType[] = Object.freeze([
  // db.t3 — Burstable
  { provider: 'aws', sku: 'db.t3.micro',  displayName: 'db.t3.micro',  family: 'burstable', vcpus: 2, memoryGB: 1,
    pricing: { onDemandMonthlyUSD: 12.41,   oneYearMonthlyUSD: 8.03,    threeYearMonthlyUSD: 5.47 },
    supportedEngines: ['mysql', 'postgresql', 'mariadb', 'sqlserver', 'oracle'] },
  { provider: 'aws', sku: 'db.t3.small',  displayName: 'db.t3.small',  family: 'burstable', vcpus: 2, memoryGB: 2,
    pricing: { onDemandMonthlyUSD: 24.82,   oneYearMonthlyUSD: 16.06,   threeYearMonthlyUSD: 10.95 },
    supportedEngines: ['mysql', 'postgresql', 'mariadb', 'sqlserver', 'oracle'] },
  { provider: 'aws', sku: 'db.t3.medium', displayName: 'db.t3.medium', family: 'burstable', vcpus: 2, memoryGB: 4,
    pricing: { onDemandMonthlyUSD: 49.64,   oneYearMonthlyUSD: 32.12,   threeYearMonthlyUSD: 21.90 },
    supportedEngines: ['mysql', 'postgresql', 'mariadb', 'sqlserver', 'oracle'] },
  { provider: 'aws', sku: 'db.t3.large',  displayName: 'db.t3.large',  family: 'burstable', vcpus: 2, memoryGB: 8,
    pricing: { onDemandMonthlyUSD: 99.28,   oneYearMonthlyUSD: 64.24,   threeYearMonthlyUSD: 43.80 },
    supportedEngines: ['mysql', 'postgresql', 'mariadb', 'sqlserver', 'oracle'] },

  // db.m5 — General Purpose
  { provider: 'aws', sku: 'db.m5.large',   displayName: 'db.m5.large',   family: 'general', vcpus: 2,  memoryGB: 8,
    pricing: { onDemandMonthlyUSD: 125.56,  oneYearMonthlyUSD: 81.25,   threeYearMonthlyUSD: 55.37 },
    supportedEngines: ['mysql', 'postgresql', 'mariadb', 'sqlserver', 'oracle'] },
  { provider: 'aws', sku: 'db.m5.xlarge',  displayName: 'db.m5.xlarge',  family: 'general', vcpus: 4,  memoryGB: 16,
    pricing: { onDemandMonthlyUSD: 251.12,  oneYearMonthlyUSD: 162.50,  threeYearMonthlyUSD: 110.74 },
    supportedEngines: ['mysql', 'postgresql', 'mariadb', 'sqlserver', 'oracle'] },
  { provider: 'aws', sku: 'db.m5.2xlarge', displayName: 'db.m5.2xlarge', family: 'general', vcpus: 8,  memoryGB: 32,
    pricing: { onDemandMonthlyUSD: 502.24,  oneYearMonthlyUSD: 325.00,  threeYearMonthlyUSD: 221.47 },
    supportedEngines: ['mysql', 'postgresql', 'mariadb', 'sqlserver', 'oracle'] },
  { provider: 'aws', sku: 'db.m5.4xlarge', displayName: 'db.m5.4xlarge', family: 'general', vcpus: 16, memoryGB: 64,
    pricing: { onDemandMonthlyUSD: 1004.48, oneYearMonthlyUSD: 650.00,  threeYearMonthlyUSD: 442.94 },
    supportedEngines: ['mysql', 'postgresql', 'mariadb', 'sqlserver', 'oracle'] },

  // db.r5 — Memory Optimized
  { provider: 'aws', sku: 'db.r5.large',   displayName: 'db.r5.large',   family: 'memory_optimized', vcpus: 2,  memoryGB: 16,
    pricing: { onDemandMonthlyUSD: 175.20,  oneYearMonthlyUSD: 113.36,  threeYearMonthlyUSD: 77.25 },
    supportedEngines: ['mysql', 'postgresql', 'mariadb', 'sqlserver', 'oracle'] },
  { provider: 'aws', sku: 'db.r5.xlarge',  displayName: 'db.r5.xlarge',  family: 'memory_optimized', vcpus: 4,  memoryGB: 32,
    pricing: { onDemandMonthlyUSD: 350.40,  oneYearMonthlyUSD: 226.72,  threeYearMonthlyUSD: 154.50 },
    supportedEngines: ['mysql', 'postgresql', 'mariadb', 'sqlserver', 'oracle'] },
  { provider: 'aws', sku: 'db.r5.2xlarge', displayName: 'db.r5.2xlarge', family: 'memory_optimized', vcpus: 8,  memoryGB: 64,
    pricing: { onDemandMonthlyUSD: 700.80,  oneYearMonthlyUSD: 453.44,  threeYearMonthlyUSD: 309.00 },
    supportedEngines: ['mysql', 'postgresql', 'mariadb', 'sqlserver', 'oracle'] },
  { provider: 'aws', sku: 'db.r5.4xlarge', displayName: 'db.r5.4xlarge', family: 'memory_optimized', vcpus: 16, memoryGB: 128,
    pricing: { onDemandMonthlyUSD: 1401.60, oneYearMonthlyUSD: 906.88,  threeYearMonthlyUSD: 618.00 },
    supportedEngines: ['mysql', 'postgresql', 'mariadb', 'sqlserver', 'oracle'] },
]);
