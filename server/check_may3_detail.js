const XLSX = require('xlsx');
const path = require('path');

const dir = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\5. MAY 2026';
const fFile = path.join(dir, '5. May 2026-Friction Waste Report 2026.xlsx');
const mFile = path.join(dir, '5. May 2026-Milling Waste Report.xlsx');

console.log('================ FRICTION FILE (MAY 3) ================');
const wbF = XLSX.readFile(fFile);
const sF3 = wbF.Sheets['3'];
if (sF3) {
  const rows = XLSX.utils.sheet_to_json(sF3, { header: 1, defval: '' });
  rows.forEach((r, i) => {
    if (i < 2) return;
    let sum = 0;
    for (let c = 6; c < r.length; c++) {
      const v = parseFloat(r[c]);
      if (!isNaN(v) && v > 0) sum += v;
    }
    if (sum > 0) {
      console.log(`Row ${i}: Dept="${r[0]}", Desc="${r[3]}", Code="${r[4]||r[6]}", Defect="${r[5]||r[3]}", Sum=${sum}`);
    }
  });
}

console.log('\n================ MILLING FILE (MAY 3) ================');
const wbM = XLSX.readFile(mFile);
const sM3 = wbM.Sheets['3'];
if (sM3) {
  const rows = XLSX.utils.sheet_to_json(sM3, { header: 1, defval: '' });
  rows.forEach((r, i) => {
    if (i < 2) return;
    let sum = 0;
    for (let c = 6; c <= 9; c++) {
      const v = parseFloat(r[c]);
      if (!isNaN(v) && v > 0) sum += v;
    }
    if (sum > 0) {
      console.log(`Row ${i}: Dept="${r[0]}", Desc="${r[2]}", Code="${r[3]||r[0]}", Defect="${r[5]||r[1]}", Sum=${sum}`);
    }
  });
}

console.log('\n================ GRAPH SHEETS (MAY) ================');
const gF = wbF.Sheets['Grap'];
if (gF) {
  const grapF = XLSX.utils.sheet_to_json(gF, { header: 1, defval: '' });
  console.log('Friction File Grap Day 3 (Col 3):');
  console.log('  Row 1 (Friction):', grapF[1] ? grapF[1][3] : 'N/A');
  console.log('  Row 2 (Milling):', grapF[2] ? grapF[2][3] : 'N/A');
}

const gM = wbM.Sheets['Grap'];
if (gM) {
  const grapM = XLSX.utils.sheet_to_json(gM, { header: 1, defval: '' });
  console.log('Milling File Grap Day 3 (Col 3):');
  console.log('  Row 1:', grapM[1] ? grapM[1][3] : 'N/A');
  console.log('  Row 2:', grapM[2] ? grapM[2][3] : 'N/A');
}
