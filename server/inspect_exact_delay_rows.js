const XLSX = require('xlsx');
const p = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR\\10 Building loss report-2026\\BUILDING LOSS 2026\\09 SEP 2026 Building lost daily report- update including OT -.xlsx';

const wb = XLSX.readFile(p);

function inspectRow(sheetName, rowIdx) {
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const r = data[rowIdx - 1];

  console.log(`=== Sheet ${sheetName} Row ${rowIdx} ===`);
  console.log(`Col B (MC): "${r[1]}", Col C (Shift): "${r[2]}", Col E (Code): "${r[4]}"`);
  for (let c = 58; c <= 68; c++) {
    const letter = XLSX.utils.encode_col(c);
    console.log(`  Col ${letter} (${c}): "${r[c]}"`);
  }
}

inspectRow('(2)', 79);
inspectRow('(7)', 103);
