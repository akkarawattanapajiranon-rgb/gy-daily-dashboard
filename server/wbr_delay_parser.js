const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const WBR_DIR = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR\\10 Building loss report-2026\\BUILDING LOSS 2026';
const WBR_FALLBACK_DIR = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR';

const MONTH_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function getWbrFilePath(yearStr, monthNum) {
  const dirs = [WBR_DIR, WBR_FALLBACK_DIR];
  const monthShort = MONTH_SHORT[monthNum - 1];
  const monthPad = String(monthNum).padStart(2, '0');

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;

    let files = [];
    try {
      files = fs.readdirSync(dir).filter(f => (f.endsWith('.xls') || f.endsWith('.xlsx')) && !f.startsWith('~$'));
    } catch (err) {
      continue;
    }

    const match = files.find(f => {
      const l = f.toLowerCase();
      return (l.startsWith(monthPad) || l.includes(monthShort)) && l.includes('building lost');
    });

    if (match) return path.join(dir, match);
  }

  return null;
}

function parseTimeStr(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    if (val < 1) {
      const totalMins = Math.round(val * 24 * 60);
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      return { hours: h, mins: m, str: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
    } else {
      const s = val.toFixed(2);
      const [hStr, mStr] = s.split('.');
      const h = parseInt(hStr, 10);
      let m = parseInt(mStr, 10);
      if (mStr.length === 1) m = m * 10;
      return { hours: h, mins: m, str: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
    }
  }

  const str = String(val).trim();
  if (!str) return null;

  if (str.includes(':')) {
    const [hStr, mStr] = str.split(':');
    const h = parseInt(hStr, 10) || 0;
    const m = parseInt(mStr, 10) || 0;
    return { hours: h, mins: m, str: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
  } else if (str.includes('.')) {
    const [hStr, mStr] = str.split('.');
    const h = parseInt(hStr, 10) || 0;
    let m = parseInt(mStr, 10) || 0;
    if (mStr.length === 1) m = m * 10;
    return { hours: h, mins: m, str: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
  } else {
    const h = parseInt(str, 10) || 0;
    return { hours: h, mins: 0, str: `${String(h).padStart(2, '0')}:00` };
  }
}

function calcDurationMin(startObj, endObj) {
  if (!startObj || !endObj) return 0;
  let startMins = startObj.hours * 60 + startObj.mins;
  let endMins = endObj.hours * 60 + endObj.mins;

  if (endMins < startMins) {
    endMins += 24 * 60; // Overnight shift
  }

  return endMins - startMins;
}

function determineShift(shiftVal, startTimeObj) {
  const s = String(shiftVal || '').toUpperCase();
  if (s.includes('S1') || s === '1') return 'กะ 1';
  if (s.includes('S2') || s === '2') return 'กะ 2';
  if (s.includes('S3') || s === '3') return 'กะ 3';

  if (startTimeObj) {
    const h = startTimeObj.hours;
    if (h >= 7 && h < 15) return 'กะ 1';
    if (h >= 15 && h < 23) return 'กะ 2';
    return 'กะ 3';
  }

  return 'กะ 1';
}

function parseWbrDelay(dateStr) {
  try {
    const [year, month, day] = dateStr.split('-');
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);

    const file = getWbrFilePath(year, monthNum);
    if (!file || !fs.existsSync(file)) {
      return { error: `WBR Building loss report not found for ${dateStr}` };
    }

    const wb = XLSX.readFile(file);
    const targetSheetPattern = `(${dayNum})`;
    const sheetName = wb.SheetNames.find(s => s.trim() === targetSheetPattern || s.trim() === String(dayNum)) || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      return { error: `Sheet ${sheetName} not found in report` };
    }

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    const items = [];
    let currentMC = '';

    data.forEach((row, rowIdx) => {
      if (rowIdx < 5 || rowIdx > 125) return;

      const mcVal = String(row[1] || '').trim();
      if (mcVal && mcVal !== 'MC' && mcVal !== 'Total' && mcVal !== 'Daily Building & Lost Report') {
        currentMC = mcVal;
      }

      const shiftVal = String(row[2] || '').trim();

      // Read STRICTLY Col BG (58) Material Delay, Col BH (59) Start, Col BI (60) End
      const bgDetail = String(row[58] || '').trim();
      const bhStart = row[59];
      const biEnd = row[60];

      // Ignore summary / header rows
      if (bgDetail.includes('shift') || bgDetail.includes('Material Delay')) return;

      if (!bgDetail && bhStart === '' && biEnd === '') return;

      const startTimeObj = parseTimeStr(bhStart);
      const endTimeObj = parseTimeStr(biEnd);
      const durationMin = calcDurationMin(startTimeObj, endTimeObj);
      const shift = determineShift(shiftVal, startTimeObj);

      let timeRangeStr = '';
      if (startTimeObj && endTimeObj) {
        timeRangeStr = `${startTimeObj.str} - ${endTimeObj.str}`;
      } else if (startTimeObj) {
        timeRangeStr = `${startTimeObj.str}`;
      }

      let category = 'Comp';
      const lower = bgDetail.toLowerCase();
      if (lower.includes('tread') || lower.includes('sidewall') || lower.includes(' sw ') || lower.includes('extrusion')) {
        category = 'Extrusion';
      }

      items.push({
        id: `r${rowIdx + 1}-${shift}-${items.length + 1}`,
        machine: currentMC,
        shift,
        code: String(row[4] || '').trim(),
        delayMin: durationMin,
        delayHours: parseFloat((durationMin / 60).toFixed(1)),
        detail: bgDetail ? (timeRangeStr ? `[${timeRangeStr}] ${bgDetail}` : bgDetail) : null,
        timeRangeStr,
        category
      });
    });

    const shift1Min = items.filter(i => i.shift === 'กะ 1').reduce((a, b) => a + b.delayMin, 0);
    const shift2Min = items.filter(i => i.shift === 'กะ 2').reduce((a, b) => a + b.delayMin, 0);
    const shift3Min = items.filter(i => i.shift === 'กะ 3').reduce((a, b) => a + b.delayMin, 0);
    const totalDelayMin = shift1Min + shift2Min + shift3Min;

    return {
      _file: path.basename(file),
      _sheet: sheetName,
      _date: dateStr,
      totalDelayMin,
      totalDelayHours: parseFloat((totalDelayMin / 60).toFixed(1)),
      shift1Min,
      shift1Hours: parseFloat((shift1Min / 60).toFixed(1)),
      shift2Min,
      shift2Hours: parseFloat((shift2Min / 60).toFixed(1)),
      shift3Min,
      shift3Hours: parseFloat((shift3Min / 60).toFixed(1)),
      summary: {
        totalItems: items.length,
        itemsWithDetail: items.filter(i => i.detail !== null).length,
        itemsOnlyMin: items.filter(i => i.detail === null).length
      },
      items
    };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parseWbrDelay };

if (require.main === module) {
  console.log('--- 2026-09-02 ---');
  console.log(JSON.stringify(parseWbrDelay('2026-09-02'), null, 2));
  console.log('--- 2026-09-07 ---');
  console.log(JSON.stringify(parseWbrDelay('2026-09-07'), null, 2));
}
