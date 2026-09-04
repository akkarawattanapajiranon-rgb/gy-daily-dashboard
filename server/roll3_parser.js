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

    const codeCounts = {};
    let totalRolls = 0;
    const matchingRows = [];

    data.forEach((row, i) => {
      if (i < 10) return;

      const rawDate = row[0];
      if (rawDate === '' || rawDate === undefined) return;

      let dDay = null;
      if (typeof rawDate === 'number') {
        const d = XLSX.SSF.parse_date_code(rawDate);
        dDay = d.d;
      } else if (typeof rawDate === 'string') {
        const parsed = parseInt(rawDate.trim(), 10);
        if (!isNaN(parsed)) dDay = parsed;
      }

      if (dDay === dayNum) {
        const rawCode = String(row[2] || '').trim();
        // Ignore empty, zero, or blank template rows
        if (rawCode !== '' && rawCode !== '0' && rawCode !== '0.0' && rawCode !== undefined) {
          matchingRows.push(row);
          totalRolls += 1;
          codeCounts[rawCode] = (codeCounts[rawCode] || 0) + 1;
        }
      }
    });

    const codeBreakdown = Object.entries(codeCounts)
      .map(([code, count]) => ({
        code,
        count,
        percentage: totalRolls > 0 ? parseFloat((count / totalRolls * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      date: dateStr,
      day: dayNum,
      target: targetValue,
      totalRolls,
      codeBreakdown,
      hasData: totalRolls > 0 || targetValue !== null
    };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parse3RollData };
