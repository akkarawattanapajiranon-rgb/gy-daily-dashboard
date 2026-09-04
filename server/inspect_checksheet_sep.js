const XLSX = require('xlsx');

const fileCheck = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\2026\\09. Fischer check sheet - SEP 2026.xlsx';
const wbCheck = XLSX.readFile(fileCheck);
const ws = wbCheck.Sheets['SEP 2026'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('=== SEP 2026 Headers (Rows 0-5) ===');
data.slice(0, 6).forEach((row, i) => {
  console.log(`Row ${i}:`, JSON.stringify(row));
});

console.log('\n=== Sample Data Rows (Rows 5-25) ===');
data.slice(5, 25).forEach((row, i) => {
  if (row.some(c => c !== '')) {
    console.log(`Row ${i+5}: Date=${row[0]}, Shift=${row[1]}, Op=${row[2]}, Lot=${row[3]}, Code=${row[5]}, SAP=${row[6]}, TireCode=${row[7]}, SpeedMode=${row[11]}, Width=${row[14]}`);
  }
});
