const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\9-1Milling WASTE_Sep 2026 .xlsx';
const wb = XLSX.readFile(file);
const sheet = wb.Sheets['By day'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log('--- BY DAY SHEET FULL STRUCTURE & SUMMARIES ---');
rows.forEach((r, i) => {
  const line = r.filter(c => c !== '').join(' | ');
  if (line.toLowerCase().includes('sum') || line.toLowerCase().includes('total') || line.toLowerCase().includes('code :')) {
    console.log(`Row ${String(i).padStart(3, ' ')}:`, r.slice(0, 15));
  }
});
