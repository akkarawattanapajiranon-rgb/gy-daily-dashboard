const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const file1 = "T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\Break Down_Waste.xlsx";

if (fs.existsSync(file1)) {
  const wb = XLSX.readFile(file1);
  console.log('Break Down_Waste.xlsx sheets:', wb.SheetNames);
  wb.SheetNames.forEach(s => {
    const ws = wb.Sheets[s];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.log(`Sheet "${s}" rows: ${data.length}`);
    if (data.length > 0) {
      console.log(' Header:', data[0].slice(0, 8));
      if (data[1]) console.log(' Row 1:', data[1].slice(0, 8));
    }
  });
}
