const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { findMonthlyFile } = require('./month_utils');

const ROLL3_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\3 Roll\\2026';

function getRoll3File(monthNum, yearStr) {
  if (!fs.existsSync(ROLL3_DIR)) return null;
  const files = fs.readdirSync(ROLL3_DIR);
  const file = findMonthlyFile(files, monthNum, yearStr, ['treatment', 'release']);
  return file ? path.join(ROLL3_DIR, file) : null;
}

function parse3RollData(dateStr) {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const monthNum = parseInt(monthStr, 10);
    const dayNum = parseInt(dayStr, 10);

    const file = getRoll3File(monthNum, yearStr);
    if (!file) {
      return { error: `3 Roll file for month ${monthStr} not found` };
    }

    const wb = XLSX.readFile(file);

    // Dynamically match WIND / WINDUP sheet name
    const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes('wind')) || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    if (!ws) {
      return { error: `Sheet ${sheetName} not found in ${path.basename(file)}` };
    }

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    const targetRow = data.find(row => {
      const col0 = String(row[0]).trim();
      const col1 = String(row[1]).trim();
      return col0 === '3' && col1.includes('CALENDER 3 ROLL');
    });

    let targetValue = null;
    if (targetRow) {
      const targetColIdx = 2 + (dayNum - 1);
      const val = targetRow[targetColIdx];
      if (val !== '' && val !== undefined && !isNaN(val)) {
        targetValue = Number(val);
      }
    }

    const releaseCodeCounts = {};
    const holdCodeCounts = {};
    const pendingCodeCounts = {};
    const allCodeCounts = {};

    let totalRelease = 0;
    let totalHold = 0;
    let totalPending = 0;
    let totalScheduled = 0;

    data.forEach((row, i) => {
      if (i < 1) return;

      const parseDateVal = (val) => {
        if (val === '' || val === undefined) return null;
        if (typeof val === 'number') {
          try {
            const d = XLSX.SSF.parse_date_code(val);
            return d ? d.d : null;
          } catch (e) { return null; }
        }
        if (typeof val === 'string') {
          const s = val.trim().toLowerCase();
          const m = s.match(/^(\d{1,2})[-/]/);
          if (m) {
            return parseInt(m[1], 10);
          }
          const parsed = parseInt(s, 10);
          if (!isNaN(parsed) && parsed > 0 && parsed <= 31) return parsed;
        }
        return null;
      };

      const dDay = parseDateVal(row[1]) || parseDateVal(row[0]);

      if (dDay === dayNum) {
        const rawCode = String(row[2] || '').trim();
        if (rawCode && rawCode !== '0' && rawCode !== '0.0') {
          totalScheduled += 1;
          allCodeCounts[rawCode] = (allCodeCounts[rawCode] || 0) + 1;

          const statusAD = String(row[29] || '').trim().toUpperCase();
          if (statusAD.includes('RELEASE')) {
            totalRelease += 1;
            releaseCodeCounts[rawCode] = (releaseCodeCounts[rawCode] || 0) + 1;
          } else if (statusAD.includes('HOLD')) {
            totalHold += 1;
            holdCodeCounts[rawCode] = (holdCodeCounts[rawCode] || 0) + 1;
          } else {
            totalPending += 1;
            pendingCodeCounts[rawCode] = (pendingCodeCounts[rawCode] || 0) + 1;
          }
        }
      }
    });

    const hasStatus = totalRelease > 0 || totalHold > 0;
    const effectiveTotal = hasStatus ? totalRelease : totalScheduled;
    const effectiveReleaseCounts = hasStatus ? releaseCodeCounts : allCodeCounts;

    const codeBreakdown = Object.entries(effectiveReleaseCounts)
      .map(([code, count]) => ({
        code,
        count,
        percentage: effectiveTotal > 0 ? parseFloat((count / effectiveTotal * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const holdBreakdown = Object.entries(holdCodeCounts)
      .map(([code, count]) => ({
        code,
        count,
        percentage: totalHold > 0 ? parseFloat((count / totalHold * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      date: dateStr,
      day: dayNum,
      sheet: sheetName,
      file: path.basename(file),
      target: targetValue,
      totalRolls: effectiveTotal,
      totalRelease,
      totalHold,
      totalPending,
      totalScheduled,
      codeBreakdown,
      holdBreakdown,
      hasData: totalScheduled > 0 || targetValue !== null
    };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parse3RollData };
