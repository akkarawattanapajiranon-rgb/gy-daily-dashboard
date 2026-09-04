const XLSX = require('xlsx');

const filePath = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown\\Issue log 2026 _ BCA 14AUG2026.xlsx';
const wb = XLSX.readFile(filePath);

// 1. Inspect SEP2026 headers and structure
console.log('=== SEP2026 ===');
const wsSep = wb.Sheets['SEP2026'];
const dataSep = XLSX.utils.sheet_to_json(wsSep, { header: 1, defval: '' });
dataSep.slice(0, 40).forEach((row, i) => {
  if (row.some(c => c !== '')) {
    console.log(`Row ${i}:`, JSON.stringify(row.slice(0, 15)));
  }
});

// 2. Inspect Daliy seen Sep2 headers and sample rows
console.log('\n=== Daliy seen Sep2 ===');
const wsDaily = wb.Sheets['Daliy seen Sep2'];
const dataDaily = XLSX.utils.sheet_to_json(wsDaily, { header: 1, defval: '' });
dataDaily.slice(0, 20).forEach((row, i) => {
  if (row.some(c => c !== '')) {
    console.log(`Row ${i}:`, JSON.stringify(row.slice(0, 20)));
  }
});
