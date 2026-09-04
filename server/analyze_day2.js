const XLSX = require('xlsx');

const fileCheck = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\2026\\09. Fischer check sheet - SEP 2026.xlsx';
const wbCheck = XLSX.readFile(fileCheck);

const wsSapphire = wbCheck.Sheets['SPEC GAUGE TREATMENT SAPPHIRE'];
const sapphireData = XLSX.utils.sheet_to_json(wsSapphire, { header: 1, defval: '' });
const sapphireCodes = new Set();
sapphireData.slice(2).forEach(r => {
  if (r[2]) sapphireCodes.add(String(r[2]).trim().toUpperCase());
  if (r[3]) sapphireCodes.add(String(r[3]).trim().toUpperCase());
});

const ws = wbCheck.Sheets['SEP 2026'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

const day2Rows = data.slice(5).filter(r => r[0] === 46267 || String(r[0]).trim() === '46267' || String(r[0]).includes('2-Sep'));

console.log(`Found ${day2Rows.length} rows for 2-Sep-26 (Expected 81 rows)`);

// Count WBR vs Sapphire and Angle Changes by Shift
const shifts = { 1: { wbr: 0, sapphire: 0, angleChanges: 0, normal: 0, sticky: 0 },
                 2: { wbr: 0, sapphire: 0, angleChanges: 0, normal: 0, sticky: 0 },
                 3: { wbr: 0, sapphire: 0, angleChanges: 0, normal: 0, sticky: 0 } };

let dayNormal = 0, daySticky = 0;

let lastShift = null;
let lastAngle = null;

day2Rows.forEach((r, idx) => {
  const shift = r[1] || 1;
  const tmCode = String(r[5]).trim().toUpperCase();
  const sapCode = String(r[6]).trim().toUpperCase();
  const speedMode = String(r[11]).trim().toUpperCase();
  const angle = r[22];

  const isSapphire = sapphireCodes.has(tmCode) || sapphireCodes.has(sapCode);

  if (shifts[shift]) {
    if (isSapphire) shifts[shift].sapphire++;
    else shifts[shift].wbr++;

    if (speedMode === 'STICKY') {
      shifts[shift].sticky++;
      daySticky++;
    } else {
      shifts[shift].normal++;
      dayNormal++;
    }

    if (lastShift !== shift) {
      lastAngle = angle;
      lastShift = shift;
    } else {
      if (lastAngle !== null && angle !== lastAngle) {
        shifts[shift].angleChanges++;
        lastAngle = angle;
      }
    }
  }
});

console.log('\nShift breakdown for 2-Sep-26:');
console.log('Shift 1:', shifts[1], 'Total:', shifts[1].wbr + shifts[1].sapphire);
console.log('Shift 2:', shifts[2], 'Total:', shifts[2].wbr + shifts[2].sapphire);
console.log('Shift 3:', shifts[3], 'Total:', shifts[3].wbr + shifts[3].sapphire);
console.log(`Total Day Produce: ${day2Rows.length}`);
console.log(`Day Normal %: ${(dayNormal / day2Rows.length * 100).toFixed(2)}%`);
console.log(`Day Sticky %: ${(daySticky / day2Rows.length * 100).toFixed(2)}%`);
