const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const dir = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\DAILY FRICTION';
console.log('Files in DAILY FRICTION:', fs.readdirSync(dir));

const files = fs.readdirSync(dir);
files.forEach(file => {
  if (file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.xlsm')) {
    if (file.startsWith('~$')) return;
    try {
      const wb = XLSX.readFile(path.join(dir, file));
      console.log(`\n================ File: ${file} ================`);
      console.log('Sheet Names:', wb.SheetNames);
    } catch (e) {
      console.error(`Err ${file}:`, e.message);
    }
  }
});
