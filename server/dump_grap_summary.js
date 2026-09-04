const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const baseDir = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report";

const folders = fs.readdirSync(baseDir);
folders.forEach(folder => {
  const fullFolder = path.join(baseDir, folder);
  if (!fs.statSync(fullFolder).isDirectory()) return;

  const files = fs.readdirSync(fullFolder);
  const frictionFile = files.find(f => f.toLowerCase().includes('friction') && !f.startsWith('~$'));
  const millingFile = files.find(f => f.toLowerCase().includes('milling') && !f.startsWith('~$'));

  console.log(`\n================ FOLDER: ${folder} ================`);
  if (frictionFile) {
    const wb = XLSX.readFile(path.join(fullFolder, frictionFile));
    const ws = wb.Sheets['Grap'];
    if (ws) {
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      console.log('Friction File -> "Grap" Sheet:');
      data.forEach((r, idx) => {
        const nonZero = r.filter(c => c !== '' && c !== 0);
        if (nonZero.length > 0) {
          console.log(`  Row ${idx} (${r[0]}):`, r.slice(0, 15));
        }
      });
    }
  }

  if (millingFile) {
    const wb = XLSX.readFile(path.join(fullFolder, millingFile));
    const ws = wb.Sheets['Grap'];
    if (ws) {
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      console.log('Milling File -> "Grap" Sheet:');
      data.forEach((r, idx) => {
        const nonZero = r.filter(c => c !== '' && c !== 0);
        if (nonZero.length > 0) {
          console.log(`  Row ${idx} (${r[0]}):`, r.slice(0, 15));
        }
      });
    }
  }
});
