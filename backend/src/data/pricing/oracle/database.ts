// OCI managed database catalog. us-ashburn-1 PAYG × 730 hr/mo.
// Includes Oracle Autonomous Database, OCI MySQL HeatWave, and OCI Base DB.
// BYOL discounts (-50% on Oracle DB compute) are applied in pricing.ts via flags.byol.

import type { ManagedDbInstanceType } from '../../../../../shared/types/cloud.types';

export const ORACLE_DATABASE: readonly ManagedDbInstanceType[] = Object.freeze([
  // Small / general-purpose tier (no burstable in OCI — modeled as general)
  { provider: 'oracle', sku: 'MySQL.VM.Standard.E3.1.8GB',   displayName: 'MySQL HeatWave E3 1OCPU/8GB',   family: 'general', vcpus: 1, memoryGB: 8,
    pricing: { onDemandMonthlyUSD: 47.45,   oneYearMonthlyUSD: 35.11,  threeYearMonthlyUSD: 31.79 },
    supportedEngines: ['mysql', 'mariadb'] },
  { provider: 'oracle', sku: 'MySQL.VM.Standard.E3.2.16GB',  displayName: 'MySQL HeatWave E3 2OCPU/16GB',  family: 'general', vcpus: 2, memoryGB: 16,
    pricing: { onDemandMonthlyUSD: 94.90,   oneYearMonthlyUSD: 70.23,  threeYearMonthlyUSD: 63.58 },
    supportedEngines: ['mysql', 'mariadb'] },
  { provider: 'oracle', sku: 'MySQL.VM.Standard.E3.4.32GB',  displayName: 'MySQL HeatWave E3 4OCPU/32GB',  family: 'general', vcpus: 4, memoryGB: 32,
    pricing: { onDemandMonthlyUSD: 189.80,  oneYearMonthlyUSD: 140.45, threeYearMonthlyUSD: 127.17 },
    supportedEngines: ['mysql', 'mariadb'] },
  { provider: 'oracle', sku: 'MySQL.VM.Standard.E3.8.64GB',  displayName: 'MySQL HeatWave E3 8OCPU/64GB',  family: 'general', vcpus: 8, memoryGB: 64,
    pricing: { onDemandMonthlyUSD: 379.60,  oneYearMonthlyUSD: 280.91, threeYearMonthlyUSD: 254.33 },
    supportedEngines: ['mysql', 'mariadb'] },

  // PostgreSQL (OCI Database with PostgreSQL — managed)
  { provider: 'oracle', sku: 'PG.E4.Flex-2-16',  displayName: 'OCI PostgreSQL E4 2OCPU/16GB', family: 'general', vcpus: 2, memoryGB: 16,
    pricing: { onDemandMonthlyUSD: 102.20,  oneYearMonthlyUSD: 75.63,  threeYearMonthlyUSD: 68.47 },
    supportedEngines: ['postgresql'] },
  { provider: 'oracle', sku: 'PG.E4.Flex-4-32',  displayName: 'OCI PostgreSQL E4 4OCPU/32GB', family: 'general', vcpus: 4, memoryGB: 32,
    pricing: { onDemandMonthlyUSD: 204.40,  oneYearMonthlyUSD: 151.26, threeYearMonthlyUSD: 136.95 },
    supportedEngines: ['postgresql'] },

  // Oracle Autonomous Database — Memory Optimized (Oracle DB)
  { provider: 'oracle', sku: 'ADB.OCPU-1.Storage-1TB',  displayName: 'Autonomous DB 1OCPU/1TB',  family: 'memory_optimized', vcpus: 2,  memoryGB: 16,
    pricing: { onDemandMonthlyUSD: 945.36,  oneYearMonthlyUSD: 699.57, threeYearMonthlyUSD: 633.39 },
    supportedEngines: ['oracle'] },
  { provider: 'oracle', sku: 'ADB.OCPU-2.Storage-1TB',  displayName: 'Autonomous DB 2OCPU/1TB',  family: 'memory_optimized', vcpus: 4,  memoryGB: 32,
    pricing: { onDemandMonthlyUSD: 1890.72, oneYearMonthlyUSD: 1399.13,threeYearMonthlyUSD: 1266.78 },
    supportedEngines: ['oracle'] },
  { provider: 'oracle', sku: 'ADB.OCPU-4.Storage-2TB',  displayName: 'Autonomous DB 4OCPU/2TB',  family: 'memory_optimized', vcpus: 8,  memoryGB: 64,
    pricing: { onDemandMonthlyUSD: 3781.44, oneYearMonthlyUSD: 2798.27,threeYearMonthlyUSD: 2533.56 },
    supportedEngines: ['oracle'] },
  { provider: 'oracle', sku: 'ADB.OCPU-8.Storage-4TB',  displayName: 'Autonomous DB 8OCPU/4TB',  family: 'memory_optimized', vcpus: 16, memoryGB: 128,
    pricing: { onDemandMonthlyUSD: 7562.88, oneYearMonthlyUSD: 5596.53,threeYearMonthlyUSD: 5067.13 },
    supportedEngines: ['oracle'] },

  // OCI Base DB Service (Oracle DB on VM, BYOL friendly) — SQL Server is BYOL-only on VM
  { provider: 'oracle', sku: 'BaseDB.E4.Flex-4-32',  displayName: 'OCI Base DB E4 4OCPU/32GB',  family: 'general', vcpus: 4,  memoryGB: 32,
    pricing: { onDemandMonthlyUSD: 730.00,  oneYearMonthlyUSD: 540.20, threeYearMonthlyUSD: 489.10 },
    supportedEngines: ['oracle', 'sqlserver'] },
  { provider: 'oracle', sku: 'BaseDB.E4.Flex-8-64',  displayName: 'OCI Base DB E4 8OCPU/64GB',  family: 'memory_optimized', vcpus: 8,  memoryGB: 64,
    pricing: { onDemandMonthlyUSD: 1460.00, oneYearMonthlyUSD: 1080.40,threeYearMonthlyUSD: 978.20 },
    supportedEngines: ['oracle', 'sqlserver'] },
]);
