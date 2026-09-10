const XLSX = require('xlsx');
const p = 'N:\\New 2 Hours Reporting\\Production record 2026\\09 Sep 2026ไฟล์เดียวรวมทุกวัน\\BTB_Radial Sep 2026.xls';
const wb = XLSX.readFile(p, {cellComments: true});
const ws = wb.Sheets['3']; // or '9'
const data = XLSX.utils.sheet_to_json(ws, {header: 1, defval: ''});

console.log('Row 0:', data[0].slice(0, 50));
console.log('Row 1:', data[1].slice(0, 50));
console.log('Row 2:', data[2].slice(0, 50));

data.forEach((r, i) => {
  if (i > 2 && i < 25) {
    console.log(`Row ${i} (${r[0]} | ${r[1]}): Col P(15)=${r[15]}, Col AD(29)=${r[29]}, Col AR(43)=${r[43]}`);
  }
});
