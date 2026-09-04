const XLSX = require('xlsx');

const f1 = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\6. Jun 2026\\6. Jun 2026-Friction Waste Report 2026.xlsx";
const f2 = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\6. Jun 2026\\6. Jun 2026-Milling Waste Report.xlsx";

console.log('=== NON-EMPTY CELLS IN FRICTION SHEET "2" ===');
const wb1 = XLSX.readFile(f1);
const ws1 = wb1.Sheets['2'];
const data1 = XLSX.utils.sheet_to_json(ws1, { header: 1, defval: '' });

data1.forEach((row, rIdx) => {
  row.forEach((cell, cIdx) => {
    if (cell !== '' && cell !== undefined && cell !== 0) {
      console.log(`Row ${rIdx}, Col ${cIdx} (${XLSX.utils.encode_cell({ r: rIdx, c: cIdx })}):`, cell);
    }
  });
});
