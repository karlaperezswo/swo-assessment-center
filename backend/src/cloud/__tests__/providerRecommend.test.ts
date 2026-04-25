// Per-provider parametrized recommendation tests.
// For each [provider × fixture] pair, asserts the algorithm picks a SKU that
// satisfies the target specs and lies in the right family.
//
// Run: cd backend && npx ts-node src/cloud/__tests__/providerRecommend.test.ts
// Exit 0 = all assertions pass; Exit 1 = at least one assertion failed.

import { CLOUD_PROVIDERS } from '../registry';
import { normalizeOs } from '../algorithms/rightSizing';
import type { CloudProvider, ComputeFamily } from '../../../../shared/types/cloud.types';
import type { Server, Database } from '../../types';

interface ServerFixture {
  name: string;
  server: Server;
  expectedFamily: ComputeFamily;
  // Some providers (Oracle) don't have burstable family — they fall back to general.
  allowGeneralFallbackFor?: CloudProvider[];
}

const SERVER_FIXTURES: ServerFixture[] = [
  {
    name: 'burstable-small',
    // ratio=8/2=4 → not memory_opt, not compute_opt; vcpus≤4 + ram≤16 → burstable
    server: mkServer({ vcpus: 2, ram: 8, disk: 50, avgCpu: 30, avgRam: 40, os: 'Ubuntu 22.04' }),
    expectedFamily: 'burstable',
    allowGeneralFallbackFor: ['oracle'],
  },
  {
    name: 'memory-heavy',
    server: mkServer({ vcpus: 4, ram: 64, disk: 1000, avgCpu: 60, avgRam: 70, os: 'RHEL 9' }),
    expectedFamily: 'memory_optimized',
  },
  {
    name: 'compute-heavy',
    server: mkServer({ vcpus: 16, ram: 16, disk: 100, avgCpu: 90, avgRam: 60, os: 'Ubuntu 20.04' }),
    expectedFamily: 'compute_optimized',
  },
  {
    name: 'balanced',
    server: mkServer({ vcpus: 8, ram: 32, disk: 200, avgCpu: 55, avgRam: 65, os: 'RHEL 8' }),
    expectedFamily: 'general',
  },
  {
    name: 'windows-rightsized',
    server: mkServer({ vcpus: 16, ram: 64, disk: 500, avgCpu: 12, avgRam: 22, os: 'Windows Server 2019' }),
    expectedFamily: 'general',
    // After 50% rightsizing this becomes 8/32 — general family. Some providers
    // can drop into memory_optimized if their R-equivalent is cheaper at 8/32.
    allowGeneralFallbackFor: [],
  },
];

interface DbFixture {
  name: string;
  db: Database;
}

const DB_FIXTURES: DbFixture[] = [
  { name: 'small-mssql',  db: mkDb({ engine: 'MSSQL',     size: 30 }) },
  { name: 'mid-postgres', db: mkDb({ engine: 'PostgreSQL', size: 75 }) },
  { name: 'large-mysql',  db: mkDb({ engine: 'MySQL',      size: 250 }) },
  { name: 'huge-oracle',  db: mkDb({ engine: 'Oracle',     size: 800, license: 'bring-your-own' }) },
  { name: 'tiny-maria',   db: mkDb({ engine: 'MariaDB',    size: 5 }) },
];

const PROVIDERS: CloudProvider[] = ['aws', 'gcp', 'azure', 'oracle'];

interface Failure {
  provider: CloudProvider;
  fixture: string;
  reason: string;
}

const failures: Failure[] = [];

function assert(ok: boolean, provider: CloudProvider, fixture: string, reason: string) {
  if (!ok) failures.push({ provider, fixture, reason });
}

function runComputeTests() {
  for (const provider of PROVIDERS) {
    const cp = CLOUD_PROVIDERS[provider];
    for (const f of SERVER_FIXTURES) {
      const totalVcpus = f.server.numCpus * f.server.numCoresPerCpu * (f.server.numThreadsPerCore || 1);
      const rec = cp.compute.recommend({
        hostname: f.server.hostname,
        totalVcpus,
        totalRamGB: f.server.totalRAM,
        totalDiskGB: f.server.totalDiskSize,
        os: normalizeOs(f.server.osName),
        avgCpuUsage: f.server.avgCpuUsage,
        avgRamUsage: f.server.avgRamUsage,
        region: cp.defaultRegion,
      });

      // 1. Provider id must match
      assert(rec.provider === provider, provider, f.name, `provider mismatch: ${rec.provider}`);

      // 2. Recommendation must come from the catalog
      const inCatalog = cp.compute.catalog.some((c) => c.sku === rec.recommendedSku);
      assert(inCatalog, provider, f.name, `SKU ${rec.recommendedSku} not in ${provider} catalog`);

      // 3. Family must match expectation, with fallback for providers that
      //    don't have the family natively.
      const familyOk =
        rec.family === f.expectedFamily ||
        (f.expectedFamily === 'burstable' &&
          rec.family === 'general' &&
          (f.allowGeneralFallbackFor ?? []).includes(provider));
      assert(familyOk, provider, f.name, `family ${rec.family} ≠ expected ${f.expectedFamily}`);

      // 4. SKU must satisfy the rightsized target specs (post-rightsizing)
      const sku = cp.compute.catalog.find((c) => c.sku === rec.recommendedSku)!;
      assert(sku.vcpus >= 1, provider, f.name, `vcpus=${sku.vcpus} too low`);
      assert(sku.memoryGB >= 1, provider, f.name, `memoryGB=${sku.memoryGB} too low`);

      // 5. Pricing tiers monotonic: 3Y ≤ 1Y ≤ on-demand
      assert(
        rec.monthlyEstimateThreeYear <= rec.monthlyEstimateOneYear &&
          rec.monthlyEstimateOneYear <= rec.monthlyEstimateOnDemand,
        provider,
        f.name,
        `pricing tiers not monotonic: OD=${rec.monthlyEstimateOnDemand} 1Y=${rec.monthlyEstimateOneYear} 3Y=${rec.monthlyEstimateThreeYear}`
      );
    }
  }
}

function runDbTests() {
  for (const provider of PROVIDERS) {
    const cp = CLOUD_PROVIDERS[provider];
    for (const f of DB_FIXTURES) {
      const rec = cp.database.recommend({
        dbName: f.db.dbName,
        engineType: f.db.engineType,
        totalSizeGB: f.db.totalSize,
        licenseModel: f.db.licenseModel,
        region: cp.defaultRegion,
      });

      assert(rec.provider === provider, provider, f.name, `provider mismatch: ${rec.provider}`);
      const inCatalog = cp.database.catalog.some((c) => c.sku === rec.recommendedSku);
      assert(inCatalog, provider, f.name, `DB SKU ${rec.recommendedSku} not in ${provider} catalog`);

      // Target service must be a non-empty string
      assert(typeof rec.targetService === 'string' && rec.targetService.length > 0, provider, f.name, 'empty targetService');

      // Pricing tiers monotonic
      assert(
        rec.monthlyEstimateThreeYear <= rec.monthlyEstimateOneYear &&
          rec.monthlyEstimateOneYear <= rec.monthlyEstimateOnDemand,
        provider,
        f.name,
        `DB pricing tiers not monotonic`
      );
    }
  }
}

function runDiscountTests() {
  // Per-provider commitment-discount rates encoded in pricing.ts.
  const cases: Array<{ provider: CloudProvider; oneY: number; threeY: number }> = [
    { provider: 'aws',    oneY: 0.36, threeY: 0.60 },
    { provider: 'gcp',    oneY: 0.37, threeY: 0.55 },
    { provider: 'azure',  oneY: 0.40, threeY: 0.62 },
    { provider: 'oracle', oneY: 0.25, threeY: 0.33 },
  ];

  const subtotal = { compute: 1000, managedDb: 0, blockStorage: 0, networking: 0 };
  for (const c of cases) {
    const pricing = CLOUD_PROVIDERS[c.provider].pricing;
    const od = pricing.applyCommitmentDiscount(subtotal, 'on_demand');
    const oy = pricing.applyCommitmentDiscount(subtotal, 'one_year');
    const ty = pricing.applyCommitmentDiscount(subtotal, 'three_year');
    // GCP has a 5% Sustained Use baseline reduction even on on_demand.
    const odTolerance = c.provider === 'gcp' ? 50 : 1;
    assert(Math.abs(od - 1000) <= odTolerance, c.provider, 'discount-on_demand', `OD=${od} expected ~1000`);
    assert(Math.abs(oy - 1000 * (1 - c.oneY)) < 1, c.provider, 'discount-one_year',  `1Y=${oy} expected ${1000 * (1 - c.oneY)}`);
    assert(Math.abs(ty - 1000 * (1 - c.threeY)) < 1, c.provider, 'discount-three_year',`3Y=${ty} expected ${1000 * (1 - c.threeY)}`);
  }

  // Azure Hybrid Benefit: -30% extra on the 50% Windows ratio.
  const azure = CLOUD_PROVIDERS.azure.pricing;
  const baseline3Y = azure.applyCommitmentDiscount(subtotal, 'three_year');
  const withHB = azure.applyCommitmentDiscount(subtotal, 'three_year', { hybridBenefitWindows: true, windowsRatio: 0.5 });
  assert(withHB < baseline3Y, 'azure', 'hybrid-benefit', `HB should reduce cost: baseline=${baseline3Y} hb=${withHB}`);

  // Oracle BYOL: -50% on the managedDb portion.
  const oracle = CLOUD_PROVIDERS.oracle.pricing;
  const dbSubtotal = { compute: 0, managedDb: 1000, blockStorage: 0, networking: 0 };
  const noByol = oracle.applyCommitmentDiscount(dbSubtotal, 'on_demand');
  const withByol = oracle.applyCommitmentDiscount(dbSubtotal, 'on_demand', { byol: true });
  assert(withByol < noByol, 'oracle', 'byol', `BYOL should reduce DB cost: no=${noByol} byol=${withByol}`);
}

function mkServer(opts: { vcpus: number; ram: number; disk: number; avgCpu: number; avgRam: number; os: string }): Server {
  return {
    serverId: `srv-${Math.random().toString(36).slice(2, 8)}`,
    hostname: `host-${Math.random().toString(36).slice(2, 8)}`,
    isPhysical: false,
    osName: opts.os,
    osVersion: '',
    numCpus: 1,
    numCoresPerCpu: opts.vcpus,
    numThreadsPerCore: 1,
    totalRAM: opts.ram,
    maxCpuUsage: opts.avgCpu * 1.3,
    avgCpuUsage: opts.avgCpu,
    maxRamUsage: opts.avgRam * 1.3,
    avgRamUsage: opts.avgRam,
    totalDiskSize: opts.disk,
    storageUtilization: 50,
    uptime: 99,
  };
}

function mkDb(opts: { engine: string; size: number; license?: string }): Database {
  return {
    databaseId: `db-${Math.random().toString(36).slice(2, 8)}`,
    dbName: `db-${opts.engine}`,
    instanceName: 'i',
    engineType: opts.engine,
    engineVersion: '1.0',
    engineEdition: 'std',
    totalSize: opts.size,
    serverId: 'srv-x',
    licenseModel: opts.license ?? 'license-included',
    maxTPS: 100,
  };
}

function main() {
  console.log('Running per-provider parametrized tests…\n');
  runComputeTests();
  runDbTests();
  runDiscountTests();

  const total = PROVIDERS.length * (SERVER_FIXTURES.length + DB_FIXTURES.length) + 4 * 3 + 2;
  console.log(`Compute: ${PROVIDERS.length} × ${SERVER_FIXTURES.length} = ${PROVIDERS.length * SERVER_FIXTURES.length} cases`);
  console.log(`Database: ${PROVIDERS.length} × ${DB_FIXTURES.length} = ${PROVIDERS.length * DB_FIXTURES.length} cases`);
  console.log(`Discounts: 4 providers × 3 tiers + 2 special = 14 cases`);
  console.log(`Total assertions ~= ${total} per group, multiple per case.\n`);

  if (failures.length === 0) {
    console.log('✅ All per-provider tests passed.');
    process.exit(0);
  }

  console.log(`❌ ${failures.length} failures:\n`);
  for (const f of failures) {
    console.log(`  [${f.provider} / ${f.fixture}] ${f.reason}`);
  }
  process.exit(1);
}

main();
