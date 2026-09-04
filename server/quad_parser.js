const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { findMonthlyFile, findMonthlySheet } = require('./month_utils');

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
  
  // Find matching 2026 Quad sheet for selected month
  const sheetName = findMonthlySheet(wb.SheetNames, monthNum, yearStr, ['quad']) ||
                    wb.SheetNames.find(s => s.toLowerCase().includes('quad')) ||
                    wb.SheetNames[0];

  const ws = wb.Sheets[sheetName];
  if (!ws) return { error: `Sheet ${sheetName} not found` };

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  let dayRow = null;
  data.slice(2).forEach(r => {
    const d = parseInt(r[0], 10);
    if (d === dayNum) {
      dayRow = r;
    }
  });

  if (!dayRow) return { hasData: false };

  const sr = Number(dayRow[1]) || 0;
  const ar = Number(dayRow[3]) || 0;
  const pr = Number(dayRow[4]) || 0;
  const qr = Number(dayRow[5]) || 0;
  const oee1 = Number(dayRow[7]) || 0;
  const oee2 = Number(dayRow[8]) || 0;

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
    { shift: 1, start: 18, end: 43 },
    { shift: 2, start: 60, end: 90 },
    { shift: 3, start: 105, end: 135 }
  ];

  const codeCounts = {};

  shiftRanges.forEach(sr => {
    const rows = data.slice(sr.start, sr.end);
    rows.forEach(r => {
      const partId = String(r[0]).trim();
      const upperPart = partId.toUpperCase();
      if (upperPart.startsWith('TOTAL') || upperPart.includes('หมายเหตุ') || upperPart.startsWith('EXTRUDER') || upperPart.includes('BOOKER')) {
        return;
      }

      const code1 = String(r[1]).trim();
      const code2 = String(r[3]).trim();
      const code = code1 || code2;

      const qtyTarget = Number(r[4]) || 0;
      const qtyProducedRaw = Number(r[5]) || 0;
      const qtySapphireRaw = Number(r[7]) || 0;
      const rawTotalItemQty = qtyProducedRaw + qtySapphireRaw;

      const checkStr = (partId || code || '').trim().toUpperCase();
      let divisor = 1;
      if (checkStr.startsWith('TL')) {
        divisor = 82;
      } else if (checkStr.startsWith('SW')) {
        divisor = 120;
      }

      const totalItemQty = divisor > 1 ? Math.round(rawTotalItemQty / divisor) : rawTotalItemQty;
      const qtyProduced = divisor > 1 ? Math.round(qtyProducedRaw / divisor) : qtyProducedRaw;
      const qtySapphire = divisor > 1 ? Math.round(qtySapphireRaw / divisor) : qtySapphireRaw;

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

  return {
    hasData: true,
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
