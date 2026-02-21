const XLSX = require('xlsx');

// Read the Concierto file - simulating what backend parser does
const workbook = XLSX.readFile('Concierto MPA Report.xlsx');
const inventorySheet = workbook.Sheets['Inventory Master'];
const rawData = XLSX.utils.sheet_to_json(inventorySheet, { header: 1 });

// Use headerRow = 1 (same as backend parser)
const headers = rawData[1];
const dataRows = rawData.slice(2);

// Convert to objects (same as backend)
const servers = dataRows
  .filter(row => row[0]) // Has hostname
  .map(row => {
    const server = {};
    headers.forEach((header, idx) => {
      if (header) server[header] = row[idx];
    });
    return server;
  })
  .map(row => ({
    hostname: row['Host Name '] || '',
    ipAddress: row['IP Address'] || '',
    osName: row['Operating System'] || '',
    numCpus: parseInt(row['CPU Count']) || 1,
    numCoresPerCpu: 1,
    totalRAM: parseFloat(row['Memory (MB)']) / 1024 || 0,
    avgCpuUsage: parseFloat(row['Cpu Utilization Avg (%)']) || 0,
    avgRamUsage: parseFloat(row['Memory Utilization Avg (%)']) || 0,
    totalDiskSize: parseFloat(row['Provisioned Storage (GB)']) || 0,
    uptime: 0,
    environment: row['Environment'] || '',
    vmFunctionality: row['VM Funcationality'] || '',
    sqlEdition: row['SQL Edition'] || ''
  }));

console.log(`\n📊 Total servers parsed: ${servers.length}\n`);

// FRONTEND LOGIC - Exact copy from SevenRsChart.tsx
function assignMigrationStrategy(server) {
  const cpuUsage = server.avgCpuUsage || 0;
  const ramUsage = server.avgRamUsage || 0;
  const osName = server.osName?.toLowerCase() || '';
  const sqlEdition = server.sqlEdition?.toLowerCase() || '';

  // Helper to check if it's a real database server
  const isRealDatabase = sqlEdition &&
    sqlEdition !== 'not applicable' &&
    sqlEdition !== 'n/a' &&
    sqlEdition !== 'none' &&
    (sqlEdition.includes('sql server') ||
     sqlEdition.includes('oracle') ||
     sqlEdition.includes('mysql') ||
     sqlEdition.includes('postgres') ||
     sqlEdition.includes('standard') ||
     sqlEdition.includes('enterprise'));

  // Retire: Very low usage or very old systems
  if (cpuUsage < 5 && ramUsage < 10 && server.uptime < 30) {
    return 'Retire';
  }

  // Retain: High resource usage, specific requirements, or mainframe
  if (cpuUsage > 85 || ramUsage > 90 || osName.includes('mainframe')) {
    return 'Retain';
  }

  // Relocate: VMware systems
  if (osName.includes('vmware') || server.vmFunctionality?.toLowerCase().includes('vmware')) {
    return 'Relocate';
  }

  // Refactor: High usage, modern OS, good candidates for modernization
  if ((cpuUsage > 60 || ramUsage > 70) && (osName.includes('linux') || osName.includes('ubuntu') || osName.includes('red hat'))) {
    return 'Refactor';
  }

  // Repurchase: Database servers with Standard edition (good candidates for managed DB)
  if (isRealDatabase && sqlEdition.includes('standard')) {
    return 'Repurchase';
  }

  // Replatform: Database servers with Enterprise edition or moderate CPU usage
  if (isRealDatabase || (cpuUsage > 30 && cpuUsage <= 60)) {
    return 'Replatform';
  }

  // Rehost: Default strategy for most servers (Lift & Shift)
  return 'Rehost';
}

// Classify all servers
const strategyCounts = {
  'Rehost': 0,
  'Replatform': 0,
  'Refactor': 0,
  'Repurchase': 0,
  'Relocate': 0,
  'Retain': 0,
  'Retire': 0
};

const classified = servers.map(server => {
  const strategy = assignMigrationStrategy(server);
  strategyCounts[strategy]++;
  return { ...server, strategy };
});

// Print distribution
console.log('📈 DISTRIBUTION BY STRATEGY (Using EXACT Frontend Logic):\n');
Object.entries(strategyCounts).forEach(([strategy, count]) => {
  const percentage = ((count / servers.length) * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(count / servers.length * 50));
  console.log(`${strategy.padEnd(12)}: ${count.toString().padStart(4)} (${percentage.padStart(5)}%) ${bar}`);
});

// Show sample of each strategy
console.log('\n\n📋 SAMPLES FROM EACH STRATEGY:\n');
Object.keys(strategyCounts).forEach(strategy => {
  const samples = classified.filter(s => s.strategy === strategy).slice(0, 3);
  if (samples.length > 0) {
    console.log(`\n${strategy}:`);
    samples.forEach(s => {
      const sqlDisplay = s.sqlEdition ? `"${s.sqlEdition}"` : 'none';
      console.log(`  ${s.hostname.padEnd(20)} | CPU: ${s.avgCpuUsage.toFixed(1).padStart(5)}% | RAM: ${s.avgRamUsage.toFixed(1).padStart(5)}% | SQL: ${sqlDisplay}`);
    });
  }
});

// Check SQL Edition distribution
console.log('\n\n🔍 SQL EDITION ANALYSIS:\n');
const sqlEditionCounts = {};
servers.forEach(s => {
  const sql = s.sqlEdition || '(empty)';
  sqlEditionCounts[sql] = (sqlEditionCounts[sql] || 0) + 1;
});

Object.entries(sqlEditionCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([value, count]) => {
    const percentage = ((count / servers.length) * 100).toFixed(1);
    console.log(`  ${value.padEnd(40)}: ${count.toString().padStart(4)} (${percentage.padStart(5)}%)`);
  });

// Check how many are classified as "Real Database"
let realDatabaseCount = 0;
servers.forEach(s => {
  const sqlEdition = s.sqlEdition?.toLowerCase() || '';
  const isRealDatabase = sqlEdition &&
    sqlEdition !== 'not applicable' &&
    sqlEdition !== 'n/a' &&
    sqlEdition !== 'none' &&
    (sqlEdition.includes('sql server') ||
     sqlEdition.includes('oracle') ||
     sqlEdition.includes('mysql') ||
     sqlEdition.includes('postgres') ||
     sqlEdition.includes('standard') ||
     sqlEdition.includes('enterprise'));

  if (isRealDatabase) realDatabaseCount++;
});

console.log(`\n\n✅ Real Database Servers Detected: ${realDatabaseCount} of ${servers.length} (${((realDatabaseCount / servers.length) * 100).toFixed(1)}%)`);
console.log(`❌ Filtered out (Not Applicable, etc.): ${servers.length - realDatabaseCount} (${(((servers.length - realDatabaseCount) / servers.length) * 100).toFixed(1)}%)`);
