const XLSX = require('xlsx');

const oeeFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\OEE 2 Sep,2026.xlsx";
const wb = XLSX.readFile(oeeFile);

['ALL OEE ( Sep, 26) QUAD ', 'ALL OEE ( Sep, 26) 6x8 Ext. '].forEach(sheetName => {
  console.log(`\n================ Sheet: "${sheetName}" ================`);
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  // Print Header
  console.log('Header (Row 1):', data[1]);

  // Print first 5 data rows
  data.slice(2, 8).forEach(r => {
    console.log(`Date ${r[0]}: SR=${r[1]}, AR=${r[3]}, PR=${r[4]}, QR=${r[5]}, OEE1=${r[6]}, OEE2=${r[7]}, BD%=${r[8]}`);
  });
});
