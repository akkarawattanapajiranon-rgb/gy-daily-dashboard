const XLSX = require('xlsx');

const quadFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\Booker Sheet\\2026\\9. Sep 2026 update Booking.xlsx";
const wb = XLSX.readFile(quadFile);
const ws = wb.Sheets['1'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('Header Row 4:', data[4].slice(0, 10));
console.log('Header Row 5:', data[5].slice(0, 10));
console.log('Header Row 6:', data[6].slice(0, 10));

console.log('\nData Rows 19 to 25:');
data.slice(19, 26).forEach((r, idx) => {
  console.log(`Row ${idx+19}: PartID="${r[0]}", Code1="${r[1]}", Code2="${r[3]}", Col4(E)="${r[4]}", Col5(F)="${r[5]}", Col6(G)="${r[6]}", Col7(H)="${r[7]}"`);
});
