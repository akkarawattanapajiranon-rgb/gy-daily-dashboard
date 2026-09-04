const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const REAL_WASTE_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026';

console.log('--- FILES IN 1Miling WASTE_2019\\Milling WASTE_2026 ---');
const files = fs.readdirSync(REAL_WASTE_DIR);
files.forEach(f => console.log(f));

// Inspect 9-1Milling WASTE_Sep 2026 .xlsx
const sepFile = path.join(REAL_WASTE_DIR, '9-1Milling WASTE_Sep 2026 .xlsx');
if (fs.existsSync(sepFile)) {
  console.log('\n================ Reading 9-1Milling WASTE_Sep 2026 .xlsx ================');
  const wb = XLSX.readFile(sepFile);
  console.log('Sheet Names:', wb.SheetNames);
  
  wb.SheetNames.slice(0, 5).forEach(s => {
    const sheet = wb.Sheets[s];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log(`\nSheet [${s}] First 5 rows:`);
    rows.slice(0, 5).forEach((r, i) => console.log(`Row ${i}:`, r.slice(0, 10)));
  });
}
