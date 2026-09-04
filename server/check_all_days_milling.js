const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\9-1Milling WASTE_Sep 2026 .xlsx';
const wb = XLSX.readFile(file);

const mW = wb.Sheets['MillingWaste'];
const rows = XLSX.utils.sheet_to_json(mW, { header: 1, defval: '' });

const daySums = {};

rows.forEach((r, i) => {
  if (i < 2) return;
  const day = r[1];
  const weight = parseFloat(r[5]) || 0;
  if (day !== undefined && day !== '') {
    daySums[day] = (daySums[day] || 0) + weight;
  }
});

console.log('--- DAYS PRESENT IN MillingWaste SHEET ---');
console.log(daySums);
