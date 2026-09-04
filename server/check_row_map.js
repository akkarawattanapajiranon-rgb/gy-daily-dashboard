const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\4. APRIL 2026\\4. Apr 2026-Friction Waste Report 2026.xlsx';
const wb = XLSX.readFile(file, { cellFormulas: true });
const sheet = wb.Sheets['1'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

rows.forEach((r, idx) => {
  const dept = r[0] || '';
  const desc = r[3] || '';
  const defect = r[5] || '';
  const code = r[4] || r[6] || '';
  console.log(`Row ${String(idx).padStart(2, ' ')}: Dept="${dept}" | Desc="${desc}" | Code="${code}" | Defect="${defect}"`);
});
