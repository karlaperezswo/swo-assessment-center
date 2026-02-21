// Test if the format detector is working correctly
const XLSX = require('xlsx');
const fs = require('fs');

// Read the Concierto file
const buffer = fs.readFileSync('Concierto MPA Report.xlsx');
const workbook = XLSX.read(buffer, { type: 'buffer' });

console.log('📋 WORKBOOK INFO:\n');
console.log(`Sheet names: ${workbook.SheetNames.join(', ')}\n`);

// Simulate FormatDetector logic
function detectFormat(workbook) {
  const sheetNames = workbook.SheetNames.map(s => s.toLowerCase());

  console.log('🔍 FORMAT DETECTION:\n');

  // Check for AWS MPA format
  const awsSheets = ['hosts', 'databases', 'storage volumes'];
  const hasAWSSheets = awsSheets.every(sheet =>
    sheetNames.some(s => s.includes(sheet))
  );
  console.log(`AWS MPA format: ${hasAWSSheets ? '✅ YES' : '❌ NO'}`);
  console.log(`  Looking for: ${awsSheets.join(', ')}`);

  // Check for Concierto format
  const conciertoSheets = ['inventory master', 'app dashboard', 'overall connections'];
  const hasConciertoSheets = conciertoSheets.some(sheet =>
    sheetNames.some(s => s.includes(sheet))
  );
  console.log(`Concierto format: ${hasConciertoSheets ? '✅ YES' : '❌ NO'}`);
  console.log(`  Looking for: ${conciertoSheets.join(', ')}`);
  console.log(`  Found:`);
  conciertoSheets.forEach(sheet => {
    const found = sheetNames.filter(s => s.includes(sheet));
    if (found.length > 0) {
      console.log(`    - "${sheet}": ${found.join(', ')}`);
    }
  });

  if (hasConciertoSheets) {
    return 'CONCIERTO';
  } else if (hasAWSSheets) {
    return 'AWS_MPA';
  } else {
    return 'UNKNOWN';
  }
}

const detectedFormat = detectFormat(workbook);
console.log(`\n🎯 DETECTED FORMAT: ${detectedFormat}\n`);

// Now test if ConciertoParser.canParse() would work
console.log('═'.repeat(80));
console.log('\n🧪 TESTING ConciertoParser.canParse() logic:\n');

const sheetNames = workbook.SheetNames.map(s => s.toLowerCase());
const conciertoSheets = [
  'inventory master',
  'app dashboard',
  'overall connections'
];

const canParse = conciertoSheets.some(sheet =>
  sheetNames.some(s => s.includes(sheet))
);

console.log(`ConciertoParser.canParse() = ${canParse ? '✅ TRUE' : '❌ FALSE'}\n`);

if (canParse) {
  console.log('✅ Format should be detected correctly!\n');

  // Test parseServers logic
  console.log('═'.repeat(80));
  console.log('\n🧪 TESTING parseServers() logic:\n');

  // Find sheet
  const inventorySheetName = workbook.SheetNames.find(name =>
    name.toLowerCase() === 'inventory master' ||
    name.toLowerCase().includes('inventory master')
  );

  console.log(`Looking for "Inventory Master" sheet...`);
  console.log(`  Found: ${inventorySheetName ? `"${inventorySheetName}" ✅` : 'NOT FOUND ❌'}\n`);

  if (inventorySheetName) {
    const sheet = workbook.Sheets[inventorySheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`Sheet has ${rawData.length} rows\n`);

    // Test with headerRow = 1
    console.log('Testing with headerRow = 1:');
    if (rawData.length > 1) {
      const headers = rawData[1];
      const dataRows = rawData.slice(2);
      console.log(`  Headers (row 1): ${headers.filter(h => h).length} columns`);
      console.log(`  Data rows: ${dataRows.length}`);

      // Check for Host Name column
      const hasHostName = headers.some(h =>
        h && (h === 'Host Name ' || h === 'Host Name')
      );
      console.log(`  Has "Host Name" column: ${hasHostName ? '✅ YES' : '❌ NO'}`);

      if (hasHostName) {
        // Convert to objects
        const servers = dataRows
          .map(row => {
            const obj = {};
            headers.forEach((header, index) => {
              if (header) obj[header] = row[index];
            });
            return obj;
          })
          .filter(row => row['Host Name '] || row['Host Name']);

        console.log(`  Servers after filtering: ${servers.length}\n`);

        if (servers.length === 0) {
          console.log('  ❌ NO SERVERS PARSED! Checking why...');
          console.log(`     First data row:`, dataRows[0] ? dataRows[0].slice(0, 5) : 'undefined');
        } else {
          console.log('  ✅ Servers parsed successfully!');
          console.log(`     Sample hostname: "${servers[0]['Host Name '] || servers[0]['Host Name']}"`);
        }
      }
    }
  }
} else {
  console.log('❌ Format would NOT be detected! Check FormatDetector logic.\n');
}
