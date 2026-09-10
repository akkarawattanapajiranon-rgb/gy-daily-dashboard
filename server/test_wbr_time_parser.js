const XLSX = require('xlsx');
const p = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - WBR\\10 Building loss report-2026\\BUILDING LOSS 2026\\09 SEP 2026 Building lost daily report- update including OT -.xlsx';

const wb = XLSX.readFile(p);

function parseTime(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    // Excel time fraction (e.g., 0.5 = 12:00) or decimal float (e.g., 8.23 -> 8:23 or 8.5 -> 8:30)
    if (val < 1) {
      const totalMins = Math.round(val * 24 * 60);
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      return { hours: h, mins: m, str: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
    } else {
      // e.g. 8.23 -> 8 hours, 23 mins; 11.3 -> 11 hours, 30 mins or 11 hours, 3 mins
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

console.log('=== Parsing Delays for September 2026 ===');

wb.SheetNames.forEach(sheetName => {
  if (!sheetName.startsWith('(') || !sheetName.endsWith(')')) return;
  const ws = wb.Sheets[sheetName];
  if (!ws) return;

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  let currentMC = '';
  let currentShift = 'กะ 1';

  const items = [];

  data.forEach((row, rowIdx) => {
    if (rowIdx < 5 || rowIdx > 125) return;

    const mcVal = String(row[1] || '').trim();
    if (mcVal && mcVal !== 'MC' && mcVal !== 'Total' && mcVal !== 'Daily Building & Lost Report') {
      currentMC = mcVal;
    }

    const shiftVal = String(row[2] || '').trim();
    if (shiftVal.toUpperCase().includes('S1') || shiftVal === '1') currentShift = 'กะ 1';
    else if (shiftVal.toUpperCase().includes('S2') || shiftVal === '2') currentShift = 'กะ 2';
    else if (shiftVal.toUpperCase().includes('S3') || shiftVal === '3') currentShift = 'กะ 3';

    const bgDetail = String(row[58] || '').trim();
    const bhStart = row[59];
    const biEnd = row[60];

    if (bgDetail || bhStart !== '' || biEnd !== '') {
      const startTimeObj = parseTime(bhStart);
      const endTimeObj = parseTime(biEnd);
      const durationMin = calcDurationMin(startTimeObj, endTimeObj);

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
        rowIdx: rowIdx + 1,
        machine: currentMC,
        shift: currentShift,
        code: String(row[4] || '').trim(),
        detail: bgDetail || null,
        startTime: startTimeObj?.str || null,
        endTime: endTimeObj?.str || null,
        timeRangeStr,
        durationMin,
        durationHours: parseFloat((durationMin / 60).toFixed(1)),
        category
      });
    }
  });

  if (items.length > 0) {
    console.log(`\nSheet ${sheetName} (${items.length} items):`);
    console.log(items);
  }
});
