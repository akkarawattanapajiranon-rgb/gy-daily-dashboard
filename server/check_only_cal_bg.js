const XLSX = require('xlsx');
const p = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR\\10 Building loss report-2026\\BUILDING LOSS 2026\\09 SEP 2026 Building lost daily report- update including OT -.xlsx';

const wb = XLSX.readFile(p);

console.log('=== Checking ONLY Cal BG (Detail), Cal BH (Start), Cal BI (End) ===');

wb.SheetNames.forEach(sheetName => {
  if (!sheetName.startsWith('(') || !sheetName.endsWith(')')) return;
  const ws = wb.Sheets[sheetName];
  if (!ws) return;

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const items = [];
  let currentMC = '';

  data.forEach((row, rowIdx) => {
    if (rowIdx < 5 || rowIdx > 125) return;

    const mcVal = String(row[1] || '').trim();
    if (mcVal && mcVal !== 'MC' && mcVal !== 'Total' && mcVal !== 'Daily Building & Lost Report') {
      currentMC = mcVal;
    }

    const bgDetail = String(row[58] || '').trim();
    const bhStart = row[59];
    const biEnd = row[60];

    // Skip summary / header texts in BG
    if (bgDetail.includes('shift') || bgDetail.includes('Material Delay')) return;

    if (bgDetail || bhStart !== '' || biEnd !== '') {
      items.push({
        sheet: sheetName,
        rowIdx: rowIdx + 1,
        mc: currentMC,
        shift: row[2] || '',
        code: row[4] || '',
        bgDetail,
        bhStart,
        biEnd
      });
    }
  });

  if (items.length > 0) {
    console.log(`\nSheet ${sheetName} (${items.length} items from Cal BG):`);
    console.log(items);
  }
});
