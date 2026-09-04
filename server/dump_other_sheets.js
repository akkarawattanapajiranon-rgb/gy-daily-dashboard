const XLSX = require('xlsx');

const oeeFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\OEE 2 Sep,2026.xlsx";
const wb = XLSX.readFile(oeeFile);

['ALL OEE (SEP) QUAD', 'Sep (Up date 2)', 'Sep1'].forEach(sheetName => {
  console.log(`\n================ SHEET: "${sheetName}" ================`);
  const ws = wb.Sheets[sheetName];
  if (!ws) return;
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('Total Rows:', data.length);
  data.slice(0, 8).forEach((r, idx) => {
    console.log(`Row ${idx}:`, r.slice(0, 15).filter(c => c !== ''));
  });
});
