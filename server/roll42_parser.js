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
      const cartNo = String(r[16] || '').trim();

      if (sapCode && sapCode.toUpperCase() !== 'SAP CODE' && !sapCode.toLowerCase().includes('shift') && !sapCode.toLowerCase().includes('check sheet')) {
        // Dual Liner rows (SAP=LD*) must have a Cart No to count.
        // PLY rows (SAP=PL*) and Gumstrip rows (SAP=GF*/GX*) do NOT have Cart No — count from Meter columns.
        const sapUp = sapCode.toUpperCase();
        const isDualLiner = sapUp.startsWith('LD');
        if (isDualLiner && !cartNo) return;

        const processCol = (compName, rawMeters, defaultUnit, calcRatioFunc) => {
          if (!compName && rawMeters <= 0) return;
          const codeKey = compName || sapCode;
          let unit = defaultUnit;
          let qty = 1;

          if (typeof calcRatioFunc === 'function') {
            const res = calcRatioFunc(codeKey, rawMeters);
            qty = res.qty;
            unit = res.unit;
          }

          // Add to Shift map
          if (!shiftItems[currentShift][codeKey]) {
            shiftItems[currentShift][codeKey] = {
              sapCode,
              code: codeKey,
              qty: 0,
              meters: 0,
              unit
            };
          }
          shiftItems[currentShift][codeKey].qty += qty;
          shiftItems[currentShift][codeKey].meters += rawMeters;

          // Add to Overall map
          if (!overallCodesMap[codeKey]) {
            overallCodesMap[codeKey] = {
              code: codeKey,
              sapCode,
              qty: 0,
              meters: 0,
              unit,
              shifts: { 1: 0, 2: 0, 3: 0 }
            };
          }
          overallCodesMap[codeKey].qty += qty;
          overallCodesMap[codeKey].meters += rawMeters;
          overallCodesMap[codeKey].shifts[currentShift] += qty;
        };

        // 1. Dual Liner (Col 2, Meter Col 3) -> 250m = 1 คัน
        if ((r[2] !== undefined && r[2] !== '') || Number(r[3]) > 0) {
          const m = Number(r[3]) || 0;
          processCol(String(r[2] || '').trim(), m, 'คัน', (_, meters) => ({
            qty: meters > 0 ? Math.round(meters / 250) || 1 : 1,
            unit: 'คัน'
          }));
        }

        // 2. VMI Ply 1 (Col 4, Meter Col 5) -> 250m = 1 คัน
        if ((r[4] !== undefined && r[4] !== '') || Number(r[5]) > 0) {
          const m = Number(r[5]) || 0;
          processCol(String(r[4] || '').trim(), m, 'คัน', (_, meters) => ({
            qty: meters > 0 ? Math.round(meters / 250) || 1 : 1,
            unit: 'คัน'
          }));
        }

        // 3. VMI Ply 2 (Col 6, Meter Col 7) -> 250m = 1 คัน
        if ((r[6] !== undefined && r[6] !== '') || Number(r[7]) > 0) {
          const m = Number(r[7]) || 0;
          processCol(String(r[6] || '').trim(), m, 'คัน', (_, meters) => ({
            qty: meters > 0 ? Math.round(meters / 250) || 1 : 1,
            unit: 'คัน'
          }));
        }

        // 4. R2.5 Ply 1 (Col 8, Meter Col 9) -> 35m = 1 ม้วน
        if ((r[8] !== undefined && r[8] !== '') || Number(r[9]) > 0) {
          const m = Number(r[9]) || 0;
          processCol(String(r[8] || '').trim(), m, 'ม้วน', (_, meters) => ({
            qty: meters > 0 ? Math.round(meters / 35) || 1 : 1,
            unit: 'ม้วน'
          }));
        }

        // 5. R2.5 Ply 2 (Col 10, Meter Col 11) -> 35m = 1 ม้วน
        if ((r[10] !== undefined && r[10] !== '') || Number(r[11]) > 0) {
          const m = Number(r[11]) || 0;
          processCol(String(r[10] || '').trim(), m, 'ม้วน', (_, meters) => ({
            qty: meters > 0 ? Math.round(meters / 35) || 1 : 1,
            unit: 'ม้วน'
          }));
        }

        // 6. Gumstrip Roll (Col 12, Meter Col 13) -> B1443/B1578 = 110m, F4111 = 200m
        if ((r[12] !== undefined && r[12] !== '') || Number(r[13]) > 0) {
          const m = Number(r[13]) || 0;
          const gumCode = String(r[12] || '').trim();
          processCol(gumCode, m, 'ม้วน', (code, meters) => {
            const isF4111 = code.toUpperCase().includes('F4111') || sapCode.toUpperCase().includes('GF00013') || sapCode.toUpperCase().includes('GX00452');
            const ratio = isF4111 ? 200 : 110;
            return {
              qty: meters > 0 ? Math.round(meters / ratio) || 1 : 1,
              unit: 'ม้วน'
            };
          });
        }
      }
    });

    const shifts = {};
    let totalQty = 0;
    let totalMeters = 0;

    [1, 2, 3].forEach(sNum => {
      const items = Object.values(shiftItems[sNum]).sort((a, b) => b.qty - a.qty);
      const sQty = items.reduce((acc, i) => acc + i.qty, 0);
      const sMeters = items.reduce((acc, i) => acc + i.meters, 0);
      totalQty += sQty;
      totalMeters += sMeters;

      shifts[`shift${sNum}`] = {
        shiftNum: sNum,
        name: `กะ ${sNum} (Shift ${sNum})`,
        qty: sQty,
        meters: sMeters,
        items
      };
    });

    const topCodes = Object.values(overallCodesMap)
      .sort((a, b) => b.qty - a.qty);

    return {
      date: dateStr,
      day: dayNum,
      file: path.basename(file),
      totalQty,
      totalRolls: totalQty,
      totalMeters,
      shifts,
      topCodes,
      hasData: totalQty > 0 || totalMeters > 0
    };
  } catch (err) {
    return { error: err.message, hasData: false };
  }
}

module.exports = { parse4Roll2Data };
