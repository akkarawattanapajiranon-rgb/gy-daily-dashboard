const XLSX = require('xlsx');
const path = require('path');

const dir = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\6. Jun 2026';
const fFile = path.join(dir, '6. Jun 2026-Friction Waste Report 2026.xlsx');
const mFile = path.join(dir, '6. Jun 2026-Milling Waste Report.xlsx');

console.log('--- FRICTION FILE (JUNE) ---');
const wbF = XLSX.readFile(fFile);
const sF3 = wbF.Sheets['3'];
if (sF3) {
  const rows = XLSX.utils.sheet_to_json(sF3, { header: 1, defval: '' });
  rows.slice(0, 15).forEach((r, i) => console.log(`Row ${i}:`, r.slice(0, 10)));
}

console.log('--- MILLING FILE (JUNE) ---');
const wbM = XLSX.readFile(mFile);
const sM3 = wbM.Sheets['3'];
if (sM3) {
  const rows = XLSX.utils.sheet_to_json(sM3, { header: 1, defval: '' });
  rows.slice(0, 15).forEach((r, i) => console.log(`Row ${i}:`, r.slice(0, 10)));
}
