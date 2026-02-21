const XLSX = require('xlsx');

// Read the Concierto file
const workbook = XLSX.readFile('Concierto MPA Report.xlsx');
const inventorySheet = workbook.Sheets['Inventory Master'];

// Read as array of arrays to see raw structure
const rawData = XLSX.utils.sheet_to_json(inventorySheet, { header: 1 });

console.log('📋 FIRST 5 ROWS OF INVENTORY MASTER (Raw Array Format):\n');

for (let i = 0; i < Math.min(5, rawData.length); i++) {
  console.log(`\nROW ${i} (Excel row ${i + 1}):`);
  const row = rawData[i];
  if (Array.isArray(row)) {
    row.forEach((cell, colIdx) => {
      if (cell !== undefined && cell !== null && cell !== '') {
        const colLetter = XLSX.utils.encode_col(colIdx);
        console.log(`  ${colLetter}${i + 1}: "${cell}"`);
      }
    });
  }
}

// Now try parsing with different header rows
console.log('\n\n' + '='.repeat(80));
console.log('TESTING DIFFERENT HEADER ROW INDICES:\n');

for (let headerIdx = 0; headerIdx <= 3; headerIdx++) {
  console.log(`\n--- Using headerRow = ${headerIdx} (Excel row ${headerIdx + 1}) ---`);

  if (rawData.length <= headerIdx) {
    console.log('  ⚠️ Not enough rows');
    continue;
  }

  const headers = rawData[headerIdx];
  console.log(`  Headers (${headers.filter(h => h).length} non-empty):`);
  headers.slice(0, 15).forEach((h, idx) => {
    if (h) console.log(`    ${XLSX.utils.encode_col(idx)}: "${h}"`);
  });

  // Get first data row
  if (rawData.length > headerIdx + 1) {
    const firstDataRow = rawData[headerIdx + 1];
    console.log(`  First data row sample:`);
    firstDataRow.slice(0, 5).forEach((val, idx) => {
      if (val) console.log(`    ${XLSX.utils.encode_col(idx)}: "${val}"`);
    });
  }
}
