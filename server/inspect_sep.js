const XLSX = require('xlsx');
const wb = XLSX.readFile('T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown\\Thailand_Breakdown_2026_Rev.1.xlsx');

const ws = wb.Sheets['SEP2026'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Find BD% rows for Thailand Breakdown
data.forEach((row, i) => {
  if (
    String(row[0]).trim() === 'Thailand' &&
    String(row[1]).trim() === 'Breakdown' &&
    String(row[3]).trim() === 'BD%'
  ) {
    console.log('Row ' + i + ': ' + JSON.stringify(row.slice(0, 40)));
  }
});
