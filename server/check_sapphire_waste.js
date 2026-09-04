const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const dir = 'T:\\10.30 A.M. Production Meeting\\001-SAPPHIRE-DAMRONGSAK\\Waste\\Waste 2026';
console.log('Files in Waste 2026:', fs.readdirSync(dir));

const sepFile = path.join(dir, '09 Sapphire_Waste_Sep26.xlsm');
if (fs.existsSync(sepFile)) {
  console.log('\nReading 09 Sapphire_Waste_Sep26.xlsm...');
  const wb = XLSX.readFile(sepFile);
  console.log('Sheet Names:', wb.SheetNames);

  wb.SheetNames.forEach(sheetName => {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log(`\nSheet [${sheetName}] First 5 rows:`);
    rows.slice(0, 5).forEach((r, i) => console.log(`Row ${i}:`, r.slice(0, 10)));
  });
}
