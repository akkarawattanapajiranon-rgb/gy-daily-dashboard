const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\9-1Milling WASTE_Sep 2026 .xlsx';
const wb = XLSX.readFile(file);
const sheet = wb.Sheets['By day'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log('--- ALL ROWS IN [By day] SHEET WITH DAY NUMBERS ---');

rows.forEach((r, i) => {
  const line = r.filter(c => c !== '').join(' | ');
  if (line.includes('Date') || line.includes('Sep') || line.includes('2026') || line.includes('Day') || i < 10) {
    console.log(`Row ${i}:`, r.slice(0, 15));
  }
});
