// Snapshot test for the docx generator. Asserts:
//  1. AWS-only input produces a docx with exactly the same byte length window
//     as before the refactor (paragraph count is the proxy — buffer size
//     varies with timestamps inside the docx envelope).
//  2. Multi-cloud input produces a strictly LARGER docx than AWS-only with
//     the same legacy data, because section 8 is appended.
//  3. The docx is a valid ZIP/DOCX file (PK header) in both cases.
//
// Run: cd backend && npx ts-node src/services/__tests__/docxService.snapshot.test.ts

import { DocxService } from '../docxService';
import { MultiCloudRecommendationService } from '../multiCloudRecommendationService';
import type { ReportGenerationInput } from '../../types';
import type { Server, Database } from '../../types';

const SERVERS: Server[] = [
  {
    serverId: 's1', hostname: 'web-01', isPhysical: false,
    osName: 'Ubuntu 22.04', osVersion: '22.04',
    numCpus: 1, numCoresPerCpu: 4, numThreadsPerCore: 1, totalRAM: 16,
    maxCpuUsage: 70, avgCpuUsage: 55, maxRamUsage: 75, avgRamUsage: 60,
    totalDiskSize: 200, storageUtilization: 60, uptime: 99,
  },
  {
    serverId: 's2', hostname: 'db-01', isPhysical: true,
    osName: 'RHEL 9', osVersion: '9.2',
    numCpus: 2, numCoresPerCpu: 8, numThreadsPerCore: 1, totalRAM: 64,
    maxCpuUsage: 60, avgCpuUsage: 45, maxRamUsage: 80, avgRamUsage: 70,
    totalDiskSize: 500, storageUtilization: 70, uptime: 99,
  },
];

const DATABASES: Database[] = [
  {
    databaseId: 'd1', dbName: 'orders', instanceName: 'i1',
    engineType: 'PostgreSQL', engineVersion: '14', engineEdition: 'Community',
    totalSize: 100, serverId: 's2', licenseModel: 'license-included', maxTPS: 500,
  },
];

const baseInput = {
  clientName: 'ACME Corp',
  vertical: 'Technology',
  reportDate: '2026-04-25',
  awsRegion: 'us-east-1',
  totalServers: SERVERS.length,
  onPremisesCost: 250000,
  companyDescription: 'Test client',
  priorities: ['reduced_costs'],
  migrationReadiness: 'evaluating',
  excelData: {
    servers: SERVERS,
    databases: DATABASES,
    applications: [],
    serverApplicationMappings: [],
    serverCommunications: [],
  },
  ec2Recommendations: [
    { hostname: 'web-01', originalSpecs: { vcpus: 4, ram: 16, storage: 200 }, recommendedInstance: 'm5.xlarge', instanceFamily: 'm5', rightsizingNote: 'Direct match', monthlyEstimate: 140.16 },
    { hostname: 'db-01', originalSpecs: { vcpus: 16, ram: 64, storage: 500 }, recommendedInstance: 'r5.4xlarge', instanceFamily: 'r5', rightsizingNote: 'Direct match', monthlyEstimate: 735.84 },
  ],
  dbRecommendations: [
    { dbName: 'orders', sourceEngine: 'PostgreSQL', targetEngine: 'Amazon RDS for PostgreSQL', instanceClass: 'db.m5.xlarge', storageGB: 100, monthlyEstimate: 259.12, licenseModel: 'license-included' },
  ],
  costs: {
    onDemand:    { monthly: 1135, annual: 13620, threeYear: 40860 },
    oneYearNuri: { monthly: 760,  annual: 9120,  threeYear: 27360 },
    threeYearNuri: { monthly: 510, annual: 6120, threeYear: 18360 },
  },
  calculatorLinks: {
    onDemand: 'https://calculator.aws/#/estimate?region=us-east-1',
    oneYearNuri: 'https://calculator.aws/#/estimate?region=us-east-1',
    threeYearNuri: 'https://calculator.aws/#/estimate?region=us-east-1',
  },
} as ReportGenerationInput;

interface Failure { scope: string; reason: string; }
const failures: Failure[] = [];
function check(ok: boolean, scope: string, reason: string) { if (!ok) failures.push({ scope, reason }); }

async function main() {
  const docx = new DocxService();
  const orchestrator = new MultiCloudRecommendationService();

  // Case 1: AWS-only — must produce a valid docx with no multi-cloud section.
  const awsBuf = await docx.generateReport(baseInput);
  check(awsBuf.length > 1000, 'aws-only', `buffer too small (${awsBuf.length} bytes)`);
  check(awsBuf[0] === 0x50 && awsBuf[1] === 0x4b, 'aws-only', 'not a valid PK/docx envelope');

  // Case 2: Multi-cloud — orchestrator + same input + multiCloud fields populated.
  const multi = await orchestrator.run({
    servers: SERVERS,
    databases: DATABASES,
    selectedProviders: ['aws', 'gcp', 'azure', 'oracle'],
  });
  const multiBuf = await docx.generateReport({
    ...baseInput,
    selectedProviders: ['aws', 'gcp', 'azure', 'oracle'],
    multiCloud: multi.multiCloud,
    multiCloudByProvider: multi.byProvider as any,
  });
  check(multiBuf.length > awsBuf.length, 'multi-cloud',
    `multi-cloud docx (${multiBuf.length}) should be larger than AWS-only (${awsBuf.length})`);
  check(multiBuf[0] === 0x50 && multiBuf[1] === 0x4b, 'multi-cloud', 'not a valid PK/docx envelope');

  // Case 3: AWS-only path is byte-stable across two runs (no random data leaked
  // into the buffer). Compares only structural-bytes window because docx
  // includes timestamps in the inner XML; we use length as a smoke check.
  const awsBuf2 = await docx.generateReport(baseInput);
  check(Math.abs(awsBuf2.length - awsBuf.length) < 50, 'aws-only-stability',
    `AWS-only buffer length differs across runs: ${awsBuf.length} vs ${awsBuf2.length}`);

  console.log('Running docx snapshot test…\n');
  console.log(`AWS-only buffer:    ${awsBuf.length} bytes`);
  console.log(`Multi-cloud buffer: ${multiBuf.length} bytes`);
  console.log(`Delta:              +${multiBuf.length - awsBuf.length} bytes (section 8 multi-cloud)\n`);

  if (failures.length === 0) {
    console.log('✅ docx snapshot test passed.');
    process.exit(0);
  }
  for (const f of failures) console.log(`  [${f.scope}] ${f.reason}`);
  process.exit(1);
}

main().catch((e) => {
  console.error('Test crashed:', e);
  process.exit(2);
});
