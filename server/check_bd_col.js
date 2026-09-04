const XLSX = require('xlsx');

const oeeFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\OEE 2 Sep,2026.xlsx";
const wb = XLSX.readFile(oeeFile);

const ws = wb.Sheets['ALL OEE ( Sep, 26) QUAD '];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

data.slice(0, 5).forEach((r, idx) => {
  console.log(`Row ${idx}: r[16]="${r[16]}", r[22]="${r[22]}", r[26]="${r[26]}"`);
});
