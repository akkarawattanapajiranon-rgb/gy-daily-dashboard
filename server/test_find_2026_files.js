const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const BASE_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026';

function findFilesForMonth(monthNum) {
  const files = fs.readdirSync(BASE_DIR);
  
  // Find milling waste file for month (e.g., 9-1Milling WASTE_Sep 2026 .xlsx)
  const mFile = files.find(f => {
    if (f.startsWith('~$')) return false;
    const l = f.toLowerCase();
    return (l.includes(`${monthNum}-`) || l.includes(`_${monthNum} `) || l.includes(`sep`) || l.includes(`sept`)) && l.includes('milling');
  });

  // Friction tracking file
  const fFile = path.join(BASE_DIR, 'DAILY FRICTION', 'NEW DAILY FRICTION TRACKING - 2026.xlsx');

  console.log(`Month ${monthNum} Files:`);
  console.log('  Milling File:', mFile || 'None');
  console.log('  Friction File:', fs.existsSync(fFile) ? 'NEW DAILY FRICTION TRACKING - 2026.xlsx' : 'None');

  return {
    millingFile: mFile ? path.join(BASE_DIR, mFile) : null,
    frictionFile: fs.existsSync(fFile) ? fFile : null
  };
}

findFilesForMonth(9);
