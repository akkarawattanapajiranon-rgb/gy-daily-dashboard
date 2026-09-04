const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const WASTE_BASE_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report';

if (!fs.existsSync(WASTE_BASE_DIR)) {
  console.log('Waste dir not found');
  process.exit(1);
}

const monthDirs = fs.readdirSync(WASTE_BASE_DIR);
console.log('Month Dirs:', monthDirs);

const sepDir = monthDirs.find(d => d.includes('SEP') || d.includes('9.'));
if (sepDir) {
  const fullPath = path.join(WASTE_BASE_DIR, sepDir);
  const files = fs.readdirSync(fullPath);
  console.log(`Files in ${sepDir}:`, files);

  files.forEach(file => {
    if (file.endsWith('.xls') || file.endsWith('.xlsx')) {
      const filePath = path.join(fullPath, file);
      try {
        const wb = XLSX.readFile(filePath);
        console.log(`\nWorkbook: ${file}`);
        console.log(`Sheet Names:`, wb.SheetNames);
        const grapSheet = wb.Sheets['Grap'];
        if (grapSheet) {
          const grapData = XLSX.utils.sheet_to_json(grapSheet, { header: 1, defval: '' });
          console.log('Grap Sheet First 6 Rows:');
          console.log(grapData.slice(0, 6));
        }
      } catch (err) {
        console.error(`Error reading ${file}:`, err.message);
      }
    }
  });
}
