const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const REAL_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026';

function searchFolderForNumbers(dirPath) {
  const items = fs.readdirSync(dirPath);
  items.forEach(item => {
    if (item.startsWith('~$')) return;
    const p = path.join(dirPath, item);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      searchFolderForNumbers(p);
    } else if (item.endsWith('.xlsx') || item.endsWith('.xls') || item.endsWith('.xlsm')) {
      try {
        const wb = XLSX.readFile(p);
        wb.SheetNames.forEach(sName => {
          const sheet = wb.Sheets[sName];
          const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          json.forEach((row, rIdx) => {
            row.forEach((cell, cIdx) => {
              const val = parseFloat(cell);
              if (val === 478.6 || val === 135 || val === 297 || val === 46.6 || val === 297.0) {
                console.log(`FOUND ${val} in File: ${p} | Sheet: [${sName}] | Cell [R${rIdx}C${cIdx}]`);
              }
            });
          });
        });
      } catch (e) {}
    }
  });
}

console.log('Searching for 478.6, 135, 297, 46.6 in Milling WASTE_2026...');
searchFolderForNumbers(REAL_DIR);
