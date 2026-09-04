const XLSX = require('xlsx');

const fileOEE = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\OEE - 2026 TRACKING - SHEAR FISCHER.xlsx';
const fileCheck = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\2026\\09. Fischer check sheet - SEP 2026.xlsx';

console.log('=== FILE 1: OEE - 2026 TRACKING - SHEAR FISCHER.xlsx ===');
try {
  const wbOEE = XLSX.readFile(fileOEE);
  console.log('Sheets:', wbOEE.SheetNames);
  wbOEE.SheetNames.forEach(sheetName => {
    if (sheetName.toLowerCase().includes('sep') || sheetName.toLowerCase().includes('oee')) {
      console.log(`\n--- Sheet: ${sheetName} ---`);
      const ws = wbOEE.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      data.slice(0, 35).forEach((row, i) => {
        if (row.some(c => c !== '')) {
          console.log(`Row ${i}:`, JSON.stringify(row.slice(0, 15)));
        }
      });
    }
  });
} catch (e) {
  console.error('Error reading OEE file:', e.message);
}

console.log('\n=== FILE 2: 09. Fischer check sheet - SEP 2026.xlsx ===');
try {
  const wbCheck = XLSX.readFile(fileCheck);
  console.log('Sheets:', wbCheck.SheetNames);
  wbCheck.SheetNames.slice(0, 10).forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const ws = wbCheck.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    data.slice(0, 20).forEach((row, i) => {
      if (row.some(c => c !== '')) {
        console.log(`Row ${i}:`, JSON.stringify(row.slice(0, 15)));
      }
    });
  });
} catch (e) {
  console.error('Error reading Check sheet file:', e.message);
}
