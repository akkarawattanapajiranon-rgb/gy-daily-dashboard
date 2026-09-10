const XLSX = require('xlsx');
const p = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR\\10 Building loss report-2026\\BUILDING LOSS 2026\\09 SEP 2026 Building lost daily report- update including OT -.xlsx';

const wb = XLSX.readFile(p);

console.log('=== Checking Col BQ (Material Issue) & Col BG (Material Delay) ===');

wb.SheetNames.forEach(sheetName => {
  if (!sheetName.startsWith('(') || !sheetName.endsWith(')')) return;
  const ws = wb.Sheets[sheetName];
  if (!ws) return;

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  data.forEach((row, rowIdx) => {
    if (rowIdx < 5 || rowIdx > 125) return;

    const bq = String(row[68] || '').trim();
    const br = String(row[69] || '').trim();
    const bs = String(row[70] || '').trim();

    if (bq || br || bs) {
      console.log(`Sheet ${sheetName} Row ${rowIdx + 1} Col BQ(Material Issue): "${bq}", BR(Start): "${br}", BS(End): "${bs}"`);
    }
  });
});
