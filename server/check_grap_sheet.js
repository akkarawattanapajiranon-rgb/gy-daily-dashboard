const XLSX = require('xlsx');

const f1 = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\6. Jun 2026\\6. Jun 2026-Friction Waste Report 2026.xlsx";
const f2 = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\6. Jun 2026\\6. Jun 2026-Milling Waste Report.xlsx";

console.log('=== FRICTION SHEET "Grap" ===');
const wb1 = XLSX.readFile(f1);
const ws1 = wb1.Sheets['Grap'];
if (ws1) {
  const data1 = XLSX.utils.sheet_to_json(ws1, { header: 1, defval: '' });
  console.log('Rows count:', data1.length);
  data1.slice(0, 35).forEach((r, idx) => console.log(`Row ${idx}:`, r.slice(0, 10)));
}

console.log('\n=== MILLING SHEET "Grap" ===');
const wb2 = XLSX.readFile(f2);
const ws2 = wb2.Sheets['Grap'];
if (ws2) {
  const data2 = XLSX.utils.sheet_to_json(ws2, { header: 1, defval: '' });
  console.log('Rows count:', data2.length);
  data2.slice(0, 35).forEach((r, idx) => console.log(`Row ${idx}:`, r.slice(0, 10)));
}
