const XLSX = require('xlsx');

const fileOEE = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\OEE - 2026 TRACKING - SHEAR FISCHER.xlsx';
const wb = XLSX.readFile(fileOEE);

console.log('File 1 Sheets:', wb.SheetNames);

wb.SheetNames.forEach(name => {
  console.log('\n======================================');
  console.log('Sheet:', name);
  console.log('======================================');
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  data.slice(0, 15).forEach((row, i) => {
    if (row.some(c => c !== '')) {
      console.log(`Row ${i}:`, JSON.stringify(row.slice(0, 15)));
    }
  });
});
