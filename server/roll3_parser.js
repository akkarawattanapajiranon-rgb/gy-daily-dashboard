const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const ROLL3_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\3 Roll\\2026';

const MONTH_NAMES_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUNE', 'JULY', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Parse 3 Roll WINDUP data for a given date (YYYY-MM-DD)
 */
function parse3RollData(dateStr) {
  try {
    if (!fs.existsSync(ROLL3_DIR)) {
      return { error: 'Folder 3 Roll 2026 not found' };
    }

    const [year, month, day] = dateStr.split('-');
    const monthNum = parseInt(month, 10);
    const monthPrefix = String(monthNum); // e.g. "9" or "09"
    const monthShort = MONTH_NAMES_SHORT[monthNum - 1];

    // Find file matching month and treatment release
    const files = fs.readdirSync(ROLL3_DIR);
    const matchedFile = files.find(f => {
      const l = f.toLowerCase();
      return l.includes('treatment release') && (l.includes(monthShort.toLowerCase()) || l.startsWith(`${monthPrefix} `) || l.startsWith(`${monthPrefix}-`));
    });

    if (!matchedFile) {
      return { error: `File 3 Roll for month ${month} not found` };
    }

    const fullPath = path.join(ROLL3_DIR, matchedFile);
    const wb = XLSX.readFile(fullPath);

    // Find WINDUP sheet
    const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes('windup')) || 'WINDUP';
    const ws = wb.Sheets[sheetName];

    if (!ws) {
      return { error: `Sheet WINDUP not found in ${matchedFile}` };
    }

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    const codeCounts = {};
    let totalRolls = 0;

    data.slice(5).forEach(row => {
      const rawDate = row[1]; // Col B (index 1) = CALENDER DATE
      if (rawDate === '' || rawDate === undefined) return;

      let dStr = '';
      if (typeof rawDate === 'number') {
        const d = XLSX.SSF.parse_date_code(rawDate);
        dStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
      } else if (typeof rawDate === 'string') {
        dStr = rawDate.trim();
      }

      if (dStr === dateStr) {
        totalRolls++;
        const code = String(row[2]).trim().toUpperCase() || 'UNKNOWN'; // Col C (index 2) = LOCAL TREATMENT CODE
        codeCounts[code] = (codeCounts[code] || 0) + 1;
      }
    });

    // Format code breakdown as array sorted by count desc
    const codeBreakdown = Object.entries(codeCounts).map(([code, count]) => ({
      code,
      count,
      pct: totalRolls > 0 ? parseFloat((count / totalRolls * 100).toFixed(1)) : 0
    })).sort((a, b) => b.count - a.count);

    return {
      date: dateStr,
      hasData: totalRolls > 0,
      totalRolls,
      codeBreakdown,
      file: matchedFile,
      sheet: sheetName
    };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parse3RollData };
