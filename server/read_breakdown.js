const XLSX = require('xlsx');

const filePath = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown\\Thailand_Breakdown_2026_Rev.1.xlsx';

const wb = XLSX.readFile(filePath);

// Focus on the sheet with "Breakdown" and "Thailand" data
// Try each sheet
wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  // Find rows containing "Thailand" and "Breakdown"
  const hits = data.filter(row => 
    row.some(cell => String(cell).includes('Thailand')) &&
    row.some(cell => String(cell).toLowerCase().includes('breakdown'))
  );
  if (hits.length > 0) {
    console.log('\n=== SHEET:', sheetName, '- Thailand+Breakdown rows ===');
    hits.slice(0, 15).forEach(row => console.log(JSON.stringify(row.slice(0, 15))));
  }
});
