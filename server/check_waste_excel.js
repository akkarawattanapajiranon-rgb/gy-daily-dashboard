const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const wasteFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\Break Down_Waste.xlsx";

if (fs.existsSync(wasteFile)) {
  console.log('Found Break Down_Waste.xlsx!');
  const wb = XLSX.readFile(wasteFile);
  console.log('Sheet Names:', wb.SheetNames);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('Rows count:', data.length);
  data.slice(0, 10).forEach((r, idx) => console.log(`Row ${idx}:`, r.slice(0, 10)));
} else {
  console.log('Break Down_Waste.xlsx not found');
}
