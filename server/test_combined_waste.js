const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

function testCombinedWaste(monthFolder, dayNum) {
  const dir = `T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\${monthFolder}`;
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  const fFileName = files.find(f => f.toLowerCase().includes('friction') && !f.startsWith('~$'));
  const mFileName = files.find(f => f.toLowerCase().includes('milling') && !f.startsWith('~$'));

  let totals = { Friction: 0, Milling: 0, Bead: 0 };
  let frictionMap = {}, millingMap = {}, beadMap = {};

  // 1. Process Friction File Daily Sheet
  if (fFileName) {
    const wbF = XLSX.readFile(path.join(dir, fFileName));
    const sheetF = wbF.Sheets[String(dayNum)];
    if (sheetF) {
      const rows = XLSX.utils.sheet_to_json(sheetF, { header: 1, defval: '' });
      let currentDept = '';
      rows.forEach((r, rIdx) => {
        if (rIdx < 2) return;
        const dept = String(r[0] || '').trim();
        const desc = String(r[3] || '').trim();
        const code = String(r[4] || r[6] || '').trim();
        const defectName = String(r[5] || r[3] || '').trim();

        if (dept) currentDept = dept;

        const lowerDept = currentDept.toLowerCase();
        const lowerDesc = desc.toLowerCase();

        let category = 'Friction';
        if (lowerDept.includes('bead') || lowerDesc === 'a' || lowerDesc.includes('bead')) {
          category = 'Bead';
        } else if (lowerDesc.includes('milling') || lowerDept.includes('apex') || lowerDept.includes('hex bead')) {
          category = 'Milling';
        }

        let rowSum = 0;
        for (let c = 6; c < r.length; c++) {
          const v = parseFloat(r[c]);
          if (!isNaN(v) && v > 0) rowSum += v;
        }

        if (rowSum > 0 && defectName && !defectName.toLowerCase().includes('defect') && !defectName.toLowerCase().includes('ห้ามลบ')) {
          const key = code || defectName;
          totals[category] += rowSum;
          const targetMap = category === 'Bead' ? beadMap : (category === 'Milling' ? millingMap : frictionMap);
          if (!targetMap[key]) targetMap[key] = { code: key, amount: 0, reason: defectName, source: 'FrictionFile' };
          targetMap[key].amount += rowSum;
        }
      });
    }
  }

  // 2. Process Milling File Daily Sheet
  if (mFileName) {
    const wbM = XLSX.readFile(path.join(dir, mFileName));
    const sheetM = wbM.Sheets[String(dayNum)];
    if (sheetM) {
      const rows = XLSX.utils.sheet_to_json(sheetM, { header: 1, defval: '' });
      let currentDept = '';
      rows.forEach((r, rIdx) => {
        if (rIdx < 2) return;
        const dept = String(r[0] || '').trim();
        const desc = String(r[2] || r[1] || '').trim();
        const code = String(r[3] || r[0] || '').trim();
        const defectName = String(r[5] || r[1] || '').trim();

        if (dept) currentDept = dept;

        const lowerDept = currentDept.toLowerCase();
        const lowerDesc = desc.toLowerCase();

        let category = 'Milling';
        if (lowerDept.includes('3 roll') || lowerDesc.includes('friction')) {
          category = 'Friction';
        } else if (lowerDept.includes('bead') || lowerDesc.includes('bead')) {
          category = 'Bead';
        }

        let rowSum = 0;
        for (let c = 6; c <= 9; c++) {
          const v = parseFloat(r[c]);
          if (!isNaN(v) && v > 0) rowSum += v;
        }

        if (rowSum > 0 && defectName && !defectName.toLowerCase().includes('defect') && !defectName.toLowerCase().includes('ห้ามลบ')) {
          const key = code || defectName;
          totals[category] += rowSum;
          const targetMap = category === 'Bead' ? beadMap : (category === 'Milling' ? millingMap : frictionMap);
          if (!targetMap[key]) targetMap[key] = { code: key, amount: 0, reason: defectName, source: 'MillingFile' };
          targetMap[key].amount += rowSum;
        }
      });
    }
  }

  console.log(`\nResults for [${monthFolder}] Day ${dayNum}:`);
  console.log('  Totals:', {
    Friction: Number(totals.Friction.toFixed(1)),
    Milling: Number(totals.Milling.toFixed(1)),
    Bead: Number(totals.Bead.toFixed(1)),
    TotalWaste: Number((totals.Friction + totals.Milling + totals.Bead).toFixed(1))
  });
  console.log('  Friction Top 3:', Object.values(frictionMap).sort((a,b)=>b.amount-a.amount).slice(0,3));
  console.log('  Milling Top 3:', Object.values(millingMap).sort((a,b)=>b.amount-a.amount).slice(0,3));
  console.log('  Bead Top 3:', Object.values(beadMap).sort((a,b)=>b.amount-a.amount).slice(0,3));
}

testCombinedWaste('4. APRIL 2026', 1);
testCombinedWaste('4. APRIL 2026', 3);
testCombinedWaste('5. MAY 2026', 3);
