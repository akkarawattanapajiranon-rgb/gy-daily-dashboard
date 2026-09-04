const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const WASTE_BASE_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report';
const monthFolder = '4. APRIL 2026'; // April has data
const monthFolderPath = path.join(WASTE_BASE_DIR, monthFolder);
const files = fs.readdirSync(monthFolderPath);
const frictionFile = files.find(f => f.toLowerCase().includes('friction') && !f.startsWith('~$'));

const wb = XLSX.readFile(path.join(monthFolderPath, frictionFile), { cellFormulas: true });

// Check Day 1 sheet
const daySheet = wb.Sheets['1'];
const rows = XLSX.utils.sheet_to_json(daySheet, { header: 1, defval: '' });

let currentCategory = 'Friction';

let totals = {
  Friction: 0,
  Milling: 0,
  Bead: 0,
  Other: 0
};

let maps = {
  Friction: {},
  Milling: {},
  Bead: {}
};

rows.forEach((r, rIdx) => {
  if (rIdx < 3) return;
  
  const dept = String(r[0] || '').trim();
  const desc = String(r[3] || '').trim();
  const defectName = String(r[5] || r[3] || '').trim();
  const code = String(r[4] || r[6] || '').trim();

  // Track category from Dept or Desc
  if (dept.toLowerCase().includes('bead') || desc === 'A' || desc.toLowerCase().includes('bead')) {
    currentCategory = 'Bead';
  } else if (desc.toLowerCase().includes('milling') || dept.toLowerCase().includes('apex') || dept.toLowerCase().includes('hex bead')) {
    currentCategory = 'Milling';
  } else if (desc.toLowerCase().includes('friction') || dept) {
    // If dept is specified and not bead/milling, reset to Friction or keep current if empty dept
    if (dept && !dept.toLowerCase().includes('bead')) {
      currentCategory = 'Friction';
    }
  }

  let rowSum = 0;
  for (let c = 6; c < r.length; c++) {
    const v = parseFloat(r[c]);
    if (!isNaN(v) && v > 0) rowSum += v;
  }

  if (rowSum > 0 && defectName && !defectName.toLowerCase().includes('defect') && !defectName.toLowerCase().includes('ห้ามลบ')) {
    const key = code || defectName;
    console.log(`Row ${rIdx}: Dept="${dept}", Desc="${desc}", Category="${currentCategory}", Defect="${defectName}", Code="${code}", Sum=${rowSum}`);
    totals[currentCategory] = (totals[currentCategory] || 0) + rowSum;
  }
});

console.log('\nCalculated Category Totals:', totals);

const grapSheet = wb.Sheets['Grap'];
if (grapSheet) {
  const grapData = XLSX.utils.sheet_to_json(grapSheet, { header: 1, defval: '' });
  console.log('Grap Sheet Row 1 (Friction):', grapData[1] ? grapData[1][1] : 'N/A');
  console.log('Grap Sheet Row 2 (Milling):', grapData[2] ? grapData[2][1] : 'N/A');
}
