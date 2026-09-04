const XLSX = require('xlsx');

const checkFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\2026\\09. Fischer check sheet - SEP 2026.xlsx";
const wb = XLSX.readFile(checkFile);
const ws = wb.Sheets['SEP 26'] || wb.Sheets[0];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('Total Rows:', data.length);
data.slice(5).forEach((row, idx) => {
  const rawDate = row[0];
  if (!rawDate) return;
  
  let dStr = '';
  if (typeof rawDate === 'number') {
    const d = XLSX.SSF.parse_date_code(rawDate);
    dStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  } else {
    dStr = String(rawDate).trim();
  }

  if (dStr === '2026-09-03') {
    const otherCells = row.slice(1).filter(c => String(c).trim() !== '');
    console.log(`Row idx ${idx+5}: Date=${dStr}, otherCellsCount=${otherCells.length}, cells=`, row.slice(0, 15));
  }
});
