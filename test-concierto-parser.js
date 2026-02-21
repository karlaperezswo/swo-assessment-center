/**
 * Test script to validate Concierto parser
 * Usage: node test-concierto-parser.js
 */

const XLSX = require('xlsx');
const path = require('path');

// Read the Concierto file
const filePath = path.join(__dirname, 'Concierto MPA Report.xlsx');
console.log('📂 Reading file:', filePath);
console.log('='.repeat(80));

try {
  const workbook = XLSX.readFile(filePath);

  console.log('\n📊 WORKBOOK INFORMATION');
  console.log('='.repeat(80));
  console.log(`Total sheets: ${workbook.SheetNames.length}`);
  console.log(`Sheet names: ${workbook.SheetNames.join(', ')}\n`);

  // Analyze key sheets
  analyzeSheet(workbook, 'Inventory Master', 1);
  analyzeSheet(workbook, 'Databases', 1);
  analyzeSheet(workbook, 'App to IP Mapping', 1);
  analyzeConnectionSheet(workbook, 'Overall Connections - Prod');

  // Summary statistics
  console.log('\n📈 SUMMARY STATISTICS');
  console.log('='.repeat(80));

  const inventoryData = getSheetDataWithHeader(workbook, 'Inventory Master', 1);
  const dbData = getSheetDataWithHeader(workbook, 'Databases', 1);
  const appData = getSheetDataWithHeader(workbook, 'App to IP Mapping', 1);

  console.log(`Total Servers (Inventory): ${inventoryData.length}`);
  console.log(`Servers with SQL Edition: ${inventoryData.filter(r => r['SQL Edition'] && r['SQL Edition'].trim()).length}`);
  console.log(`Database entries: ${dbData.length}`);

  // Count unique applications
  const uniqueApps = new Set();
  appData.forEach(row => {
    if (row['Application Name']) {
      uniqueApps.add(row['Application Name']);
    }
  });
  console.log(`Unique Applications: ${uniqueApps.size}`);
  console.log(`Server-to-App mappings: ${appData.length}`);

  // Count connections by environment
  const environments = ['Prod', 'Dev', 'UAT', 'SIT', 'DR'];
  let totalConnections = 0;

  console.log('\n🔗 CONNECTIONS BY ENVIRONMENT');
  console.log('='.repeat(80));

  environments.forEach(env => {
    const sheetName = workbook.SheetNames.find(s => s.includes(`Overall Connections - ${env}`));
    if (sheetName) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      const validConnections = data.filter(r => r['Source IP Address'] && r['Destination IP Address']);
      console.log(`${env.padEnd(10)}: ${validConnections.length} connections`);
      totalConnections += validConnections.length;
    }
  });

  console.log(`${'Total'.padEnd(10)}: ${totalConnections} connections`);

  // Analyze unique ports
  console.log('\n🔌 TOP 10 MOST USED PORTS');
  console.log('='.repeat(80));

  const portCounts = new Map();
  environments.forEach(env => {
    const sheetName = workbook.SheetNames.find(s => s.includes(`Overall Connections - ${env}`));
    if (sheetName) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      data.forEach(row => {
        if (row['Destination Port']) {
          const port = row['Destination Port'];
          portCounts.set(port, (portCounts.get(port) || 0) + 1);
        }
      });
    }
  });

  const sortedPorts = Array.from(portCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sortedPorts.forEach(([port, count]) => {
    const serviceName = getServiceName(port);
    console.log(`Port ${String(port).padEnd(6)} (${serviceName.padEnd(20)}): ${count} connections`);
  });

  console.log('\n✅ Analysis complete!');
  console.log('='.repeat(80));

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

// Helper functions

function analyzeSheet(workbook, sheetName, headerRow = 0) {
  console.log(`\n📄 Sheet: ${sheetName}`);
  console.log('-'.repeat(80));

  const foundSheet = workbook.SheetNames.find(s => s.includes(sheetName));
  if (!foundSheet) {
    console.log('  ❌ Sheet not found');
    return;
  }

  const data = getSheetDataWithHeader(workbook, foundSheet, headerRow);

  if (data.length === 0) {
    console.log('  ⚠️  No data found');
    return;
  }

  console.log(`  Rows: ${data.length}`);
  console.log(`  Columns: ${Object.keys(data[0]).length}`);
  console.log(`  Column names: ${Object.keys(data[0]).join(', ')}`);

  // Show sample row
  console.log('\n  Sample row:');
  const sampleRow = data[0];
  Object.entries(sampleRow).slice(0, 5).forEach(([key, value]) => {
    console.log(`    ${key}: ${value}`);
  });
}

function analyzeConnectionSheet(workbook, sheetName) {
  console.log(`\n📄 Sheet: ${sheetName}`);
  console.log('-'.repeat(80));

  const foundSheet = workbook.SheetNames.find(s => s.includes(sheetName));
  if (!foundSheet) {
    console.log('  ❌ Sheet not found');
    return;
  }

  const sheet = workbook.Sheets[foundSheet];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`  Total rows: ${data.length}`);

  const validConnections = data.filter(r => r['Source IP Address'] && r['Destination IP Address']);
  console.log(`  Valid connections: ${validConnections.length}`);

  if (validConnections.length > 0) {
    const sample = validConnections[0];
    console.log('\n  Sample connection:');
    console.log(`    Source: ${sample['Source IP Address']} (${sample['Source AppName']})`);
    console.log(`    Destination: ${sample['Destination IP Address']} (${sample['Destination AppName']})`);
    console.log(`    Port: ${sample['Destination Port']}`);
    console.log(`    Protocol: ${sample['Protocol']}`);
    console.log(`    Environment: ${sample['Source Environment']} -> ${sample['Destination Environment']}`);
  }
}

function getSheetDataWithHeader(workbook, sheetName, headerRow) {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length <= headerRow) return [];

  const headers = data[headerRow];
  const rows = data.slice(headerRow + 1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      if (header) {
        obj[header] = row[index] || '';
      }
    });
    return obj;
  });
}

function getServiceName(port) {
  const services = {
    '22': 'SSH',
    '80': 'HTTP',
    '443': 'HTTPS',
    '1433': 'MSSQL',
    '1521': 'Oracle',
    '3306': 'MySQL',
    '3389': 'RDP',
    '5432': 'PostgreSQL',
    '8080': 'HTTP Alt',
    '8443': 'HTTPS Alt',
    '27017': 'MongoDB'
  };
  return services[port.toString()] || 'Unknown';
}
