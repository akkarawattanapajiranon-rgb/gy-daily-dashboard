const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\6. Jun 2026\\6. Jun 2026-Friction Waste Report 2026.xlsx';
const wb = XLSX.readFile(file);
const daySheet = wb.Sheets['3']; // check day 3
const rows = XLSX.utils.sheet_to_json(daySheet, { header: 1, defval: '' });

console.log('--- DAY 3 ROWS 65 to 90 ---');
for (let i = 65; i < Math.min(95, rows.length); i++) {
  console.log(`Row ${i}:`, rows[i].slice(0, 10));
}
