const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\6. Jun 2026\\6. Jun 2026-Friction Waste Report 2026.xlsx';
const wb = XLSX.readFile(file);

console.log('--- ALL NON-ZERO ROWS IN ALL SHEETS OF FRICTION REPORT ---');

wb.SheetNames.forEach(sheetName => {
  if (sheetName === 'Grap' || sheetName === 'Name' || sheetName === 'Defect') return;
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  rows.forEach((r, rIdx) => {
    if (rIdx < 2) return;
    const dept = String(r[0] || '').trim();
    const desc = String(r[3] || '').trim();
    const code = String(r[4] || r[6] || '').trim();
    const defectName = String(r[5] || r[3] || '').trim();

    let rowSum = 0;
    for (let c = 6; c < r.length; c++) {
      const v = parseFloat(r[c]);
      if (!isNaN(v) && v > 0) rowSum += v;
    }

    if (rowSum > 0) {
      console.log(`Sheet [${sheetName}] Row ${rIdx}: Dept="${dept}", Desc="${desc}", Code="${code}", Defect="${defectName}", Sum=${rowSum}`);
    }
  });
});
