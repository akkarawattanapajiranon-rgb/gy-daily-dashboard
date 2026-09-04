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

  // Find a daily sheet that has data
  let foundData = false;
  wb.SheetNames.forEach(sheetName => {
    if (isNaN(parseInt(sheetName, 10))) return;
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    let currentDept = '';
    let currentCategory = 'Friction';
    let monthTotals = { Friction: 0, Milling: 0, Bead: 0 };

    rows.forEach((r, rIdx) => {
      if (rIdx < 2) return;
      const dept = String(r[0] || '').trim();
      const desc = String(r[3] || '').trim();
      const defectName = String(r[5] || r[3] || '').trim();
      const code = String(r[4] || r[6] || '').trim();

      if (dept) currentDept = dept;

      // Determine category based on Dept name or Description column
      const lowerDept = currentDept.toLowerCase();
      const lowerDesc = desc.toLowerCase();

      let cat = 'Friction';
      if (lowerDept.includes('bead') || lowerDesc === 'a' || lowerDesc.includes('bead')) {
        cat = 'Bead';
      } else if (lowerDesc.includes('milling') || lowerDept.includes('apex') || lowerDept.includes('hex bead')) {
        cat = 'Milling';
      }

      let rowSum = 0;
      for (let c = 6; c < r.length; c++) {
        const v = parseFloat(r[c]);
        if (!isNaN(v) && v > 0) rowSum += v;
      }

      if (rowSum > 0 && defectName && !defectName.toLowerCase().includes('defect') && !defectName.toLowerCase().includes('ห้ามลบ')) {
        monthTotals[cat] += rowSum;
        if (!foundData) {
          console.log(`[${monthFolder}] Day ${sheetName} Row ${rIdx}: Dept="${currentDept}" (Cat: ${cat}), Code="${code}", Defect="${defectName}", Sum=${rowSum}`);
        }
      }
    });

    if (monthTotals.Friction > 0 || monthTotals.Bead > 0 || monthTotals.Milling > 0) {
      foundData = true;
      console.log(`Summary [${monthFolder}] Day ${sheetName}:`, monthTotals);
    }
  });
});
