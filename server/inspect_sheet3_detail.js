const XLSX = require('xlsx');
const p = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR\\10 Building loss report-2026\\BUILDING LOSS 2026\\09 SEP 2026 Building lost daily report- update including OT -.xlsx';

const wb = XLSX.readFile(p);
const ws = wb.Sheets['(3)'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('--- Inspecting Sheet (3) Non-Empty Rows in Col BG..BJ ---');
data.forEach((r, idx) => {
  const bg = String(r[58] || '').trim();
  const bh = String(r[59] || '').trim();
  const bi = String(r[60] || '').trim();
  const bj = String(r[61] || '').trim();
  const bk = String(r[62] || '').trim();

  // If any cell in row has content around BG
  if (bg || bh || bi || bj || bk) {
    console.log(`Row ${idx + 1} (Col A: "${r[0]}", Col B: "${r[1]}", Col C: "${r[2]}"):`);
    console.log(`   BG(58): "${bg}" | BH(59): "${bh}" | BI(60): "${bi}" | BJ(61): "${bj}" | BK(62): "${bk}"`);
  }
});
