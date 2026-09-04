const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const BREAKDOWN_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown';

function getCanonicalMachineName(raw) {
  let s = String(raw).trim();
  if (!s) return 'Unknown';
  
  let norm = s.replace(/#/g, '').replace(/\s+/g, ' ').toLowerCase();

  if (norm.match(/^(mix|mixer)\s*1$/)) return 'Mixer 1';
  if (norm.match(/^(mix|mixer)\s*2$/)) return 'Mixer 2';
  if (norm.match(/^hot\s*apex\s*2$/)) return 'Hot Apex 2';
  if (norm.match(/^bead\s*flapping\s*1$/) || norm === 'bead flap') return 'Bead Flapping 1';
  if (norm.match(/^4\s*roll\s*1$/)) return '4 Roll 1';
  if (norm.match(/^4\s*roll\s*2$/)) return '4 Roll 2';
  if (norm.match(/^3\s*roll$/)) return '3 Roll';
  if (norm.match(/^tuber\s*6"?x8"?$/)) return 'Tuber 6"x8"';
  if (norm.match(/^auto\s*pigment$/)) return 'Auto Pigment';
  if (norm.match(/^loading\s*carbon\s*1$/)) return 'Loading Carbon 1';

  return s.replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getBreakdownFilePath(yearStr, monthNum) {
  if (!fs.existsSync(BREAKDOWN_DIR)) return null;
  const files = fs.readdirSync(BREAKDOWN_DIR).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
  const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const mName = monthNames[monthNum - 1];
  
  const matched = files.find(f => {
    const l = f.toLowerCase();
    return (l.includes(mName) || l.includes(String(monthNum).padStart(2,'0'))) && l.includes(yearStr);
  });

  if (matched) return path.join(BREAKDOWN_DIR, matched);
  const fallback = files.find(f => f.toLowerCase().includes('issue log'));
  return fallback ? path.join(BREAKDOWN_DIR, fallback) : (files.length > 0 ? path.join(BREAKDOWN_DIR, files[0]) : null);
}

/**
 * Parse Breakdown BD% and Top 5 Loss from Engineering Breakdown directory
 */
function parseBreakdown(dateStr) {
  try {
    const [year, month, day] = dateStr.split('-');
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);

    const file = getBreakdownFilePath(year, monthNum);
    if (!file || !fs.existsSync(file)) {
      return { error: `Breakdown file not found for ${dateStr}` };
    }

    const wb = XLSX.readFile(file);
    const monthNamesUpper = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const mNameUpper = monthNamesUpper[monthNum - 1];

    // 1. Find BD% KPI sheet (e.g., SEP2026)
    const kpiSheetName = wb.SheetNames.find(s => {
      const u = s.toUpperCase();
      return u.includes(mNameUpper + year) || (u.includes(mNameUpper) && !u.includes('DALIY') && !u.includes('DAILY') && !u.includes('SUMMARY') && !u.includes('ACTION') && !u.includes('TRACK'));
    }) || wb.SheetNames[0];

    const result = {
      _file: path.basename(file),
      _sheet: kpiSheetName,
      _date: dateStr,
      topLoss: []
    };

    const ws = wb.Sheets[kpiSheetName];
    if (ws) {
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const bdRows = data.filter(row =>
        String(row[0]).trim() === 'Thailand' &&
        String(row[1]).trim() === 'Breakdown' &&
        String(row[3]).trim() === 'BD%'
      );

      const colIdx = 4 + dayNum;
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
        const actualVal = actualRow && actualRow[colIdx] !== '' && actualRow[colIdx] !== undefined
          ? (Number(actualRow[colIdx]) || 0)
          : null;

        result[eq] = {
          target_bd_pct: parseFloat((targetVal * 100).toFixed(4)),
          actual_bd_pct: actualVal !== null ? parseFloat((actualVal * 100).toFixed(4)) : null,
          hasData: actualVal !== null
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
      const taVal = totalActual && totalActual[colIdx] !== '' && totalActual[colIdx] !== undefined
        ? (Number(totalActual[colIdx]) || 0)
        : null;

      result['_total'] = {
        target_bd_pct: parseFloat((ttVal * 100).toFixed(4)),
        actual_bd_pct: taVal !== null ? parseFloat((taVal * 100).toFixed(4)) : null,
        hasData: taVal !== null
      };
    }

    // 2. Read Top 5 Loss from Daily Seen sheet (e.g. Daliy seen Sep2)
    const dailySheetName = wb.SheetNames.find(s => {
      const u = s.toUpperCase();
      return (u.includes('DALIY SEEN') || u.includes('DAILY SEEN')) && u.includes(mNameUpper);
    }) || wb.SheetNames.find(s => s.toUpperCase().includes('DALIY SEEN') || s.toUpperCase().includes('DAILY SEEN'));

    if (dailySheetName) {
      const wsDaily = wb.Sheets[dailySheetName];
      const dailyData = XLSX.utils.sheet_to_json(wsDaily, { header: 1, defval: '' });
      const machineMap = {};

      dailyData.slice(1).forEach(row => {
        if (!row.some(c => c !== '')) return;
        const rawDate = row[0];
        let rowDateStr = '';

        if (typeof rawDate === 'number') {
          const d = XLSX.SSF.parse_date_code(rawDate);
          if (d) rowDateStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
        } else if (typeof rawDate === 'string') {
          rowDateStr = rawDate.trim();
        }

        if (rowDateStr === dateStr) {
          const rawMachine = String(row[2] || '').trim();
          if (!rawMachine) return;

          const canonicalMachine = getCanonicalMachineName(rawMachine);
          const durationMin = Number(row[14]) || Number(row[10]) || Number(row[11]) || Number(row[12]) || 0;

          if (!machineMap[canonicalMachine]) {
            machineMap[canonicalMachine] = {
              machine: canonicalMachine,
              totalDurationMin: 0,
              details: []
            };
          }

          machineMap[canonicalMachine].totalDurationMin += durationMin;
          machineMap[canonicalMachine].details.push({
            shift: String(row[1]).trim(),
            zone: String(row[3]).trim(),
            symptom: String(row[4]).trim(),
            cause: String(row[5]).trim(),
            action: String(row[6]).trim(),
            fixType: String(row[7]).trim(),
            durationMin: durationMin,
            jobType: String(row[15] || '').trim(),
            fixBy: String(row[17] || '').trim()
          });
        }
      });

      const sortedMachines = Object.values(machineMap).sort((a, b) => b.totalDurationMin - a.totalDurationMin);
      result.topLoss = sortedMachines.slice(0, 5);
    }

    return result;
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parseBreakdown };
