const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\9-1Milling WASTE_Sep 2026 .xlsx';
const wb = XLSX.readFile(file);

const mW = wb.Sheets['MillingWaste'];
const rows = XLSX.utils.sheet_to_json(mW, { header: 1, defval: '' });

console.log('--- ALL MILLING WASTE RECORDS FOR DAY 3 (SEP 3) ---');
let day3MillingTotal = 0;
let day3MillingRecords = 0;

rows.forEach((r, i) => {
  if (i < 2) return;
  const day = r[1];
  if (String(day) === '3') {
    const weight = parseFloat(r[5]) || 0;
    const matCode = r[2] || '';
    const remark = r[7] || r[6] || '';
    const mcType = r[10] || '';
    day3MillingTotal += weight;
    day3MillingRecords++;
    console.log(`Record #${day3MillingRecords} (Row ${i}): MC="${mcType}", Mat="${matCode}", Weight=${weight}kg, Remark="${remark}"`);
  }
});

console.log(`\nDay 3 Total Milling Waste: ${day3MillingTotal.toFixed(2)} kg (${day3MillingRecords} records)`);
