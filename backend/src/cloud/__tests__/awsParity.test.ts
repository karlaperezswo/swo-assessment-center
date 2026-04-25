// Golden-master parity check: the new awsProvider must produce results
// identical to the legacy EC2RecommendationService for the same inputs.
//
// Run: cd backend && npx ts-node src/cloud/__tests__/awsParity.test.ts
// Exit 0 = all fixtures match. Exit 1 = at least one diff detected.

import { EC2RecommendationService } from '../../services/ec2RecommendationService';
import { awsProvider } from '../providers/aws';
import { normalizeOs } from '../algorithms/rightSizing';
import type { Server, Database } from '../../types';

interface Diff {
  fixture: string;
  field: string;
  legacy: unknown;
  next: unknown;
}

function approxEqual(a: number, b: number, tol = 0.01): boolean {
  return Math.abs(a - b) <= tol;
}

const SERVER_FIXTURES: Server[] = [
  { serverId: 's1', hostname: 'web-01',  isPhysical: false, osName: 'Ubuntu 22.04', osVersion: '22.04',
    numCpus: 2, numCoresPerCpu: 2, numThreadsPerCore: 1, totalRAM: 4,
    maxCpuUsage: 30, avgCpuUsage: 15, maxRamUsage: 40, avgRamUsage: 25,
    totalDiskSize: 50, storageUtilization: 40, uptime: 99 },
  { serverId: 's2', hostname: 'app-balanced', isPhysical: false, osName: 'RHEL 8', osVersion: '8.5',
    numCpus: 2, numCoresPerCpu: 4, numThreadsPerCore: 1, totalRAM: 32,
    maxCpuUsage: 70, avgCpuUsage: 55, maxRamUsage: 75, avgRamUsage: 65,
    totalDiskSize: 200, storageUtilization: 60, uptime: 99 },
  { serverId: 's3', hostname: 'db-mem-heavy', isPhysical: true, osName: 'RHEL 9', osVersion: '9.2',
    numCpus: 2, numCoresPerCpu: 8, numThreadsPerCore: 1, totalRAM: 128,
    maxCpuUsage: 60, avgCpuUsage: 45, maxRamUsage: 80, avgRamUsage: 70,
    totalDiskSize: 1000, storageUtilization: 70, uptime: 99 },
  { serverId: 's4', hostname: 'compute-heavy', isPhysical: false, osName: 'Ubuntu 20.04', osVersion: '20.04',
    numCpus: 2, numCoresPerCpu: 8, numThreadsPerCore: 1, totalRAM: 16,
    maxCpuUsage: 90, avgCpuUsage: 80, maxRamUsage: 60, avgRamUsage: 50,
    totalDiskSize: 100, storageUtilization: 50, uptime: 99 },
  { serverId: 's5', hostname: 'win-rightsized', isPhysical: false, osName: 'Windows Server 2019', osVersion: '2019',
    numCpus: 2, numCoresPerCpu: 4, numThreadsPerCore: 2, totalRAM: 64,
    maxCpuUsage: 25, avgCpuUsage: 12, maxRamUsage: 35, avgRamUsage: 22,
    totalDiskSize: 500, storageUtilization: 40, uptime: 99 },
  { serverId: 's6', hostname: 'no-utilization', isPhysical: true, osName: 'CentOS 7', osVersion: '7.9',
    numCpus: 1, numCoresPerCpu: 4, numThreadsPerCore: 2, totalRAM: 16,
    maxCpuUsage: 0, avgCpuUsage: 0, maxRamUsage: 0, avgRamUsage: 0,
    totalDiskSize: 200, storageUtilization: 0, uptime: 99 },
  { serverId: 's7', hostname: 'huge-memory', isPhysical: true, osName: 'Oracle Linux 8', osVersion: '8.6',
    numCpus: 4, numCoresPerCpu: 12, numThreadsPerCore: 1, totalRAM: 384,
    maxCpuUsage: 65, avgCpuUsage: 50, maxRamUsage: 85, avgRamUsage: 70,
    totalDiskSize: 4000, storageUtilization: 70, uptime: 99 },
];

const DATABASE_FIXTURES: Database[] = [
  { databaseId: 'd1', dbName: 'small-mssql',  instanceName: 'i1', engineType: 'MSSQL',     engineVersion: '2019', engineEdition: 'Standard',
    totalSize: 30,  serverId: 's1', licenseModel: 'license-included', maxTPS: 100 },
  { databaseId: 'd2', dbName: 'mid-postgres', instanceName: 'i2', engineType: 'PostgreSQL',engineVersion: '14',   engineEdition: 'Community',
    totalSize: 75,  serverId: 's2', licenseModel: 'license-included', maxTPS: 500 },
  { databaseId: 'd3', dbName: 'large-mysql',  instanceName: 'i3', engineType: 'MySQL',     engineVersion: '8.0',  engineEdition: 'Community',
    totalSize: 250, serverId: 's3', licenseModel: 'license-included', maxTPS: 2000 },
  { databaseId: 'd4', dbName: 'huge-oracle',  instanceName: 'i4', engineType: 'Oracle',    engineVersion: '19c',  engineEdition: 'Enterprise',
    totalSize: 800, serverId: 's3', licenseModel: 'bring-your-own', maxTPS: 5000 },
  { databaseId: 'd5', dbName: 'tiny-maria',   instanceName: 'i5', engineType: 'MariaDB',   engineVersion: '10.6', engineEdition: 'Community',
    totalSize: 5,   serverId: 's1', licenseModel: 'license-included', maxTPS: 50 },
];

function runComputeParity(): Diff[] {
  const diffs: Diff[] = [];
  const legacy = new EC2RecommendationService();
  const legacyRecs = legacy.generateRecommendations(SERVER_FIXTURES, 'us-east-1');

  for (let i = 0; i < SERVER_FIXTURES.length; i++) {
    const server = SERVER_FIXTURES[i];
    const legacyRec = legacyRecs[i];

    const totalVcpus = server.numCpus * server.numCoresPerCpu * (server.numThreadsPerCore || 1);
    const nextRec = awsProvider.compute.recommend({
      hostname: server.hostname,
      totalVcpus,
      totalRamGB: server.totalRAM,
      totalDiskGB: server.totalDiskSize,
      os: normalizeOs(server.osName),
      avgCpuUsage: server.avgCpuUsage,
      avgRamUsage: server.avgRamUsage,
      region: 'us-east-1',
    });

    if (nextRec.recommendedSku !== legacyRec.recommendedInstance) {
      diffs.push({ fixture: server.hostname, field: 'recommendedInstance/Sku', legacy: legacyRec.recommendedInstance, next: nextRec.recommendedSku });
    }
    if (nextRec.family !== legacyRec.instanceFamily &&
        // Legacy uses 't3' / 'm5' / 'r5' / 'c5' family literals; new uses semantic 'burstable' / 'general' / etc.
        !(legacyRec.instanceFamily === 't3' && nextRec.family === 'burstable') &&
        !(legacyRec.instanceFamily === 'm5' && nextRec.family === 'general') &&
        !(legacyRec.instanceFamily === 'r5' && nextRec.family === 'memory_optimized') &&
        !(legacyRec.instanceFamily === 'c5' && nextRec.family === 'compute_optimized')) {
      diffs.push({ fixture: server.hostname, field: 'family', legacy: legacyRec.instanceFamily, next: nextRec.family });
    }
    if (!approxEqual(nextRec.monthlyEstimateOnDemand, legacyRec.monthlyEstimate)) {
      diffs.push({ fixture: server.hostname, field: 'monthlyEstimate', legacy: legacyRec.monthlyEstimate, next: nextRec.monthlyEstimateOnDemand });
    }
    if (nextRec.rightsizingNote !== legacyRec.rightsizingNote &&
        !(legacyRec.rightsizingNote.startsWith('Rightsized') && nextRec.rightsizingNote.startsWith('Rightsized'))) {
      // Tolerate small wording variations as long as both are direct/rightsized.
      diffs.push({ fixture: server.hostname, field: 'rightsizingNote', legacy: legacyRec.rightsizingNote, next: nextRec.rightsizingNote });
    }
  }
  return diffs;
}

function runDatabaseParity(): Diff[] {
  const diffs: Diff[] = [];
  const legacy = new EC2RecommendationService();
  const legacyRecs = legacy.generateDatabaseRecommendations(DATABASE_FIXTURES, 'us-east-1');

  for (let i = 0; i < DATABASE_FIXTURES.length; i++) {
    const db = DATABASE_FIXTURES[i];
    const legacyRec = legacyRecs[i];

    const nextRec = awsProvider.database.recommend({
      dbName: db.dbName,
      engineType: db.engineType,
      totalSizeGB: db.totalSize,
      licenseModel: db.licenseModel,
      region: 'us-east-1',
    });

    if (nextRec.recommendedSku !== legacyRec.instanceClass) {
      diffs.push({ fixture: db.dbName, field: 'instanceClass/Sku', legacy: legacyRec.instanceClass, next: nextRec.recommendedSku });
    }
    if (nextRec.targetService !== legacyRec.targetEngine) {
      diffs.push({ fixture: db.dbName, field: 'targetService', legacy: legacyRec.targetEngine, next: nextRec.targetService });
    }
    if (!approxEqual(nextRec.monthlyEstimateOnDemand, legacyRec.monthlyEstimate)) {
      diffs.push({ fixture: db.dbName, field: 'monthlyEstimate', legacy: legacyRec.monthlyEstimate, next: nextRec.monthlyEstimateOnDemand });
    }
  }
  return diffs;
}

function main(): void {
  console.log('Running AWS parity check...\n');

  const computeDiffs = runComputeParity();
  console.log(`Compute fixtures: ${SERVER_FIXTURES.length} | diffs: ${computeDiffs.length}`);

  const dbDiffs = runDatabaseParity();
  console.log(`Database fixtures: ${DATABASE_FIXTURES.length} | diffs: ${dbDiffs.length}`);

  const all = [...computeDiffs, ...dbDiffs];
  if (all.length === 0) {
    console.log('\n✅ All fixtures match — awsProvider is at parity with the legacy EC2RecommendationService.');
    process.exit(0);
  }

  console.log('\n❌ Parity diffs detected:');
  for (const d of all) {
    console.log(`  [${d.fixture}] ${d.field}: legacy=${JSON.stringify(d.legacy)} next=${JSON.stringify(d.next)}`);
  }
  process.exit(1);
}

main();
