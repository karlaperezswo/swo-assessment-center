// Test the backend parser to see what it's actually parsing
const XLSX = require('xlsx');
const path = require('path');

// Simulate the BaseParser getSheetDataWithHeader method
function getSheetDataWithHeader(sheet, headerRow) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length <= headerRow) return [];

  const headers = data[headerRow];
  const rows = data.slice(headerRow + 1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      if (header) {
        obj[header] = row[index];
      }
    });
    return obj;
  });
}

// Read the Concierto file
const workbook = XLSX.readFile('Concierto MPA Report.xlsx');

console.log('🔍 TESTING BACKEND PARSER LOGIC\n');
console.log('═'.repeat(80));

// Test parseServers()
console.log('\n📊 PARSE SERVERS (Inventory Master):\n');
const inventorySheet = workbook.Sheets['Inventory Master'];
const serverData = getSheetDataWithHeader(inventorySheet, 1);

const servers = serverData
  .filter(row => row['Host Name '] || row['Host Name']) // Filter out empty rows
  .map((row) => {
    const hostname = (row['Host Name '] || row['Host Name'] || '').toString().trim();
    const ipAddress = (row['IP Address'] || '').toString().trim();
    return {
      hostname,
      ipAddress,
      osName: (row['Operating System'] || '').toString().trim(),
      totalRAM: parseFloat(row['Memory (MB)']) / 1024 || 0,
      avgCpuUsage: parseFloat(row['Cpu Utilization Avg (%)']) || 0,
      totalDiskSize: parseFloat(row['Provisioned Storage (GB)']) || 0,
      sqlEdition: (row['SQL Edition'] || '').toString().trim()
    };
  });

console.log(`✅ Total servers parsed: ${servers.length}`);
console.log(`   Total RAM (GB): ${servers.reduce((sum, s) => sum + s.totalRAM, 0).toFixed(2)}`);
console.log(`   Total Storage (GB): ${servers.reduce((sum, s) => sum + s.totalDiskSize, 0).toFixed(2)}`);

// Test parseDatabases() - CURRENT BUGGY LOGIC
console.log('\n\n📊 PARSE DATABASES (CURRENT BUGGY LOGIC):\n');
const dbServersOLD = serverData.filter(row =>
  row['SQL Edition'] && row['SQL Edition'].toString().trim()
);

console.log(`❌ Databases detected (OLD logic): ${dbServersOLD.length}`);
console.log(`   This includes "Not Applicable" values!`);

// Show SQL Edition distribution in "databases"
const sqlEditionCounts = {};
dbServersOLD.forEach(row => {
  const sql = (row['SQL Edition'] || '').toString().trim();
  sqlEditionCounts[sql] = (sqlEditionCounts[sql] || 0) + 1;
});

console.log('\n   SQL Edition distribution:');
Object.entries(sqlEditionCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .forEach(([value, count]) => {
    console.log(`     "${value}": ${count}`);
  });

// Test parseDatabases() - FIXED LOGIC
console.log('\n\n📊 PARSE DATABASES (FIXED LOGIC):\n');
const dbServersNEW = serverData.filter(row => {
  const sqlEdition = (row['SQL Edition'] || '').toString().toLowerCase().trim();
  return sqlEdition &&
    sqlEdition !== 'not applicable' &&
    sqlEdition !== 'n/a' &&
    sqlEdition !== 'none' &&
    sqlEdition !== '' &&
    (sqlEdition.includes('sql server') ||
     sqlEdition.includes('oracle') ||
     sqlEdition.includes('mysql') ||
     sqlEdition.includes('postgres') ||
     sqlEdition.includes('db2') ||
     sqlEdition.includes('mariadb'));
});

console.log(`✅ Databases detected (NEW logic): ${dbServersNEW.length}`);
console.log(`   Correctly filters out "Not Applicable"`);

// Show comparison
console.log('\n\n📈 COMPARISON:\n');
console.log('═'.repeat(80));
console.log(`Total servers in file:        ${servers.length}`);
console.log(`Databases (OLD buggy logic):  ${dbServersOLD.length}  ❌ WRONG`);
console.log(`Databases (NEW fixed logic):  ${dbServersNEW.length}  ✅ CORRECT`);
console.log(`Regular servers:              ${servers.length - dbServersNEW.length}`);
console.log('═'.repeat(80));

// Test if there's a separate Databases sheet
console.log('\n\n📋 CHECKING SEPARATE DATABASE SHEET:\n');
const dbSheet = workbook.Sheets['Databases'];
if (dbSheet) {
  const dbSheetData = getSheetDataWithHeader(dbSheet, 1);
  console.log(`✅ Found "Databases" sheet with ${dbSheetData.length} rows`);
  if (dbSheetData.length > 0) {
    console.log('   First row columns:', Object.keys(dbSheetData[0]).slice(0, 10));
    console.log('   First row sample:', dbSheetData[0]);
  }
} else {
  console.log('❌ No separate "Databases" sheet found');
}

// Calculate what the dashboard SHOULD show
console.log('\n\n🎯 WHAT DASHBOARD SHOULD SHOW:\n');
console.log('═'.repeat(80));
console.log(`Servers:           ${servers.length}`);
console.log(`Databases:         ${dbServersNEW.length}`);
console.log(`Total Storage:     ${servers.reduce((sum, s) => sum + s.totalDiskSize, 0).toFixed(2)} GB`);
console.log(`Applications:      (need to check App to IP Mapping sheet)`);
console.log('═'.repeat(80));

// Check what YOU are seeing
console.log('\n\n⚠️  WHAT YOU ARE SEEING:\n');
console.log('═'.repeat(80));
console.log(`Servers:           0          ❌`);
console.log(`Databases:         261        ❌`);
console.log(`Total Storage:     0 GB       ❌`);
console.log('═'.repeat(80));

console.log('\n\n💡 DIAGNOSIS:\n');
if (dbServersOLD.length === 261) {
  console.log('✅ The 261 databases matches the OLD buggy logic count!');
  console.log('   This confirms the backend parser has the bug.');
} else {
  console.log(`⚠️  261 doesn't match ${dbServersOLD.length} - investigating further...`);

  // Maybe it's combining both sheets?
  if (dbSheet) {
    const dbSheetData = getSheetDataWithHeader(dbSheet, 1);
    const combined = dbServersOLD.length + dbSheetData.length;
    console.log(`   Inventory Master "databases": ${dbServersOLD.length}`);
    console.log(`   Separate Database sheet: ${dbSheetData.length}`);
    console.log(`   Combined: ${combined}`);

    if (combined === 261) {
      console.log('   ✅ This matches! It\'s combining both sources.');
    }
  }
}

if (servers.length > 0 && serverData.length === 0) {
  console.log('❌ parseServers() returned empty array - header row issue!');
} else if (servers.length === 0) {
  console.log('❌ No servers parsed - major parsing issue!');
}
