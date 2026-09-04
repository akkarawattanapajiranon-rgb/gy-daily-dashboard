const XLSX = require('xlsx');

const file = "T:\\10.30 A.M. Production Meeting\\5 BTA\\3 Roll\\2026\\9 -Treatment Release SEP 2026.xls";

const wb = XLSX.readFile(file);
console.log('Sheets in 9 -Treatment Release SEP 2026.xls:', wb.SheetNames);

const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes('wind')) || wb.SheetNames[0];
console.log('Using sheet:', sheetName);
const ws = wb.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('Total rows:', data.length);
data.slice(0, 25).forEach((r, idx) => console.log(`Row ${idx}:`, r.slice(0, 10)));

console.log('\n--- ALL ROWS WITH DATA FOR DAY 1, 2, 3 ---');
data.forEach((r, idx) => {
  if (idx < 10) return;
  const rawDate = r[0];
  if (rawDate === '' || rawDate === undefined) return;

  let dDay = null;
  if (typeof rawDate === 'number') {
    const d = XLSX.SSF.parse_date_code(rawDate);
    dDay = d.d;
  } else if (typeof rawDate === 'string' && rawDate.trim() !== '') {
    const parsed = parseInt(rawDate.trim(), 10);
    if (!isNaN(parsed)) dDay = parsed;
  }

  if (dDay !== null && dDay <= 3) {
    console.log(`Row ${idx} (Day ${dDay}): Col[0]=${r[0]}, Col[1]=${r[1]}, Col[2]=${r[2]}, Col[3]=${r[3]}, Col[4]=${r[4]}, Col[5]=${r[5]}`);
  }
});
