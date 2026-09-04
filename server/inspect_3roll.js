const XLSX = require('xlsx');
const path = require('path');

const filePath = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\3 Roll\\2026\\9 -Treatment Release SEP 2026.xls';

try {
  const wb = XLSX.readFile(filePath);
  console.log('=== SHEET NAMES ===');
  console.log(wb.SheetNames);

  const ws = wb.Sheets['WINDUP'] || wb.Sheets[wb.SheetNames.find(s => s.toLowerCase().includes('windup'))];
  if (!ws) {
    console.error('WINDUP sheet not found!');
  } else {
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.log(`Total rows in WINDUP: ${data.length}`);

    // Print first 20 rows
    data.slice(0, 25).forEach((row, i) => {
      if (row.some(c => c !== '')) {
        console.log(`Row ${i}:`, JSON.stringify(row.slice(0, 15)));
      }
    });
  }
} catch (e) {
  console.error('Error reading 3 Roll file:', e.message);
}
