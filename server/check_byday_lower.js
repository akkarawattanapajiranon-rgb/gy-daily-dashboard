const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\9-1Milling WASTE_Sep 2026 .xlsx';
const wb = XLSX.readFile(file);
const sheet = wb.Sheets['By day'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log('--- BY DAY SHEET ROWS 105 TO 140 ---');
for (let i = 104; i < Math.min(140, rows.length); i++) {
  const line = rows[i].filter(c => c !== '').join(' | ');
  if (line) {
    console.log(`Row ${String(i).padStart(3, ' ')}:`, rows[i].slice(0, 15));
  }
}
