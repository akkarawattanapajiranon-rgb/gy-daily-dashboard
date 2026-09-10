const XLSX = require('xlsx');
const p = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR\\10 Building loss report-2026\\BUILDING LOSS 2026\\09 SEP 2026 Building lost daily report- update including OT -.xlsx';

const wb = XLSX.readFile(p);

console.log('--- Searching All Day Sheets for Delay Entries in BG(58), BH(59), BI(60) ---');

wb.SheetNames.forEach(sheetName => {
  if (!sheetName.startsWith('(') || !sheetName.endsWith(')')) return;
  const ws = wb.Sheets[sheetName];
  if (!ws) return;

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const entries = [];
  let currentMC = '';

  data.forEach((row, rowIdx) => {
    // Header row is around rowIdx 4 or 5
    if (rowIdx < 5) return;

    const mcVal = String(row[1] || '').trim();
    if (mcVal && mcVal !== 'MC' && mcVal !== 'Total' && mcVal !== 'Daily Building & Lost Report') {
      currentMC = mcVal;
    }

    const bg = String(row[58] || '').trim();
    const bh = String(row[59] || '').trim();
    const bi = String(row[60] || '').trim();
    const bj = String(row[61] || '').trim();
    const bk = String(row[62] || '').trim();

    // Skip summary / footer rows
    if (bg.includes('shift') || bg.includes('Material Delay') || bh.includes('Frequency')) return;

    if (bg || bh || bi || (bj && bj !== '0' && bj !== 'Start ( Hr )')) {
      entries.push({
        rowIdx: rowIdx + 1,
        mc: currentMC,
        shift: row[2] || row[6] || '',
        bg,
        bh,
        bi,
        bj,
        bk
      });
    }
  });

  if (entries.length > 0) {
    console.log(`\nSheet ${sheetName} has ${entries.length} delay entries:`);
    entries.forEach(e => {
      console.log(`  Row ${e.rowIdx} [MC: ${e.mc}]: BG="${e.bg}", BH_Start="${e.bh}", BI_End="${e.bi}", BJ="${e.bj}"`);
    });
  }
});
