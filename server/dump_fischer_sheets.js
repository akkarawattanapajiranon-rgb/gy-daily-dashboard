const XLSX = require('xlsx');

const checkFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\2026\\09. Fischer check sheet - SEP 2026.xlsx";
const wb = XLSX.readFile(checkFile);
console.log('Sheets:', wb.SheetNames);

const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

data.slice(0, 15).forEach((r, idx) => {
  console.log(`Row ${idx}:`, r.slice(0, 10).filter(c => c !== ''));
});
