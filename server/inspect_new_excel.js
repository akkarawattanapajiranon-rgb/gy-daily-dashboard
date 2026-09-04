const XLSX = require('xlsx');

const filePath = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown\\Issue log 2026 _ BCA 14AUG2026.xlsx';

try {
  const wb = XLSX.readFile(filePath);
  console.log('=== SHEET NAMES ===');
  console.log(JSON.stringify(wb.SheetNames));

  wb.SheetNames.forEach(sheetName => {
    console.log('\n=== SHEET:', sheetName, '===');
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    data.slice(0, 15).forEach((row, i) => {
      if (row.some(cell => cell !== '')) {
        console.log('Row ' + i + ': ' + JSON.stringify(row.slice(0, 20)));
      }
    });
  });
} catch (e) {
  console.error('Error:', e.message);
}
