// Azure SQL Database (vCore General Purpose / Business Critical) + Azure DB for
// MySQL/PostgreSQL Flexible Server. East US, Linux, PAYG × 730 hr.
// Family mapping reuses our generic naming for consistency.

import type { ManagedDbInstanceType } from '../../../../../shared/types/cloud.types';

export const AZURE_DATABASE: readonly ManagedDbInstanceType[] = Object.freeze([
  // Burstable (Azure SQL Serverless / DB Flex small)
  { provider: 'azure', sku: 'GP_S_Gen5_2',          displayName: 'Azure SQL Serverless 2vCore', family: 'burstable', vcpus: 2, memoryGB: 6,
    pricing: { onDemandMonthlyUSD: 60.59,  oneYearMonthlyUSD: 36.35,  threeYearMonthlyUSD: 23.02 },
    supportedEngines: ['sqlserver'] },
  { provider: 'azure', sku: 'B_Standard_B2s_MySQL', displayName: 'MySQL Flex B2s',              family: 'burstable', vcpus: 2, memoryGB: 4,
    pricing: { onDemandMonthlyUSD: 51.10,  oneYearMonthlyUSD: 30.66,  threeYearMonthlyUSD: 19.42 },
    supportedEngines: ['mysql', 'mariadb'] },
  { provider: 'azure', sku: 'B_Standard_B2s_PG',    displayName: 'PostgreSQL Flex B2s',         family: 'burstable', vcpus: 2, memoryGB: 4,
    pricing: { onDemandMonthlyUSD: 51.10,  oneYearMonthlyUSD: 30.66,  threeYearMonthlyUSD: 19.42 },
    supportedEngines: ['postgresql'] },

  // General Purpose (Gen5)
  { provider: 'azure', sku: 'GP_Gen5_2',  displayName: 'Azure SQL GP Gen5 2vCore',  family: 'general', vcpus: 2,  memoryGB: 10.4,
    pricing: { onDemandMonthlyUSD: 145.31, oneYearMonthlyUSD: 87.18,  threeYearMonthlyUSD: 55.22 },
    supportedEngines: ['sqlserver'] },
  { provider: 'azure', sku: 'GP_Gen5_4',  displayName: 'Azure SQL GP Gen5 4vCore',  family: 'general', vcpus: 4,  memoryGB: 20.8,
    pricing: { onDemandMonthlyUSD: 290.62, oneYearMonthlyUSD: 174.37, threeYearMonthlyUSD: 110.43 },
    supportedEngines: ['sqlserver'] },
  { provider: 'azure', sku: 'GP_Gen5_8',  displayName: 'Azure SQL GP Gen5 8vCore',  family: 'general', vcpus: 8,  memoryGB: 41.6,
    pricing: { onDemandMonthlyUSD: 581.24, oneYearMonthlyUSD: 348.74, threeYearMonthlyUSD: 220.87 },
    supportedEngines: ['sqlserver'] },
  { provider: 'azure', sku: 'GP_Gen5_16', displayName: 'Azure SQL GP Gen5 16vCore', family: 'general', vcpus: 16, memoryGB: 83.2,
    pricing: { onDemandMonthlyUSD: 1162.48,oneYearMonthlyUSD: 697.49, threeYearMonthlyUSD: 441.74 },
    supportedEngines: ['sqlserver'] },
  { provider: 'azure', sku: 'D4s_v3_MySQL_Flex',    displayName: 'MySQL Flex D4s v3',    family: 'general', vcpus: 4,  memoryGB: 16,
    pricing: { onDemandMonthlyUSD: 235.06, oneYearMonthlyUSD: 141.04, threeYearMonthlyUSD: 89.32 },
    supportedEngines: ['mysql', 'mariadb'] },
  { provider: 'azure', sku: 'D8s_v3_MySQL_Flex',    displayName: 'MySQL Flex D8s v3',    family: 'general', vcpus: 8,  memoryGB: 32,
    pricing: { onDemandMonthlyUSD: 470.12, oneYearMonthlyUSD: 282.07, threeYearMonthlyUSD: 178.65 },
    supportedEngines: ['mysql', 'mariadb'] },

  // Business Critical / Memory Optimized (E-series-backed)
  { provider: 'azure', sku: 'BC_Gen5_4',  displayName: 'Azure SQL BC Gen5 4vCore',  family: 'memory_optimized', vcpus: 4,  memoryGB: 20.8,
    pricing: { onDemandMonthlyUSD: 781.42, oneYearMonthlyUSD: 468.85, threeYearMonthlyUSD: 296.94 },
    supportedEngines: ['sqlserver'] },
  { provider: 'azure', sku: 'BC_Gen5_8',  displayName: 'Azure SQL BC Gen5 8vCore',  family: 'memory_optimized', vcpus: 8,  memoryGB: 41.6,
    pricing: { onDemandMonthlyUSD: 1562.84,oneYearMonthlyUSD: 937.70, threeYearMonthlyUSD: 593.88 },
    supportedEngines: ['sqlserver'] },
  { provider: 'azure', sku: 'E4s_v3_MySQL_Flex',    displayName: 'MySQL Flex E4s v3',    family: 'memory_optimized', vcpus: 4,  memoryGB: 32,
    pricing: { onDemandMonthlyUSD: 297.04, oneYearMonthlyUSD: 178.22, threeYearMonthlyUSD: 112.88 },
    supportedEngines: ['mysql', 'mariadb', 'postgresql'] },
  { provider: 'azure', sku: 'E8s_v3_MySQL_Flex',    displayName: 'MySQL Flex E8s v3',    family: 'memory_optimized', vcpus: 8,  memoryGB: 64,
    pricing: { onDemandMonthlyUSD: 594.08, oneYearMonthlyUSD: 356.45, threeYearMonthlyUSD: 225.75 },
    supportedEngines: ['mysql', 'mariadb', 'postgresql'] },
  { provider: 'azure', sku: 'E16s_v3_MySQL_Flex',   displayName: 'MySQL Flex E16s v3',   family: 'memory_optimized', vcpus: 16, memoryGB: 128,
    pricing: { onDemandMonthlyUSD: 1188.16,oneYearMonthlyUSD: 712.90, threeYearMonthlyUSD: 451.50 },
    supportedEngines: ['mysql', 'mariadb', 'postgresql'] },
]);
