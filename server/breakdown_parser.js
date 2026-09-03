const XLSX = require('xlsx');

const BREAKDOWN_FILE = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown\\Thailand_Breakdown_2026_Rev.1.xlsx';

// Month sheet mapping (actual sheet names from the Excel file)
const MONTH_SHEETS = {
  '01': 'January 2026 Final',
  '02': 'February 2026 FInal',
  '03': 'March 2026 Final',
  '04': 'April 2026 Final',
  '05': 'May 2026 Final ',
  '06': 'June2026 Final',
  '07': 'July 2026Final ',
  '08': 'AUG2026_Final',
  '09': 'SEP2026',
  '10': '',
  '11': '',
  '12': '',
};

/**
 * Parse Breakdown BD% data from the Excel file for a given date (YYYY-MM-DD)
 * Reads BD% directly from Target and Actual rows in the monthly sheet.
 * col[5] = Day 1, col[6] = Day 2, ... col[5 + dayIndex] = Day N
 */
function parseBreakdown(dateStr) {
  try {
    const [year, month, day] = dateStr.split('-');
    const dayIndex = parseInt(day, 10) - 1; // 0-based -> column offset from col[5]

    const wb = XLSX.readFile(BREAKDOWN_FILE);

    // Find matching sheet
    let sheetName = MONTH_SHEETS[month] || '';
    if (!sheetName || !wb.SheetNames.includes(sheetName)) {
      const monthNames = ['January','February','March','April','May','June',
                          'July','August','September','October','November','December'];
      const monthName = monthNames[parseInt(month, 10) - 1];
      sheetName = wb.SheetNames.find(s => s.toLowerCase().includes(monthName.toLowerCase())) || '';
    }

    if (!sheetName) {
      return { error: `ไม่พบข้อมูลสำหรับเดือน ${month} ในไฟล์ Excel` };
    }

    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Filter rows: Thailand | Breakdown | <Area> | BD% | Target/Actual
    const bdRows = data.filter(row =>
      String(row[0]).trim() === 'Thailand' &&
      String(row[1]).trim() === 'Breakdown' &&
      String(row[3]).trim() === 'BD%'
    );

    const colIdx = 5 + dayIndex; // column for the selected day

    const equipments = ['Banbury', 'Extruder', 'Calender', 'Cutting'];
    const result = {};

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
        ? (actualRow[colIdx] === '' ? null : Number(actualRow[colIdx]) || 0)
        : null;

      result[eq] = {
        target_bd_pct: parseFloat((targetVal * 100).toFixed(4)),     // e.g. 0.5826
        actual_bd_pct: actualVal !== null ? parseFloat((actualVal * 100).toFixed(4)) : null,
        hasData: actualVal !== null,
      };
    });

    // Also compute overall (Total row)
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
      ? (totalActual[colIdx] === '' ? null : Number(totalActual[colIdx]) || 0)
      : null;

    result['_total'] = {
      target_bd_pct: parseFloat((ttVal * 100).toFixed(4)),
      actual_bd_pct: taVal !== null ? parseFloat((taVal * 100).toFixed(4)) : null,
      hasData: taVal !== null,
    };

    result['_sheet'] = sheetName;
    result['_date'] = dateStr;

    return result;
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parseBreakdown };
