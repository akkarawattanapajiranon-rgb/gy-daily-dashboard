const XLSX = require('xlsx');

const checkFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\2026\\09. Fischer check sheet - SEP 2026.xlsx";
const wb = XLSX.readFile(checkFile);

const ws = wb.Sheets['SEP 2026'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('Total Rows in SEP 2026:', data.length);
data.forEach((r, idx) => {
  const rawDate = r[0];
  if (rawDate !== '' && rawDate !== undefined) {
    let dStr = '';
    if (typeof rawDate === 'number') {
      const d = XLSX.SSF.parse_date_code(rawDate);
      dStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
    } else {
      dStr = String(rawDate).trim();
    }
    
    // Check other non-empty cells in this row
    const nonDateCells = r.slice(1).map(c => String(c).trim()).filter(c => c !== '');
    
    console.log(`Row ${idx}: Date="${dStr}", nonDateCellsCount=${nonDateCells.length}, nonDateCells=`, nonDateCells);
  }
});
