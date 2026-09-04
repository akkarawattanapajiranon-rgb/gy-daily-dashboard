const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\9-1Milling WASTE_Sep 2026 .xlsx';
const wb = XLSX.readFile(file);
const sheet = wb.Sheets['By day'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log('--- TESTING AREA CODE MAPPING ON [By day] SHEET FOR DAY 3 ---');

let totals = { Friction: 0, Milling: 0, Bead: 0 };
let counts = { Friction: 0, Milling: 0, Bead: 0 };

rows.forEach((r, rIdx) => {
  if (rIdx < 2) return;
  
  // Check both left side (columns 0..6) and right side (columns 10..15)
  const processEntry = (deptCol, areaCol, weightCol, defectCol, remarkCol, positionCol) => {
    const area = String(areaCol || deptCol || '').trim();
    const weight = parseFloat(weightCol);
    const defect = String(defectCol || '').trim();
    const remark = String(remarkCol || '').trim();
    const position = String(positionCol || '').trim();

    if (isNaN(weight) || weight <= 0) return;

    let cat = 'Friction';
    const lowerArea = area.toLowerCase();
    const lowerPos = position.toLowerCase();
    const lowerRem = remark.toLowerCase();

    if (area === '42' || area === '130' || lowerPos.includes('bead') || lowerRem.includes('bead')) {
      cat = 'Bead';
    } else if (['43', '135', '136', '137', '139', '140'].includes(area) || lowerPos.includes('extruder') || lowerPos.includes('banbury') || lowerRem.includes('milling')) {
      cat = 'Milling';
    } else {
      cat = 'Friction';
    }

    totals[cat] += weight;
    counts[cat]++;
    console.log(`Row ${rIdx}: Area=${area}, Pos="${position}", Weight=${weight}kg -> Category: ${cat} (Defect: ${defect}, Remark: "${remark}")`);
  };

  processEntry(r[0], r[1], r[3], r[4], r[5], r[8]);
  if (r[10] !== undefined) {
    processEntry(r[10], r[11], r[13], r[14], r[15], r[18]);
  }
});

console.log('\n--- BY DAY SHEET SUMMARY ---');
console.log(totals);
console.log('Record Counts:', counts);
