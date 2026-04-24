/**
 * Lightweight smoke tests for new Phase 1-5 utilities.
 *
 * These are intentionally framework-free so they can be executed ad-hoc
 * (via tsx or ts-node) without pulling jest/vitest into the frontend.
 *
 * Run:
 *   npx tsx frontend/src/lib/__smoke__/smokeTests.ts
 *
 * Exit 0 = all pass. Exit 1 = at least one failure.
 */

import { computeReadiness } from '../migrationReadiness';
import { buildScenarios, DEFAULT_SCENARIO_CONFIG, scenariosToCsv } from '../tcoScenarios';
import { evaluateRisks, DEFAULT_RISK_RULES } from '../riskRules';
import { detectClusters, detectWaveConflicts, suggestWavesFromClusters } from '../dependencyClusters';
import { validateExcelData } from '../excelValidation';
import { briefingsToIcs, immersionDaysToIcs } from '../icsExport';
import { ExcelData, MigrationWave } from '../../types/assessment';

let passed = 0;
let failed = 0;

function assert(cond: unknown, label: string): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

function section(name: string, fn: () => void): void {
  console.log(`\n${name}`);
  try {
    fn();
  } catch (err) {
    failed++;
    console.error(`  ✗ threw: ${(err as Error).message}`);
  }
}

const fixtureExcel: ExcelData = {
  dataSource: 'AWS_MPA',
  servers: [
    {
      serverId: 's1',
      hostname: 'web01',
      isPhysical: false,
      osName: 'Windows Server 2008 R2',
      osVersion: '6.1',
      numCpus: 2,
      numCoresPerCpu: 2,
      numThreadsPerCore: 1,
      totalRAM: 16,
      maxCpuUsage: 80,
      avgCpuUsage: 40,
      maxRamUsage: 70,
      avgRamUsage: 50,
      totalDiskSize: 500,
      storageUtilization: 60,
      uptime: 99,
    },
    {
      serverId: 's2',
      hostname: 'db01',
      isPhysical: false,
      osName: 'Ubuntu 22.04',
      osVersion: '22.04',
      numCpus: 4,
      numCoresPerCpu: 4,
      numThreadsPerCore: 2,
      totalRAM: 64,
      maxCpuUsage: 65,
      avgCpuUsage: 45,
      maxRamUsage: 80,
      avgRamUsage: 60,
      totalDiskSize: 1000,
      storageUtilization: 50,
      uptime: 99,
    },
  ],
  databases: [
    {
      databaseId: 'd1',
      dbName: 'sales',
      instanceName: 'sales-inst',
      engineType: 'SQL Server',
      engineVersion: '2012',
      engineEdition: 'Standard',
      totalSize: 600,
      serverId: 's2',
      licenseModel: 'license-included',
      maxTPS: 500,
    },
  ],
  applications: [],
  serverApplicationMappings: [],
  serverCommunications: [
    { source: 'web01', target: 'db01', port: 1433, protocol: 'TCP' },
  ],
  securityGroups: [],
};

section('migrationReadiness — flags EOL Windows 2008 + outdated SQL 2012', () => {
  const report = computeReadiness(fixtureExcel, {});
  assert(report.overallScore >= 0 && report.overallScore <= 100, 'score in [0,100]');
  assert(report.dimensions.length === 4, '4 dimensions');
  const techChecks = report.dimensions.find((d) => d.id === 'technical')!.checks;
  assert(techChecks.find((c) => c.id === 'tech.eol_os')!.passed === false, 'EOL OS detected');
  assert(techChecks.find((c) => c.id === 'tech.db_versions')!.passed === false, 'outdated DB detected');
  assert(report.gaps.length > 0, 'gaps list populated');
});

section('tcoScenarios — builds 5 scenarios with descending TCO', () => {
  const costs = {
    onDemand: { monthly: 10000, annual: 120000, threeYear: 360000 },
    oneYearNuri: { monthly: 7000, annual: 84000, threeYear: 252000 },
    threeYearNuri: { monthly: 5000, annual: 60000, threeYear: 180000 },
  };
  const scenarios = buildScenarios(costs, DEFAULT_SCENARIO_CONFIG);
  assert(scenarios.length === 5, '5 scenarios');
  const onDemand = scenarios.find((s) => s.id === 'on-demand')!;
  const threeY = scenarios.find((s) => s.id === '3y-reserved')!;
  assert(onDemand.savingsVsOnDemand === 0, 'on-demand has no savings');
  assert(threeY.savingsVsOnDemand > 0, '3Y has positive savings');
  const csv = scenariosToCsv(scenarios);
  assert(csv.includes('Scenario,Commitment'), 'CSV has header');
  assert(csv.split('\n').length === scenarios.length + 1, 'CSV row count matches');
});

section('riskRules — evaluates default rules against fixture', () => {
  const matches = evaluateRisks(fixtureExcel, DEFAULT_RISK_RULES);
  assert(matches.length >= 2, 'at least 2 risks detected');
  assert(matches.some((m) => m.entity === 'web01'), 'web01 flagged');
  assert(matches.some((m) => m.entity === 'sales'), 'SQL 2012 DB flagged');
});

section('dependencyClusters — detects components and wave conflicts', () => {
  const clusters = detectClusters(['a', 'b', 'c', 'd'], [
    { source: 'a', target: 'b' },
    { source: 'c', target: 'd' },
  ]);
  assert(clusters.length === 2, '2 connected components');
  assert(clusters[0].servers.length === 2, 'first cluster has 2 servers');

  const waves: MigrationWave[] = [
    {
      id: 'w1', name: 'Wave 1', waveNumber: 1, startDate: '', endDate: '',
      serverCount: 1, applicationCount: 0, status: 'planned', strategy: 'Rehost',
      notes: '', servers: ['a'],
    },
    {
      id: 'w2', name: 'Wave 2', waveNumber: 2, startDate: '', endDate: '',
      serverCount: 1, applicationCount: 0, status: 'planned', strategy: 'Rehost',
      notes: '', servers: ['b'],
    },
  ];
  const conflicts = detectWaveConflicts(waves, [{ source: 'a', target: 'b' }]);
  assert(conflicts.length === 1, 'a→b across waves = conflict');
  const suggested = suggestWavesFromClusters(clusters);
  assert(suggested.length === 2, 'one suggested wave per cluster');
});

section('validateExcelData — reports stats and issues', () => {
  const result = validateExcelData(fixtureExcel);
  assert(result.stats.servers === 2, 'stats reflects 2 servers');
  assert(result.stats.dependencies === 1, 'stats reflects 1 dependency');
  // with 2 servers both having avg CPU > 0, low-cpu-coverage should NOT trigger
  assert(!result.issues.some((i) => i.code === 'low-cpu-coverage'), 'no low-cpu warning when coverage ok');

  const empty = validateExcelData(null);
  assert(!empty.valid, 'null data is invalid');
  assert(empty.issues[0].code === 'no-data', 'flagged as no-data');
});

section('icsExport — produces well-formed calendars', () => {
  const ics = briefingsToIcs([
    {
      id: 'b1', title: 'Kickoff', type: 'briefing', date: '2026-05-01',
      status: 'planned', attendees: 5, notes: 'Intro',
    },
  ]);
  assert(ics.includes('BEGIN:VCALENDAR'), 'VCALENDAR header');
  assert(ics.includes('BEGIN:VEVENT'), 'has event block');
  assert(ics.includes('Kickoff'), 'includes title');

  const idIcs = immersionDaysToIcs([
    {
      id: 'i1', topic: 'AWS Fundamentals', date: '2026-05-10',
      duration: '8 hours', objectives: ['IAM', 'VPC'], status: 'planned', deliverables: ['Slides'],
    },
  ]);
  assert(idIcs.includes('AWS Fundamentals'), 'immersion title present');
  assert(idIcs.includes('DURATION') === false, 'uses DTEND not DURATION');
});

console.log(`\n———\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
