const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\9-1Milling WASTE_Sep 2026 .xlsx';
const wb = XLSX.readFile(file);

['N', 'P', 'V', 'A', 'G', 'RT27'].forEach(sName => {
  const sheet = wb.Sheets[sName];
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log(`\n--- SHEET [${sName}] ---`);
    rows.slice(0, 10).forEach((r, i) => {
      if (r.some(c => c !== '')) console.log(`Row ${i}:`, r.slice(0, 10));
    });
  }
});
