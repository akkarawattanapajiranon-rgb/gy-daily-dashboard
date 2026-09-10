const XLSX = require('xlsx');
const p = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR\\10 Building loss report-2026\\BUILDING LOSS 2026\\09 SEP 2026 Building lost daily report- update including OT -.xlsx';

console.log('Reading file:', p);
const wb = XLSX.readFile(p);
console.log('Sheet Names:', wb.SheetNames);

// Inspect sheet (3) or (9) or similar
const targetSheet = wb.SheetNames.find(s => s.includes('3') || s.includes('9')) || wb.SheetNames[0];
console.log('Inspecting sheet:', targetSheet);
const ws = wb.Sheets[targetSheet];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('Total rows:', data.length);
data.slice(0, 15).forEach((r, i) => {
  console.log(`Row ${i}:`, r.slice(0, 15));
});

// Look at columns around BG (index 58), BH (index 59), BI (index 60)
console.log('\n--- Headers at Row 5 to 10 for Col BG (58), BH (59), BI (60) ---');
for (let r = 0; r < 15; r++) {
  console.log(`Row ${r}: Col A(${data[r]?.[0]}), Col B(${data[r]?.[1]}), Col BG 58(${data[r]?.[58]}), Col BH 59(${data[r]?.[59]}), Col BI 60(${data[r]?.[60]}), Col BJ 61(${data[r]?.[61]})`);
}
