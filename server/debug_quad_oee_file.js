const XLSX = require('xlsx');

const oeeFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\OEE 2 Sep,2026.xlsx";
const wb = XLSX.readFile(oeeFile);

console.log('Sheet Names:', wb.SheetNames);

const ws = wb.Sheets['ALL OEE ( Sep, 26) QUAD '];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('Total Rows:', data.length);
data.slice(0, 10).forEach((r, idx) => {
  console.log(`\nRow ${idx}:`);
  r.forEach((cell, cIdx) => {
    if (cell !== '') console.log(`  Col ${cIdx}: "${cell}"`);
  });
});
