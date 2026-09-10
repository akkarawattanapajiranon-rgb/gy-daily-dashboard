const XLSX = require('xlsx');
const p = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR\\10 Building loss report-2026\\BUILDING LOSS 2026\\09 SEP 2026 Building lost daily report- update including OT -.xlsx';

const wb = XLSX.readFile(p);
const ws = wb.Sheets['(3)'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('=== Inspecting All Headers (Rows 3, 4, 5) ===');

for (let colIdx = 0; colIdx < 70; colIdx++) {
  const colLetter = XLSX.utils.encode_col(colIdx);
  const h3 = String(data[3]?.[colIdx] || '').replace(/\r?\n/g, ' ').trim();
  const h4 = String(data[4]?.[colIdx] || '').replace(/\r?\n/g, ' ').trim();
  const h5 = String(data[5]?.[colIdx] || '').replace(/\r?\n/g, ' ').trim();

  if (h3 || h4 || h5) {
    console.log(`Col ${colLetter} (${colIdx}): H3="${h3}" | H4="${h4}" | H5="${h5}"`);
  }
}
