const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { findMonthlyFile, findMonthlySheet, matchesMonth, MONTH_ALIASES } = require('./month_utils');

const QUAD_DIR = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad";
const QUAD_BOOKING_DIR = path.join(QUAD_DIR, "Booker Sheet", "2026");

function getOeeFile(monthNum, yearStr) {
  if (!fs.existsSync(QUAD_DIR)) return null;
  const files = fs.readdirSync(QUAD_DIR);
  const file = findMonthlyFile(files, monthNum, yearStr, ['oee']);
  return file ? path.join(QUAD_DIR, file) : null;
}

function getBookingFile(monthNum, yearStr) {
  if (!fs.existsSync(QUAD_BOOKING_DIR)) return null;
  const files = fs.readdirSync(QUAD_BOOKING_DIR);
  const file = findMonthlyFile(files, monthNum, yearStr, ['booking']);
  return file ? path.join(QUAD_BOOKING_DIR, file) : null;
}

function getQuadOee(dateStr) {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const monthNum = parseInt(monthStr, 10);
  const dayNum = parseInt(dayStr, 10);

  const file = getOeeFile(monthNum, yearStr);
  if (!file) return { error: `Quad OEE file for month ${monthStr} not found` };

  const wb = XLSX.readFile(file);
  
  // Find official Quad sheet for selected month and year
  const yy = yearStr.slice(-2);
  const targetYearNum = parseInt(yearStr, 10);

  // Filter sheets for selected month, strictly excluding other years (e.g. 2025)
  const candidateSheets = wb.SheetNames.filter(s => {
    if (!matchesMonth(s, monthNum)) return false;
    const sLower = s.toLowerCase();
    if (sLower.includes('2025') || sLower.includes(',25') || sLower.includes(' 25')) return false;
    return true;
  });

  const officialSheetName = candidateSheets.find(s => {
    const l = s.toLowerCase();
    return (l.includes(yearStr) || l.includes(yy)) && l.includes('quad');
  }) || candidateSheets.find(s => s.toLowerCase().includes('quad')) || candidateSheets[0];

  if (!officialSheetName || !wb.Sheets[officialSheetName]) {
    return { hasData: false };
  }

  const ws = wb.Sheets[officialSheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const titleRow = data[0] ? String(data[0][0] || '').toLowerCase() : '';
  if (titleRow.includes('2025') && targetYearNum === 2026) {
    return { hasData: false };
  }

  const dayRow = data.slice(2).find(r => parseInt(r[0], 10) === dayNum);
  if (!dayRow) return { hasData: false };

  const sr = Number(dayRow[1]) || 0;
  const ar = Number(dayRow[3]) || 0;
  const pr = Number(dayRow[4]) || 0;
  const qr = Number(dayRow[5]) || 0;
  
  let oee1 = 0;
  let oee2 = 0;
  if (dayRow[8] !== '' && dayRow[8] !== undefined && !isNaN(Number(dayRow[8]))) {
    oee1 = Number(dayRow[7]) || 0;
    oee2 = Number(dayRow[8]) || 0;
  } else {
    oee1 = Number(dayRow[6]) || 0;
    oee2 = Number(dayRow[7]) || 0;
  }

  let bdVal = dayRow[26] !== '' ? Number(dayRow[26]) : Number(dayRow[16]);
  if (isNaN(bdVal)) bdVal = 0;
  if (bdVal > 1) bdVal = bdVal / 100;

  const hasData = (sr > 0 || ar > 0 || pr > 0 || oee2 > 0);

  return {
    hasData,
    sr_pct: parseFloat((sr * 100).toFixed(2)),
    ar_pct: parseFloat((ar * 100).toFixed(2)),
    pr_pct: parseFloat((pr * 100).toFixed(2)),
    qr_pct: parseFloat((qr * 100).toFixed(2)),
    oee1_pct: parseFloat((oee1 * 100).toFixed(2)),
    oee2_pct: parseFloat((oee2 * 100).toFixed(2)),
    bd_pct: parseFloat((bdVal * 100).toFixed(2)),
  };
}

function getQuadOutput(dateStr) {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const monthNum = parseInt(monthStr, 10);
  const dayNum = parseInt(dayStr, 10);

  const file = getBookingFile(monthNum, yearStr);
  if (!file) return { error: `Quad Booking file for month ${monthStr} not found` };

  const wb = XLSX.readFile(file);
  const sheetName = String(dayNum);
  const ws = wb.Sheets[sheetName];
  if (!ws) return { hasData: false };

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const shifts = {
    1: { name: 'Shift 1 (กะ 1)', items: [], totalQty: 0 },
    2: { name: 'Shift 2 (กะ 2)', items: [], totalQty: 0 },
    3: { name: 'Shift 3 (กะ 3)', items: [], totalQty: 0 }
  };

  const shiftRanges = [
    { shift: 1, start: 7, end: 40 },
    { shift: 2, start: 53, end: 87 },
    { shift: 3, start: 99, end: 135 }
  ];

  const codeCounts = {};

  shiftRanges.forEach(sr => {
    const rows = data.slice(sr.start, sr.end);
    let currentPartId = '';
    rows.forEach(r => {
      const rawPartId = String(r[0] || '').trim();
      const upperPart = rawPartId.toUpperCase();
      if (!rawPartId && !r[1] && !r[2] && !r[3]) return;
      if (upperPart.startsWith('TOTAL') || upperPart.includes('หมายเหตุ') || upperPart.startsWith('EXTRUDER') || upperPart.includes('BOOKER')) {
        return;
      }

      if (rawPartId) {
        currentPartId = rawPartId;
      }
      const partId = rawPartId;
      const effectivePartId = rawPartId || currentPartId;

      const code1 = String(r[1] || '').trim();
      const code2 = String(r[2] || '').trim();
      const code3 = String(r[3] || '').trim();
      const code = code1 || code2 || code3;

      const checkCode = String(code || '').trim().toUpperCase();
      const checkPart = String(effectivePartId || '').trim().toUpperCase();
      const qtyTarget = Number(r[4]) || 0;

      let qtyProduced = 0;
      let qtySapphire = (r[6] !== '' && !isNaN(Number(r[6]))) ? Number(r[6]) : 0;

      if (!checkPart.startsWith('TL') && (checkPart.startsWith('SC') || checkPart.startsWith('SW') || checkPart.startsWith('TR') || checkCode.startsWith('B') || qtyTarget > 20)) {
        // SC / SW / Tread / Direct piece items: do NOT divide, use actual raw quantity from Column 5 (r[5]) or Sapphire
        qtyProduced = Number(r[5]) || 0;
        if (!qtyProduced && qtySapphire > 0) {
          qtyProduced = qtySapphire;
          qtySapphire = 0;
        }
      } else {
        // TL spool components: divide by 82 m = 1 spool/roll
        let divisor = 1;
        if (checkPart.startsWith('TL') || checkCode.startsWith('TL')) divisor = 82;

        const rawVal = Number(r[5]) || 0;
        if (rawVal > 0) {
          qtyProduced = divisor > 1 ? Math.round(rawVal / divisor) : rawVal;
        } else if (qtySapphire > 0) {
          qtyProduced = qtySapphire;
          qtySapphire = 0;
        } else {
          const spoolCols = r.slice(7, 17);
          const filledSpools = spoolCols.filter(val => val !== '' && val !== null && val !== undefined && !isNaN(Number(val)) && Number(val) > 0);
          qtyProduced = filledSpools.length;
        }
      }

      const totalItemQty = qtyProduced + qtySapphire;

      if ((code || partId) && totalItemQty > 0) {
        shifts[sr.shift].items.push({
          partId,
          code1,
          code2,
          code,
          qtyTarget,
          qtyProduced,
          qtySapphire,
          totalQty: totalItemQty
        });

        shifts[sr.shift].totalQty += totalItemQty;

        if (code) {
          codeCounts[code] = (codeCounts[code] || 0) + totalItemQty;
        }
      }
    });
  });

  const grandTotal = shifts[1].totalQty + shifts[2].totalQty + shifts[3].totalQty;

  const codeBreakdown = Object.entries(codeCounts)
    .map(([code, count]) => ({
      code,
      count,
      percentage: grandTotal > 0 ? parseFloat((count / grandTotal * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const hasOutputData = grandTotal > 0 || (shifts[1].items.length > 0 || shifts[2].items.length > 0 || shifts[3].items.length > 0);

  return {
    hasData: hasOutputData,
    day: dayNum,
    grandTotal,
    codeBreakdown,
    shifts
  };
}

function parseQuadData(dateStr) {
  const oee = getQuadOee(dateStr);
  const output = getQuadOutput(dateStr);

  return {
    date: dateStr,
    oee,
    output
  };
}

module.exports = { parseQuadData };
