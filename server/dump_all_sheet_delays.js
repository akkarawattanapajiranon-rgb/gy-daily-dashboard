const XLSX = require('xlsx');
const p = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR\\10 Building loss report-2026\\BUILDING LOSS 2026\\09 SEP 2026 Building lost daily report- update including OT -.xlsx';

const wb = XLSX.readFile(p);

console.log('=== Inspecting All Non-Empty Delay Rows Across All Day Sheets ===');

wb.SheetNames.forEach(sheetName => {
  if (!sheetName.startsWith('(') || !sheetName.endsWith(')')) return;
  const ws = wb.Sheets[sheetName];
  if (!ws) return;

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  let currentMC = '';

  data.forEach((row, rowIdx) => {
    if (rowIdx < 5 || rowIdx > 125) return;

    const mcVal = String(row[1] || '').trim();
    if (mcVal && mcVal !== 'MC' && mcVal !== 'Total') {
      currentMC = mcVal;
    }

    const bg = String(row[58] || '').trim(); // Material Delay detail
    const bh = String(row[59] || '').trim(); // Start time
    const bi = String(row[60] || '').trim(); // End time
    const bj = String(row[61] || '').trim(); // Minutes or Calculation

    if (bg || bh || bi || (bj && bj !== '0')) {
      console.log(`[Sheet ${sheetName}][Row ${rowIdx + 1}][MC: ${currentMC}] Col C(Shift): "${row[2]}", BG(Detail): "${bg}", BH(Start): "${bh}", BI(End): "${bi}", BJ(Min): "${bj}"`);
    }
  });
});
