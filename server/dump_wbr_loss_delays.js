const XLSX = require('xlsx');
const p = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR\\10 Building loss report-2026\\BUILDING LOSS 2026\\09 SEP 2026 Building lost daily report- update including OT -.xlsx';

const wb = XLSX.readFile(p);

wb.SheetNames.forEach(sheetName => {
  if (!sheetName.startsWith('(') || !sheetName.endsWith(')')) return;
  const ws = wb.Sheets[sheetName];
  if (!ws) return;

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const foundRows = [];
  let currentMC = '';

  data.forEach((row, rowIdx) => {
    // Check Col B (idx 1) for Machine name e.g. V1, V2, V3, A3, Steelastic, etc.
    const mcVal = String(row[1] || '').trim();
    if (mcVal && mcVal !== 'MC' && mcVal !== 'Total' && mcVal !== 'Daily Building & Lost Report') {
      currentMC = mcVal;
    }

    // Check Col C (idx 2) or Col G (idx 6) or similar for Shift e.g. S1, S2, S3, 1, 2, 3
    const shiftVal = String(row[2] || row[6] || '').trim();

    // Check Col BG (58) for Material Delay text / Description
    const bgVal = String(row[58] || '').trim();
    // Check Col BH (59) for Start Time
    const bhVal = String(row[59] || '').trim();
    // Check Col BI (60) for End Time
    const biVal = String(row[60] || '').trim();
    // Check Col BJ (61) / BK (62) for Delay Minutes or calculation if any
    const bjVal = String(row[61] || '').trim();
    const bkVal = String(row[62] || '').trim();

    // Also check other columns if there are delay minutes or code names
    if (bgVal || bhVal || biVal) {
      foundRows.push({
        rowIdx: rowIdx + 1,
        mc: currentMC,
        shift: shiftVal,
        colBG_detail: bgVal,
        colBH_start: bhVal,
        colBI_end: biVal,
        colBJ: bjVal,
        colBK: bkVal,
        fullRowSample: row.slice(0, 10).concat(row.slice(55, 65))
      });
    }
  });

  if (foundRows.length > 0) {
    console.log(`\nSheet ${sheetName} found ${foundRows.length} non-empty delay rows:`);
    foundRows.forEach(r => {
      console.log(`  Row ${r.rowIdx} [${r.mc}][${r.shift}]: BG("${r.colBG_detail}"), BH_Start("${r.colBH_start}"), BI_End("${r.colBI_end}"), BJ("${r.colBJ}"), BK("${r.colBK}")`);
    });
  }
});
