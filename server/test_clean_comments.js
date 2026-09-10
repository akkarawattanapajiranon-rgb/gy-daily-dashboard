const XLSX = require('xlsx');
const p = 'N:\\New 2 Hours Reporting\\Production record 2026\\09 Sep 2026ไฟล์เดียวรวมทุกวัน\\BTB_Radial Sep 2026.xls';
const wb = XLSX.readFile(p, {cellComments: true});
const ws = wb.Sheets['3'];

function clean(s) {
  if (!s) return '';
  return String(s)
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/[^\u0E00-\u0E7F\w\s.,:;()\/><=+\-*#"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

Object.keys(ws).forEach(addr => {
  const cell = ws[addr];
  if (cell && cell.c && cell.c.length > 0) {
    const txt = cell.c.map(x => clean(x.t)).filter(Boolean).join(' | ');
    if (txt) console.log(addr, '->', txt);
  }
});
