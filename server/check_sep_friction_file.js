const XLSX = require('xlsx');
const path = require('path');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\DAILY FRICTION\\NEW DAILY FRICTION TRACKING - 2026.xlsx';
const wb = XLSX.readFile(file);

const sepSheet = wb.Sheets['Sep'];
if (sepSheet) {
  const rows = XLSX.utils.sheet_to_json(sepSheet, { header: 1, defval: '' });
  console.log('--- SHEET [Sep] IN NEW DAILY FRICTION TRACKING - 2026.xlsx ---');
  rows.slice(0, 30).forEach((r, i) => {
    if (r.some(c => c !== '')) {
      console.log(`Row ${String(i).padStart(2, ' ')}:`, r.slice(0, 15));
    }
  });
}
