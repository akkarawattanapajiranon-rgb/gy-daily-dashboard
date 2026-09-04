const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\6. Jun 2026\\6. Jun 2026-Friction Waste Report 2026.xlsx';
const wb = XLSX.readFile(file);
const daySheet = wb.Sheets['1'];
const rows = XLSX.utils.sheet_to_json(daySheet, { header: 1, defval: '' });

rows.forEach((r, i) => {
  const text = r.join(' | ');
  if (text.replace(/\|/g, '').trim().length > 0) {
    console.log(`Row ${String(i).padStart(2, ' ')}: ${text}`);
  }
});
