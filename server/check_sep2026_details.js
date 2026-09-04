const XLSX = require('xlsx');
const path = require('path');

const mFile = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\9-1Milling WASTE_Sep 2026 .xlsx';
const fFile = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\DAILY FRICTION\\NEW DAILY FRICTION TRACKING - 2026.xlsx';

console.log('================ MILLING FILE: 9-1Milling WASTE_Sep 2026 .xlsx ================');
const wbM = XLSX.readFile(mFile);

// Check sheets 'N', 'P', 'V', 'A', 'G', 'RT27', 'MillingWaste'
['N', 'P', 'V', 'A', 'G', 'RT27', 'MillingWaste'].forEach(sName => {
  const sheet = wbM.Sheets[sName];
  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log(`\nSheet [${sName}] Total Rows: ${rows.length}`);
    rows.slice(0, 10).forEach((r, i) => {
      if (r.some(c => c !== '')) console.log(`  Row ${i}:`, r.slice(0, 10));
    });
  }
});

console.log('\n================ FRICTION FILE: NEW DAILY FRICTION TRACKING - 2026.xlsx ================');
const wbF = XLSX.readFile(fFile);
const sepF = wbF.Sheets['Sep'];
if (sepF) {
  const rows = XLSX.utils.sheet_to_json(sepF, { header: 1, defval: '' });
  console.log('Sep Sheet Total Rows:', rows.length);
  rows.forEach((r, i) => {
    if (r.some(c => c !== '')) console.log(`  Row ${i}:`, r.slice(0, 15));
  });
}
