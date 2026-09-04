const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\1Miling WASTE_2019\\Milling WASTE_2026\\9-1Milling WASTE_Sep 2026 .xlsx';
const wb = XLSX.readFile(file);

function testDayParse(targetDay) {
  let totals = { Friction: 0, Milling: 0, Bead: 0 };
  let recordCount = 0;

  // Process N, P, V, A, G, RT27 sheets
  const frictionSheets = ['N', 'P', 'V', 'A', 'G', 'RT27'];
  frictionSheets.forEach(sName => {
    const sheet = wb.Sheets[sName];
    if (!sheet) return;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    rows.forEach((r, rIdx) => {
      if (rIdx < 3) return;
      const recDay = parseInt(r[1], 10);
      if (recDay === targetDay) {
        const weight = parseFloat(r[5]) || 0;
        const areaCode = String(r[3] || r[2] || '').trim();
        const defectCode = String(r[6] || '').trim();
        const remark = String(r[7] || '').trim();

        if (weight > 0) {
          recordCount++;
          let category = 'Friction';
          if (sName === 'A' || sName === 'G' || areaCode === '130' || areaCode === '42' || remark.toLowerCase().includes('bead')) {
            category = 'Bead';
          } else if (areaCode === '135' || areaCode === '136' || areaCode === '137' || areaCode === '139' || areaCode === '140') {
            category = 'Milling';
          }

          totals[category] += weight;
        }
      }
    });
  });

  // Process MillingWaste sheet
  const mWSheet = wb.Sheets['MillingWaste'] || wb.Sheets['MillingWaste(M)'];
  if (mWSheet) {
    const rows = XLSX.utils.sheet_to_json(mWSheet, { header: 1, defval: '' });
    rows.forEach((r, rIdx) => {
      if (rIdx < 2) return;
      const recDay = parseInt(r[1], 10);
      if (recDay === targetDay) {
        const weight = parseFloat(r[5]) || 0;
        if (weight > 0) {
          recordCount++;
          totals.Milling += weight;
        }
      }
    });
  }

  console.log(`\n================ DAY ${targetDay} EXACT RECONCILED TOTALS ================`);
  console.log('Record Count:', recordCount);
  console.log('Totals:', {
    Milling: Number(totals.Milling.toFixed(2)),
    Friction: Number(totals.Friction.toFixed(2)),
    Bead: Number(totals.Bead.toFixed(2)),
    TotalWaste: Number((totals.Milling + totals.Friction + totals.Bead).toFixed(2))
  });
}

testDayParse(1);
testDayParse(2);
testDayParse(3);
