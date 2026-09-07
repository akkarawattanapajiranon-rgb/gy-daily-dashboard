const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const BASE_4ROLL_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\4 Roll\\2026';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function find4Roll2File(dateStr) {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthName = MONTH_NAMES[monthIdx];

  if (fs.existsSync(BASE_4ROLL_DIR)) {
    const subdirs = fs.readdirSync(BASE_4ROLL_DIR);
    const monthSubdir = subdirs.find(d => 
      d.toLowerCase().includes(monthName.toLowerCase()) || 
      d.startsWith(`${parseInt(monthStr, 10)}.`)
    );

    if (monthSubdir) {
      const fullSubPath = path.join(BASE_4ROLL_DIR, monthSubdir);
      if (fs.statSync(fullSubPath).isDirectory()) {
        const files = fs.readdirSync(fullSubPath);
        const matchFile = files.find(f => f.toLowerCase().includes('4 roll 2') && f.endsWith('.xlsx'));
        if (matchFile) return path.join(fullSubPath, matchFile);
      }
    }
  }

  const fallbacks = [
    `T:\\10.30 A.M. Production Meeting\\5 BTA\\4 Roll\\2026\\9. Sep 2026\\4 Roll 2 Productivity Check sheet Sep 2026.xlsx`,
    `C:\\Users\\aa11909\\OneDrive - Goodyear\\4 Roll 2 Productivity Check sheet Sep 2026.xlsx`
  ];

  for (const f of fallbacks) {
    if (fs.existsSync(f)) return f;
  }

  return null;
}

function parse4Roll2Data(dateStr) {
  try {
    const file = find4Roll2File(dateStr);
    if (!file || !fs.existsSync(file)) {
      return { error: `4 Roll 2 file for date ${dateStr} not found`, hasData: false };
    }

    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const dayNum = parseInt(dayStr, 10);

    const wb = XLSX.readFile(file, { cellStubs: true });
    const sheetName = String(dayNum);
    const ws = wb.Sheets[sheetName];

    if (!ws) {
      return { error: `Sheet for day ${dayNum} not found in 4 Roll 2 file`, hasData: false };
    }

    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    let currentShift = 1;

    const shiftItems = {
      1: {},
      2: {},
      3: {}
    };

    const overallCodesMap = {};

    rows.forEach((r) => {
      const rStr = r.join(' ').toLowerCase();
      if (rStr.includes('shift 2') || rStr.includes('shift  2')) currentShift = 2;
      if (rStr.includes('shift 3') || rStr.includes('shift  3')) currentShift = 3;

      const sapCode = String(r[1] || '').trim();
      if (sapCode && sapCode.toUpperCase() !== 'SAP CODE' && !sapCode.toLowerCase().includes('shift') && !sapCode.toLowerCase().includes('check sheet')) {
        const compName = String(r[2] || r[4] || r[6] || r[8] || r[10] || r[12] || '').trim();

        let rowMeters = 0;
        [3, 5, 7, 9, 11, 13].forEach(colIdx => {
          const val = Number(r[colIdx]);
          if (!isNaN(val) && val > 0) rowMeters += val;
        });

        if (rowMeters > 0 || compName || sapCode.startsWith('PL') || sapCode.startsWith('LD') || sapCode.startsWith('PA') || sapCode.startsWith('GF') || sapCode.startsWith('GX')) {
          const codeKey = compName || sapCode;

          // Track in shift specific map
          if (!shiftItems[currentShift][codeKey]) {
            shiftItems[currentShift][codeKey] = {
              sapCode,
              code: codeKey,
              rolls: 0,
              meters: 0
            };
          }
          shiftItems[currentShift][codeKey].rolls++;
          shiftItems[currentShift][codeKey].meters += rowMeters;

          // Track overall map
          if (!overallCodesMap[codeKey]) {
            overallCodesMap[codeKey] = {
              code: codeKey,
              sapCode,
              rolls: 0,
              meters: 0,
              shifts: { 1: 0, 2: 0, 3: 0 }
            };
          }
          overallCodesMap[codeKey].rolls++;
          overallCodesMap[codeKey].meters += rowMeters;
          overallCodesMap[codeKey].shifts[currentShift]++;
        }
      }
    });

    const shifts = {};
    let totalRolls = 0;
    let totalMeters = 0;

    [1, 2, 3].forEach(sNum => {
      const items = Object.values(shiftItems[sNum]).sort((a, b) => b.rolls - a.rolls);
      const sRolls = items.reduce((acc, i) => acc + i.rolls, 0);
      const sMeters = items.reduce((acc, i) => acc + i.meters, 0);
      totalRolls += sRolls;
      totalMeters += sMeters;

      shifts[`shift${sNum}`] = {
        shiftNum: sNum,
        name: `กะ ${sNum} (Shift ${sNum})`,
        rolls: sRolls,
        meters: sMeters,
        items
      };
    });

    const topCodes = Object.values(overallCodesMap)
      .sort((a, b) => b.rolls - a.rolls);

    return {
      date: dateStr,
      day: dayNum,
      file: path.basename(file),
      totalRolls,
      totalMeters,
      shifts,
      topCodes,
      hasData: totalRolls > 0 || totalMeters > 0
    };
  } catch (err) {
    return { error: err.message, hasData: false };
  }
}

module.exports = { parse4Roll2Data };
