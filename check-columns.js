const XLSX = require('xlsx');

// Read the Concierto file
const workbook = XLSX.readFile('Concierto MPA Report.xlsx');

console.log('📄 SHEETS IN WORKBOOK:\n');
workbook.SheetNames.forEach((name, idx) => {
  console.log(`  ${idx + 1}. ${name}`);
});

console.log('\n\n📋 INVENTORY MASTER SHEET - COLUMN HEADERS:\n');
const inventorySheet = workbook.Sheets['Inventory Master'];

// Get the first row (headers) - row 1 in the sheet
const range = XLSX.utils.decode_range(inventorySheet['!ref']);
console.log(`Range: ${inventorySheet['!ref']}`);
console.log(`First row: ${range.s.r}, Last row: ${range.e.r}`);
console.log(`First col: ${range.s.c}, Last col: ${range.e.c}\n`);

// Read headers from row 1 (index 1 in 0-based)
const headers = [];
for (let col = range.s.c; col <= range.e.c; col++) {
  const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col }); // Row 1 (0-based)
  const cell = inventorySheet[cellAddress];
  if (cell && cell.v) {
    headers.push({ col: col, name: cell.v });
  }
}

console.log('Column headers (row 2 in Excel, row 1 in 0-based):');
headers.forEach((h, idx) => {
  console.log(`  ${(idx + 1).toString().padStart(3)}. Column ${h.col.toString().padStart(3)} (${XLSX.utils.encode_col(h.col)}): "${h.name}"`);
});

// Get data using correct header row
const data = XLSX.utils.sheet_to_json(inventorySheet, { range: 1 }); // Start from row 1 (0-based)
console.log(`\n\n📊 Total rows of data: ${data.length}\n`);

if (data.length > 0) {
  console.log('First row data sample:');
  const firstRow = data[0];
  Object.keys(firstRow).slice(0, 15).forEach(key => {
    console.log(`  "${key}": "${firstRow[key]}"`);
  });
}
