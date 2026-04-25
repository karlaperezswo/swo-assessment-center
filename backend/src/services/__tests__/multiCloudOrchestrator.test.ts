// End-to-end smoke test for MultiCloudRecommendationService.
// Asserts the orchestrator runs all 4 providers in one call, returns a
// per-provider payload + a multi-cloud rollup with `cheapest` correctly
// identified.
//
// Run: cd backend && npx ts-node src/services/__tests__/multiCloudOrchestrator.test.ts

import { MultiCloudRecommendationService } from '../multiCloudRecommendationService';
import type { Server, Database } from '../../types';
import type { CloudProvider } from '../../../../shared/types/cloud.types';

const SERVERS: Server[] = [
  {
    serverId: 's1', hostname: 'web-01', isPhysical: false,
    osName: 'Ubuntu 22.04', osVersion: '22.04',
    numCpus: 1, numCoresPerCpu: 4, numThreadsPerCore: 1,
    totalRAM: 16,
    maxCpuUsage: 70, avgCpuUsage: 55, maxRamUsage: 75, avgRamUsage: 60,
    totalDiskSize: 200, storageUtilization: 60, uptime: 99,
  },
  {
    serverId: 's2', hostname: 'db-01', isPhysical: true,
    osName: 'RHEL 9', osVersion: '9.2',
    numCpus: 2, numCoresPerCpu: 8, numThreadsPerCore: 1,
    totalRAM: 128,
    maxCpuUsage: 60, avgCpuUsage: 45, maxRamUsage: 80, avgRamUsage: 70,
    totalDiskSize: 1000, storageUtilization: 70, uptime: 99,
  },
];

const DATABASES: Database[] = [
  {
    databaseId: 'd1', dbName: 'orders', instanceName: 'i1',
    engineType: 'PostgreSQL', engineVersion: '14', engineEdition: 'Community',
    totalSize: 100, serverId: 's2', licenseModel: 'license-included', maxTPS: 500,
  },
];

interface Failure {
  scope: string;
  reason: string;
}
const failures: Failure[] = [];
function check(ok: boolean, scope: string, reason: string) {
  if (!ok) failures.push({ scope, reason });
}

async function main() {
  const svc = new MultiCloudRecommendationService();

  // Case 1: AWS-only — should match the legacy single-provider behavior.
  const awsOnly = await svc.run({
    servers: SERVERS,
    databases: DATABASES,
    selectedProviders: ['aws'],
  });
  check(!!awsOnly.byProvider.aws, 'aws-only', 'no aws result');
  check(awsOnly.byProvider.aws!.compute.length === SERVERS.length, 'aws-only', 'compute count mismatch');
  check(awsOnly.byProvider.aws!.databases.length === DATABASES.length, 'aws-only', 'db count mismatch');
  check(awsOnly.multiCloud.providers.length === 1, 'aws-only', 'multiCloud.providers.length should be 1');
  check(awsOnly.multiCloud.cheapest === 'aws', 'aws-only', 'cheapest should be aws when only aws');

  // Case 2: All four clouds — every one should appear in byProvider with data.
  const all = await svc.run({
    servers: SERVERS,
    databases: DATABASES,
    selectedProviders: ['aws', 'gcp', 'azure', 'oracle'],
  });
  for (const p of ['aws', 'gcp', 'azure', 'oracle'] as CloudProvider[]) {
    check(!!all.byProvider[p], `all-clouds:${p}`, `missing byProvider.${p}`);
    check(all.byProvider[p]!.compute.length === SERVERS.length, `all-clouds:${p}`, 'compute count mismatch');
    check(all.byProvider[p]!.databases.length === DATABASES.length, `all-clouds:${p}`, 'db count mismatch');
    check(all.byProvider[p]!.compute.every((r) => r.provider === p), `all-clouds:${p}`, 'compute provider tag wrong');
    check(all.byProvider[p]!.databases.every((r) => r.provider === p), `all-clouds:${p}`, 'db provider tag wrong');
  }
  check(all.multiCloud.providers.length === 4, 'all-clouds', 'multiCloud.providers should have 4');
  // Cheapest should be one of the four
  check(['aws', 'gcp', 'azure', 'oracle'].includes(all.multiCloud.cheapest), 'all-clouds', 'cheapest is invalid');
  // Cheapest must actually have the lowest 3Y commit
  const cheapestCost = all.byProvider[all.multiCloud.cheapest]!.cost.threeYearCommit.monthly;
  for (const p of all.multiCloud.providers) {
    check(p.threeYearCommit.monthly >= cheapestCost - 0.01, 'all-clouds', `${p.provider} (${p.threeYearCommit.monthly}) is cheaper than declared cheapest ${all.multiCloud.cheapest} (${cheapestCost})`);
  }
  check(all.multiCloud.comparisonNotes.length > 0, 'all-clouds', 'expected at least one comparison note when >1 cloud');

  // Case 3: empty selectedProviders falls back to AWS
  const empty = await svc.run({ servers: SERVERS, databases: DATABASES, selectedProviders: [] });
  check(!!empty.byProvider.aws, 'empty-fallback', 'should default to aws when selectedProviders empty');

  // Case 4: per-provider regions are honored
  const customRegions = await svc.run({
    servers: SERVERS,
    databases: DATABASES,
    selectedProviders: ['aws', 'gcp'],
    regions: { aws: 'eu-west-1', gcp: 'europe-west3' },
  });
  check(customRegions.byProvider.aws!.region === 'eu-west-1', 'regions', 'aws region not honored');
  check(customRegions.byProvider.gcp!.region === 'europe-west3', 'regions', 'gcp region not honored');

  // Case 5: pricing flags are forwarded
  const withFlags = await svc.run({
    servers: SERVERS,
    databases: DATABASES,
    selectedProviders: ['azure', 'oracle'],
    pricingFlags: {
      azure: { hybridBenefitWindows: true, windowsRatio: 0.5 },
      oracle: { byol: true },
    },
  });
  // Just verify the run completed; the discount math is asserted in providerRecommend.test.ts
  check(!!withFlags.byProvider.azure && !!withFlags.byProvider.oracle, 'flags', 'flags run did not return both providers');

  console.log('Running multi-cloud orchestrator end-to-end test…\n');
  console.log(`Cases:  AWS-only · all-4 · empty-fallback · custom-regions · pricing-flags`);
  console.log(`Failures: ${failures.length}\n`);

  if (failures.length === 0) {
    console.log('✅ MultiCloudRecommendationService end-to-end test passed.');
    process.exit(0);
  }

  for (const f of failures) {
    console.log(`  [${f.scope}] ${f.reason}`);
  }
  process.exit(1);
}

main().catch((e) => {
  console.error('Test crashed:', e);
  process.exit(2);
});
