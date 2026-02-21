const XLSX = require('xlsx');

// Read the Concierto file
const workbook = XLSX.readFile('Concierto MPA Report.xlsx');
const inventorySheet = workbook.Sheets['Inventory Master'];
const data = XLSX.utils.sheet_to_json(inventorySheet);

console.log(`\n📊 Total Servers: ${data.length}\n`);

// Migration strategy assignment logic (same as frontend)
function assignMigrationStrategy(server) {
  const cpuUsage = parseFloat(server['CPU Avg (%)']) || 0;
  const ramUsage = parseFloat(server['Memory Avg (%)']) || 0;
  const osName = (server['OS'] || '').toLowerCase();
  const sqlEdition = (server['SQL Edition'] || '').toLowerCase();

  // Helper to check if it's a real database server
  const isRealDatabase = sqlEdition &&
    sqlEdition !== 'not applicable' &&
    sqlEdition !== 'n/a' &&
    sqlEdition !== 'none' &&
    sqlEdition !== '' &&
    (sqlEdition.includes('sql server') ||
     sqlEdition.includes('oracle') ||
     sqlEdition.includes('mysql') ||
     sqlEdition.includes('postgres') ||
     sqlEdition.includes('standard') ||
     sqlEdition.includes('enterprise'));

  // Retire: Very low usage or very old systems
  if (cpuUsage < 5 && ramUsage < 10) {
    return 'Retire';
  }

  // Retain: High resource usage
  if (cpuUsage > 85 || ramUsage > 90) {
    return 'Retain';
  }

  // Relocate: VMware systems
  if (osName.includes('vmware')) {
    return 'Relocate';
  }

  // Refactor: High usage, modern OS
  if ((cpuUsage > 60 || ramUsage > 70) && (osName.includes('linux') || osName.includes('ubuntu') || osName.includes('red hat'))) {
    return 'Refactor';
  }

  // Repurchase: Database servers with Standard edition
  if (isRealDatabase && sqlEdition.includes('standard')) {
    return 'Repurchase';
  }

  // Replatform: Database servers with Enterprise edition or moderate CPU usage
  if (isRealDatabase || (cpuUsage > 30 && cpuUsage <= 60)) {
    return 'Replatform';
  }

  // Rehost: Default strategy
  return 'Rehost';
}

// Count by strategy
const strategyCounts = {
  'Rehost': 0,
  'Replatform': 0,
  'Refactor': 0,
  'Repurchase': 0,
  'Relocate': 0,
  'Retain': 0,
  'Retire': 0
};

// Classify all servers
const classified = data.map((server, idx) => {
  const strategy = assignMigrationStrategy(server);
  strategyCounts[strategy]++;

  return {
    index: idx + 1,
    hostname: server['Hostname'],
    os: server['OS'],
    sqlEdition: server['SQL Edition'],
    cpuUsage: parseFloat(server['CPU Avg (%)']) || 0,
    ramUsage: parseFloat(server['Memory Avg (%)']) || 0,
    strategy
  };
});

// Print distribution
console.log('📈 DISTRIBUTION BY STRATEGY:\n');
Object.entries(strategyCounts).forEach(([strategy, count]) => {
  const percentage = ((count / data.length) * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(count / data.length * 50));
  console.log(`${strategy.padEnd(12)}: ${count.toString().padStart(4)} (${percentage.padStart(5)}%) ${bar}`);
});

// Show first 20 servers with details
console.log('\n\n📋 FIRST 20 SERVERS - DETAILED CLASSIFICATION:\n');
console.log('Idx  Strategy     CPU%  RAM%  SQL Edition              Hostname');
console.log('─'.repeat(100));

classified.slice(0, 20).forEach(server => {
  const sqlDisplay = (server.sqlEdition || 'none').substring(0, 24).padEnd(24);
  const hostnameDisplay = (server.hostname || 'unknown').substring(0, 30);
  console.log(
    `${server.index.toString().padStart(3)}  ` +
    `${server.strategy.padEnd(12)} ` +
    `${server.cpuUsage.toFixed(1).padStart(5)} ` +
    `${server.ramUsage.toFixed(1).padStart(5)} ` +
    `${sqlDisplay} ${hostnameDisplay}`
  );
});

// Show servers classified as Replatform (first 30)
const replatformServers = classified.filter(s => s.strategy === 'Replatform');
console.log(`\n\n🔍 SERVERS CLASSIFIED AS REPLATFORM (showing first 30 of ${replatformServers.length}):\n`);
console.log('Idx  CPU%  RAM%  SQL Edition              Why Replatform?');
console.log('─'.repeat(100));

replatformServers.slice(0, 30).forEach(server => {
  const sqlEdition = (server.sqlEdition || '').toLowerCase();
  const isRealDB = sqlEdition &&
    sqlEdition !== 'not applicable' &&
    sqlEdition !== 'n/a' &&
    sqlEdition !== 'none' &&
    sqlEdition !== '' &&
    (sqlEdition.includes('sql server') ||
     sqlEdition.includes('oracle') ||
     sqlEdition.includes('mysql') ||
     sqlEdition.includes('postgres') ||
     sqlEdition.includes('standard') ||
     sqlEdition.includes('enterprise'));

  const moderateCPU = server.cpuUsage > 30 && server.cpuUsage <= 60;

  let reason = '';
  if (isRealDB) reason += '✓ Real Database | ';
  if (moderateCPU) reason += `✓ Moderate CPU (${server.cpuUsage.toFixed(1)}%)`;
  if (!isRealDB && !moderateCPU) reason = '⚠️ Neither condition met!';

  const sqlDisplay = (server.sqlEdition || 'none').substring(0, 24).padEnd(24);
  console.log(
    `${server.index.toString().padStart(3)}  ` +
    `${server.cpuUsage.toFixed(1).padStart(5)} ` +
    `${server.ramUsage.toFixed(1).padStart(5)} ` +
    `${sqlDisplay} ${reason}`
  );
});

// Show SQL Edition value distribution
console.log('\n\n📊 SQL EDITION VALUE DISTRIBUTION:\n');
const sqlEditionCounts = {};
data.forEach(server => {
  const sqlEdition = server['SQL Edition'] || 'empty';
  sqlEditionCounts[sqlEdition] = (sqlEditionCounts[sqlEdition] || 0) + 1;
});

Object.entries(sqlEditionCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([value, count]) => {
    const percentage = ((count / data.length) * 100).toFixed(1);
    console.log(`  ${value.padEnd(30)}: ${count.toString().padStart(4)} (${percentage.padStart(5)}%)`);
  });
