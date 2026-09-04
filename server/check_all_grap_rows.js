const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const WASTE_BASE_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report';
const monthDirs = fs.readdirSync(WASTE_BASE_DIR);

monthDirs.forEach(monthFolder => {
  const monthFolderPath = path.join(WASTE_BASE_DIR, monthFolder);
  if (!fs.statSync(monthFolderPath).isDirectory()) return;

  const files = fs.readdirSync(monthFolderPath);
  const frictionFile = files.find(f => f.toLowerCase().includes('friction') && !f.startsWith('~$'));
  if (!frictionFile) return;

  const wb = XLSX.readFile(path.join(monthFolderPath, frictionFile));
  const grapSheet = wb.Sheets['Grap'];
  if (grapSheet) {
    const grapData = XLSX.utils.sheet_to_json(grapSheet, { header: 1, defval: '' });
    console.log(`\n================ ${monthFolder} Grap Sheet ================`);
    grapData.forEach((r, idx) => {
      if (r[0] !== undefined && r[0] !== '') {
        console.log(`Row ${idx}: "${r[0]}" -> Day 3 val: ${r[3]}, Day 1 val: ${r[1]}`);
      }
    });
  }
});
