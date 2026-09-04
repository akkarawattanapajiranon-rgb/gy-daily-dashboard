const XLSX = require('xlsx');

const tuberFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Q -TUBER 6''X 8''\\Booker Sheet - 6'' x 8 ''\\2026\\9. Sep 2026  BOOKING.xls";
const wb = XLSX.readFile(tuberFile);
const ws = wb.Sheets['1'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('=== TUBER SHIFT 1 ROWS 7 to 25 ===');
data.slice(7, 25).forEach((r, idx) => {
  const rowNum = idx + 7;
  const cells = r.map((c, colIdx) => c !== '' ? `C${colIdx}:${c}` : null).filter(Boolean);
  if (cells.length > 0) {
    console.log(`Row ${rowNum}:`, cells.join(' | '));
  }
});
