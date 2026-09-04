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
  console.log(`\n========================================`);
  console.log(`Folder: ${monthFolder} | File: ${frictionFile}`);

  // Check Sheet 'Grap'
  const grapSheet = wb.Sheets['Grap'];
  if (grapSheet) {
    const grapData = XLSX.utils.sheet_to_json(grapSheet, { header: 1, defval: '' });
    console.log('Grap Sheet Row Names (Col 0):');
    grapData.forEach((r, idx) => {
      if (r[0]) console.log(`  Row ${idx}: "${r[0]}"`);
    });
  }

  // Check a daily sheet with data, e.g., '1' or '3' or '10'
  const dailySheetName = wb.SheetNames.find(s => !isNaN(parseInt(s, 10)));
  if (dailySheetName) {
    const sheet = wb.Sheets[dailySheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log(`Daily Sheet [${dailySheetName}] structure check:`);
    rows.forEach((r, rIdx) => {
      if (rIdx < 2) return;
      const dept = String(r[0] || '').trim();
      const desc = String(r[3] || '').trim();
      const code = String(r[4] || r[6] || '').trim();
      const defectName = String(r[5] || r[3] || '').trim();

      // check if any shift column (6 to 20) has positive numeric value
      let rowSum = 0;
      for (let c = 6; c < r.length; c++) {
        const v = parseFloat(r[c]);
        if (!isNaN(v) && v > 0) rowSum += v;
      }
      if (rowSum > 0 && !defectName.toLowerCase().includes('defect') && !defectName.toLowerCase().includes('ห้ามลบ')) {
        console.log(`  Row ${rIdx}: Dept="${dept}", Desc="${desc}", Code="${code}", Defect="${defectName}", Sum=${rowSum}`);
      }
    });
  }
});
