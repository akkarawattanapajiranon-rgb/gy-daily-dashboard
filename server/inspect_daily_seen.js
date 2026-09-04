const XLSX = require('xlsx');

const filePath = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown\\Issue log 2026 _ BCA 14AUG2026.xlsx';
const wb = XLSX.readFile(filePath);

const ws = wb.Sheets['Daliy seen Sep2'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

console.log('Total rows in Daliy seen Sep2:', data.length);
console.log('Row 0 headers:');
data[0].forEach((h, i) => console.log(`Col ${i}: ${String(h).replace(/\r?\n/g, ' ')}`));

// Check distinct values of Col 0 (Date)
const dates = new Set();
data.slice(1).forEach(row => {
  if (row[0] !== '') dates.add(row[0]);
});

console.log('\nDistinct Date values in Col 0:', Array.from(dates));
