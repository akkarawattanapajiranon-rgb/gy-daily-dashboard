const XLSX = require('xlsx');

const BREAKDOWN_FILE = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown\\Issue log 2026 _ BCA 14AUG2026.xlsx';

const MONTH_SHEETS = {
  '01': 'JAN2026',
  '02': 'FEB2026',
  '03': 'MAR2026',
  '04': 'APR2026',
  '05': 'MAY2026',
  '06': 'JUN2026',
  '07': 'JUL2026',
  '08': 'AUG2026',
  '09': 'SEP2026',
  '10': 'OCT2026',
  '11': 'NOV2026',
  '12': 'DEC2026',
};

/**
 * Parse Breakdown BD% and Top 5 Loss from Issue log 2026 _ BCA 14AUG2026.xlsx
 */
function parseBreakdown(dateStr) {
  try {
    const [year, month, day] = dateStr.split('-');
    const dayIndex = parseInt(day, 10) - 1; // 0-based index for columns starting at col 5

    const wb = XLSX.readFile(BREAKDOWN_FILE);

    // 1. Read BD% from Sheet (SEP2026 / MONTH_SHEETS)
    let sheetName = MONTH_SHEETS[month] || `SEP${year}`;
    if (!wb.SheetNames.includes(sheetName)) {
      sheetName = wb.SheetNames.find(s => s.toUpperCase().includes(`SEP`)) || wb.SheetNames[0];
    }

    const ws = wb.Sheets[sheetName];
    const result = {
      _sheet: sheetName,
      _date: dateStr,
      topLoss: []
    };

    if (ws) {
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const bdRows = data.filter(row =>
        String(row[0]).trim() === 'Thailand' &&
        String(row[1]).trim() === 'Breakdown' &&
        String(row[3]).trim() === 'BD%'
      );

      const colIdx = 5 + dayIndex;
      const equipments = ['Banbury', 'Extruder', 'Calender', 'Cutting'];

      equipments.forEach(eq => {
        const eqNorm = eq.toLowerCase().replace(/\s+/g, '');

        const targetRow = bdRows.find(r =>
          String(r[2]).trim().toLowerCase().replace(/\s+/g, '') === eqNorm &&
          String(r[4]).trim() === 'Target'
        );

        const actualRow = bdRows.find(r =>
          String(r[2]).trim().toLowerCase().replace(/\s+/g, '') === eqNorm &&
          String(r[4]).trim() === 'Actual'
        );

        const targetVal = targetRow ? (Number(targetRow[colIdx]) || 0) : 0;
        const actualVal = actualRow
          ? (actualRow[colIdx] === '' || actualRow[colIdx] === undefined ? null : Number(actualRow[colIdx]) || 0)
          : null;

        result[eq] = {
          target_bd_pct: parseFloat((targetVal * 100).toFixed(4)),
          actual_bd_pct: actualVal !== null ? parseFloat((actualVal * 100).toFixed(4)) : null,
          hasData: actualVal !== null,
        };
      });

      // Total row
      const totalTarget = bdRows.find(r =>
        String(r[2]).trim().toLowerCase().includes('total') &&
        String(r[4]).trim() === 'Target'
      );
      const totalActual = bdRows.find(r =>
        String(r[2]).trim().toLowerCase().includes('total') &&
        String(r[4]).trim() === 'Actual'
      );

      const ttVal = totalTarget ? (Number(totalTarget[colIdx]) || 0) : 0;
      const taVal = totalActual
        ? (totalActual[colIdx] === '' || totalActual[colIdx] === undefined ? null : Number(totalActual[colIdx]) || 0)
        : null;

      result['_total'] = {
        target_bd_pct: parseFloat((ttVal * 100).toFixed(4)),
        actual_bd_pct: taVal !== null ? parseFloat((taVal * 100).toFixed(4)) : null,
        hasData: taVal !== null,
      };
    }

    // 2. Read Top 5 Loss from Daliy seen Sep2 (or matching daily sheet)
    const dailySheetName = wb.SheetNames.find(s => s.toLowerCase().includes('daliy seen') || s.toLowerCase().includes('daily seen')) || 'Daliy seen Sep2';
    const wsDaily = wb.Sheets[dailySheetName];

    if (wsDaily) {
      const dailyData = XLSX.utils.sheet_to_json(wsDaily, { header: 1, defval: '' });
      const issuesForDate = [];

      dailyData.slice(1).forEach(row => {
        if (!row.some(c => c !== '')) return;
        const rawDate = row[0];
        let rowDateStr = '';

        if (typeof rawDate === 'number') {
          const d = XLSX.SSF.parse_date_code(rawDate);
          rowDateStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
        } else if (typeof rawDate === 'string') {
          rowDateStr = rawDate.trim();
        }

        if (rowDateStr === dateStr) {
          const durationMin = Number(row[14]) || 0;
          issuesForDate.push({
            shift: String(row[1]).trim(),
            machine: String(row[2]).trim(),
            zone: String(row[3]).trim(),
            symptom: String(row[4]).trim(),
            cause: String(row[5]).trim(),
            action: String(row[6]).trim(),
            fixType: String(row[7]).trim(),
            durationMin: durationMin,
            jobType: String(row[15]).trim(),
            fixBy: String(row[17]).trim()
          });
        }
      });

      // Sort by durationMin descending & pick Top 5
      issuesForDate.sort((a, b) => b.durationMin - a.durationMin);
      result.topLoss = issuesForDate.slice(0, 5);
    }

    return result;
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parseBreakdown };
