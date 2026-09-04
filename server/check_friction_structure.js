const XLSX = require('xlsx');
const path = require('path');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\6. Jun 2026\\6. Jun 2026-Friction Waste Report 2026.xlsx';
const wb = XLSX.readFile(file);

console.log('Sheet names:', wb.SheetNames);

const grapSheet = wb.Sheets['Grap'];
if (grapSheet) {
  const grapData = XLSX.utils.sheet_to_json(grapSheet, { header: 1, defval: '' });
  console.log('Grap data first 10 rows:');
  grapData.slice(0, 10).forEach((row, i) => console.log(`Row ${i}:`, row.slice(0, 10)));
}

// Check Daily Sheet '3' or '1'
const daySheet = wb.Sheets['3'] || wb.Sheets['1'];
if (daySheet) {
  const rows = XLSX.utils.sheet_to_json(daySheet, { header: 1, defval: '' });
  console.log('\nDaily Sheet rows first 20:');
  rows.slice(0, 25).forEach((r, i) => {
    if (r.some(cell => cell !== '')) {
      console.log(`Row ${i}:`, r.slice(0, 12));
    }
  });
}
