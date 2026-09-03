const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const FISCHER_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer';
const FISCHER_OEE_FILE = path.join(FISCHER_DIR, 'OEE - 2026 TRACKING - SHEAR FISCHER.xlsx');
const FISCHER_CHECK_DIR = path.join(FISCHER_DIR, '2026');

const MONTH_OEE_SHEETS = {
  '01': 'oee_summary_JAN 26',
  '02': 'oee_summary_FEB 26',
  '03': 'oee_summary_MAR 26',
  '04': 'oee_summary_APR 26',
  '05': 'oee_summary_MAY 26',
  '06': 'oee_summary_JUN 26',
  '07': 'oee_summary_JUL 26',
  '08': 'oee_summary_AUG 26',
  '09': 'oee_summary_SEP 26',
  '10': 'oee_summary_OCT 26',
  '11': 'oee_summary_NOV 26',
  '12': 'oee_summary_DEC 26',
};

const MONTH_NAMES_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * 1. Parse OEE Data from OEE - 2026 TRACKING - SHEAR FISCHER.xlsx
 */
function getOeeData(dateStr) {
  if (!fs.existsSync(FISCHER_OEE_FILE)) {
    return { error: 'OEE File not found' };
  }

  const [year, month, day] = dateStr.split('-');
  const wb = XLSX.readFile(FISCHER_OEE_FILE);

  let sheetName = MONTH_OEE_SHEETS[month];
  if (!sheetName || !wb.SheetNames.includes(sheetName)) {
    const monthNameShort = MONTH_NAMES_SHORT[parseInt(month, 10) - 1];
    sheetName = wb.SheetNames.find(s => s.toLowerCase().includes(monthNameShort.toLowerCase())) || wb.SheetNames[0];
  }

  const ws = wb.Sheets[sheetName];
  if (!ws) return { error: `Sheet ${sheetName} not found` };

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  let matchedRow = null;

  data.forEach((row, i) => {
    if (i === 0) return;
    const rawDate = row[0];
    if (rawDate === '' || rawDate === undefined) return;

    let dStr = '';
    if (typeof rawDate === 'number') {
      const d = XLSX.SSF.parse_date_code(rawDate);
      dStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
    } else if (typeof rawDate === 'string') {
      dStr = rawDate.trim();
    }

    if (dStr === dateStr) {
      matchedRow = row;
    }
  });

  if (!matchedRow) {
    return { hasData: false };
  }

  const target = Number(matchedRow[1]) || 0;
  const sr = Number(matchedRow[2]) || 0;
  const ar = Number(matchedRow[4]) || 0;
  const pr = Number(matchedRow[5]) || 0;
  const qr = Number(matchedRow[6]) || 0;
  const oee1 = Number(matchedRow[7]) || 0;
  const oee2 = Number(matchedRow[8]) || 0;

  const hasData = (sr > 0 || ar > 0 || pr > 0 || oee2 > 0);

  return {
    hasData,
    target_pct: parseFloat((target * 100).toFixed(2)),
    sr_pct: parseFloat((sr * 100).toFixed(2)),
    ar_pct: parseFloat((ar * 100).toFixed(2)),
    pr_pct: parseFloat((pr * 100).toFixed(2)),
    qr_pct: parseFloat((qr * 100).toFixed(2)),
    oee1_pct: parseFloat((oee1 * 100).toFixed(2)),
    oee2_pct: parseFloat((oee2 * 100).toFixed(2)),
  };
}

/**
 * 2. Parse Check Sheet Data & Compute Angle Change, WBR, Sapphire, WBR Normal %, WBR Sticky %
 */
function getChecksheetData(dateStr) {
  if (!fs.existsSync(FISCHER_CHECK_DIR)) {
    return { error: 'Check Sheet Directory not found' };
  }

  const [year, month, day] = dateStr.split('-');
  const monthNum = parseInt(month, 10);
  const monthPrefix = String(monthNum).padStart(2, '0');
  const monthShort = MONTH_NAMES_SHORT[monthNum - 1];

  const files = fs.readdirSync(FISCHER_CHECK_DIR);
  const checkFile = files.find(f => {
    const l = f.toLowerCase();
    return l.includes(monthPrefix) && l.includes('fischer check sheet');
  });

  if (!checkFile) {
    return { error: `Check sheet file for month ${month} not found` };
  }

  const fullPath = path.join(FISCHER_CHECK_DIR, checkFile);
  const wb = XLSX.readFile(fullPath);

  const sapphireCodes = new Set();
  const wsSapphire = wb.Sheets['SPEC GAUGE TREATMENT SAPPHIRE'];
  if (wsSapphire) {
    const sData = XLSX.utils.sheet_to_json(wsSapphire, { header: 1, defval: '' });
    sData.slice(2).forEach(r => {
      if (r[2]) sapphireCodes.add(String(r[2]).trim().toUpperCase());
      if (r[3]) sapphireCodes.add(String(r[3]).trim().toUpperCase());
    });
  }

  let sheetName = wb.SheetNames.find(s => s.toLowerCase().includes(monthShort.toLowerCase())) || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) return { error: `Sheet ${sheetName} not found` };

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const dayRows = [];

  data.slice(5).forEach(row => {
    const rawDate = row[0];
    if (rawDate === '' || rawDate === undefined) return;
    let dStr = '';
    if (typeof rawDate === 'number') {
      const d = XLSX.SSF.parse_date_code(rawDate);
      dStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
    } else if (typeof rawDate === 'string') {
      dStr = rawDate.trim();
    }

    if (dStr === dateStr) {
      const tmCode = String(row[5] || '').trim();
      const sapCode = String(row[6] || '').trim();
      const specCode = String(row[7] || '').trim();
      const speedMode = String(row[11] || '').trim();
      const carQty = Number(row[27]) || 0;

      // Only count rows that have actual production/material data (ignore blank template rows)
      const hasProductionData = (tmCode !== '' || sapCode !== '' || specCode !== '' || speedMode !== '' || carQty > 0);
      if (hasProductionData) {
        dayRows.push(row);
      }
    }
  });

  if (dayRows.length === 0) {
    return { hasData: false };
  }

  const shifts = {
    1: { wbr: 0, sapphire: 0, angleChanges: 0, normal: 0, sticky: 0 },
    2: { wbr: 0, sapphire: 0, angleChanges: 0, normal: 0, sticky: 0 },
    3: { wbr: 0, sapphire: 0, angleChanges: 0, normal: 0, sticky: 0 }
  };

  let totalWbrNormal = 0;
  let totalWbrSticky = 0;
  let lastShift = null;
  let lastAngle = null;

  dayRows.forEach(r => {
    const shift = Number(r[1]) || 1;
    const tmCode = String(r[5]).trim().toUpperCase();
    const sapCode = String(r[6]).trim().toUpperCase();
    const speedMode = String(r[11]).trim().toUpperCase();
    const angle = r[22];

    const isSapphire = sapphireCodes.has(tmCode) || sapphireCodes.has(sapCode);

    if (shifts[shift]) {
      if (isSapphire) {
        shifts[shift].sapphire++;
      } else {
        shifts[shift].wbr++;
        // WBR Speed Mode ratio calculation (excluding Sapphire)
        if (speedMode === 'STICKY') {
          shifts[shift].sticky++;
          totalWbrSticky++;
        } else {
          shifts[shift].normal++;
          totalWbrNormal++;
        }
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

  const totalProduce = dayRows.length;
  const totalWbr = shifts[1].wbr + shifts[2].wbr + shifts[3].wbr;
  const totalSapphire = shifts[1].sapphire + shifts[2].sapphire + shifts[3].sapphire;
  const totalAngleChanges = shifts[1].angleChanges + shifts[2].angleChanges + shifts[3].angleChanges;

  // WBR Speed Mode Ratio (excluding Sapphire)
  const normalPct = totalWbr > 0 ? parseFloat((totalWbrNormal / totalWbr * 100).toFixed(2)) : 0;
  const stickyPct = totalWbr > 0 ? parseFloat((totalWbrSticky / totalWbr * 100).toFixed(2)) : 0;

  return {
    hasData: true,
    totalProduce,
    totalWbr,
    totalSapphire,
    totalAngleChanges,
    totalNormal: totalWbrNormal,
    totalSticky: totalWbrSticky,
    normalPct,
    stickyPct,
    shifts: {
      shift1: { ...shifts[1], total: shifts[1].wbr + shifts[1].sapphire },
      shift2: { ...shifts[2], total: shifts[2].wbr + shifts[2].sapphire },
      shift3: { ...shifts[3], total: shifts[3].wbr + shifts[3].sapphire },
    }
  };
}

function parseFischerData(dateStr) {
  const oee = getOeeData(dateStr);
  const checksheet = getChecksheetData(dateStr);

  return {
    date: dateStr,
    oee,
    checksheet
  };
}

module.exports = { parseFischerData };
