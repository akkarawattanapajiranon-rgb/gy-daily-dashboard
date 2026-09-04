const XLSX = require('xlsx');
const path = require('path');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\9-1Milling WASTE_Sep 2026 .xlsx';
const wb = XLSX.readFile(file);

console.log('--- SHEET: By day ---');
const byDay = wb.Sheets['By day'];
if (byDay) {
  const rows = XLSX.utils.sheet_to_json(byDay, { header: 1, defval: '' });
  rows.forEach((r, i) => {
    if (r.some(c => c !== '')) {
      console.log(`Row ${String(i).padStart(2, ' ')}:`, r.slice(0, 15));
    }
  });
}

console.log('\n--- SHEET: MillingWaste ---');
const mW = wb.Sheets['MillingWaste'] || wb.Sheets['MillingWaste(M)'];
if (mW) {
  const rows = XLSX.utils.sheet_to_json(mW, { header: 1, defval: '' });
  rows.slice(0, 20).forEach((r, i) => {
    if (r.some(c => c !== '')) {
      console.log(`Row ${String(i).padStart(2, ' ')}:`, r.slice(0, 15));
    }
  });
}
