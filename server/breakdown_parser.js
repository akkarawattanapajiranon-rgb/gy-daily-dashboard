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
 * Parse Breakdown data from the Excel file for a given date (YYYY-MM-DD)
 * Returns { equipment: { target_bd_pct, actual_bd_pct, fail_hr_target, fail_hr_actual, sch_hr } }
 */
function parseBreakdown(dateStr) {
  try {
    const [year, month, day] = dateStr.split('-');
    const dayIndex = parseInt(day, 10) - 1; // 0-based, column offset 5 = Day 1

    const wb = XLSX.readFile(BREAKDOWN_FILE);
    
    // Find matching sheet for the month
    const monthKey = month;
    let sheetName = MONTH_SHEETS[monthKey];
    
    // Try fuzzy match if exact not found
    if (!sheetName || !wb.SheetNames.includes(sheetName)) {
      const monthNum = parseInt(month, 10);
      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const monthName = monthNames[monthNum - 1];
      sheetName = wb.SheetNames.find(s => s.toLowerCase().includes(monthName.toLowerCase()));
    }

    if (!sheetName) {
      return { error: 'Sheet not found for month ' + month };
    }

    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Filter Thailand Breakdown rows
    const bdRows = data.filter(row =>
      String(row[0]).trim() === 'Thailand' &&
      String(row[1]).trim() === 'Breakdown'
    );

    // Build result
    // row[2] = Area (Banbury, Extruder, Tire Room, Curing, Calender, Cutting)
    // row[3] = "Fail hour" or "Schedule hour" or "BD%"
    // row[4] = "Target" or "Actual"
    // row[5+dayIndex] = value for that day

    const result = {};
    const equipments = ['Banbury', 'Extruder', 'Tire Room', 'Curing', 'Calender', 'Cutting'];
    
    equipments.forEach(eq => {
      const eqNorm = eq.toLowerCase().replace(/\s/g, '');
      
      // Fail hour Target
      const fhTarget = bdRows.find(r =>
        String(r[2]).trim().toLowerCase().replace(/\s/g, '') === eqNorm &&
        String(r[3]).trim() === 'Fail hour' &&
        String(r[4]).trim() === 'Target'
      );
      
      // Fail hour Actual
      const fhActual = bdRows.find(r =>
        String(r[2]).trim().toLowerCase().replace(/\s/g, '') === eqNorm &&
        String(r[3]).trim() === 'Fail hour' &&
        String(r[4]).trim() === 'Actual'
      );
      
      // Schedule hour Target
      const schTarget = bdRows.find(r =>
        String(r[2]).trim().toLowerCase().replace(/\s/g, '') === eqNorm &&
        String(r[3]).trim() === 'Schedule hour' &&
        String(r[4]).trim() === 'Target'
      );

      // Schedule hour Actual
      const schActual = bdRows.find(r =>
        String(r[2]).trim().toLowerCase().replace(/\s/g, '') === eqNorm &&
        String(r[3]).trim() === 'Schedule hour' &&
        String(r[4]).trim() === 'Actual'
      );

      const colIdx = 5 + dayIndex;
      const fhT = fhTarget ? (Number(fhTarget[colIdx]) || 0) : 0;
      const fhA = fhActual ? (Number(fhActual[colIdx]) || 0) : 0;
      const schT = schTarget ? (Number(schTarget[colIdx]) || 1) : 1;
      const schA = schActual ? (Number(schActual[colIdx]) || schT) : schT;

      // BD% = Fail hour / Schedule hour * 100
      const targetBdPct = schT > 0 ? (fhT / schT * 100) : 0;
      const actualBdPct = schA > 0 ? (fhA / schA * 100) : 0;

      result[eq] = {
        fail_hr_target: parseFloat(fhT.toFixed(2)),
        fail_hr_actual: parseFloat(fhA.toFixed(2)),
        sch_hr: parseFloat(schT.toFixed(2)),
        target_bd_pct: parseFloat(targetBdPct.toFixed(4)),
        actual_bd_pct: parseFloat(actualBdPct.toFixed(4)),
      };
    });

    return result;
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parseBreakdown };
