const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { findMonthlyFile } = require('./month_utils');

const ROLL3_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\3 Roll\\2026';

function parse3RollDataFixed(dateStr) {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const monthNum = parseInt(monthStr, 10);
    const dayNum = parseInt(dayStr, 10);

    const files = fs.readdirSync(ROLL3_DIR);
    const file = findMonthlyFile(files, monthNum, yearStr, ['treatment', 'release']);
    if (!file) return { error: 'File not found' };

    const wb = XLSX.readFile(path.join(ROLL3_DIR, file));
    const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes('wind')) || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    if (!ws) return { error: `Sheet ${sheetName} not found` };

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    const codeCounts = {};
    let totalRolls = 0;

    data.forEach((row, i) => {
      if (i < 1) return;

      // Date can be in Col 1 (B) or Col 0 (A)
      const rawDate1 = row[1];
      const rawDate0 = row[0];

      let dDay = null;

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
          // Match formats like "3-sep-26", "3-sep", "3/9/26", "3-9"
          const m = s.match(/^(\d{1,2})[-/]/);
          if (m) {
            return parseInt(m[1], 10);
          }
          const parsed = parseInt(s, 10);
          if (!isNaN(parsed) && parsed > 0 && parsed <= 31) return parsed;
        }
        return null;
      };

      dDay = parseDateVal(rawDate1) || parseDateVal(rawDate0);

      if (dDay === dayNum) {
        const rawCode = String(row[2] || '').trim();
        if (rawCode && rawCode !== '0' && rawCode !== '0.0') {
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
      totalRolls,
      codeBreakdown,
      hasData: totalRolls > 0
    };
  } catch (e) {
    return { error: e.message };
  }
}

console.log('Result for 2026-09-03:', parse3RollDataFixed('2026-09-03'));
