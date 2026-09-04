const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\3 Roll\\2026\\1 - Treatment Release JAN 2026.xls';
const wb = XLSX.readFile(file);
console.log('Jan 3 Roll Sheets:', wb.SheetNames);
