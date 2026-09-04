const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { findMonthlyFile, findMonthlySheet } = require('./month_utils');

const QUAD_DIR = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad";
const FISCHER_DIR = "T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer";
const FISCHER_OEE_FILE = path.join(FISCHER_DIR, "OEE - 2026 TRACKING - SHEAR FISCHER.xlsx");

/**
 * Returns weeks for a month (Monday to Sunday, with W1 starting at day 1 and last week ending at month end)
 */
function getMonthWeeks(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const weeks = [];
  let currentWeekNum = 1;
  let weekStartDay = 1;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon

    if (dayOfWeek === 0 || day === daysInMonth) {
      weeks.push({
        weekNum: currentWeekNum,
        startDay: weekStartDay,
        endDay: day,
        label: `W${currentWeekNum} (${weekStartDay}/${month} - ${day}/${month})`
      });
      currentWeekNum++;
      weekStartDay = day + 1;
    }
  }

  return weeks;
}

function parseWeeklyOee(dateStr) {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const yearNum = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const dayNum = parseInt(dayStr, 10);

    const weeks = getMonthWeeks(yearNum, monthNum);

    // Read Quad & Tuber 6x8 OEE
    const quadDaily = {};
    const tuberDaily = {};

    const quadOeeFile = findMonthlyFile(fs.readdirSync(QUAD_DIR), monthNum, yearStr, ['oee']);
    if (quadOeeFile) {
      const fullPath = path.join(QUAD_DIR, quadOeeFile);
      const wb = XLSX.readFile(fullPath);

      // Quad sheet
      const quadSheetName = findMonthlySheet(wb.SheetNames, monthNum, yearStr, ['quad']) ||
                            wb.SheetNames.find(s => s.toLowerCase().includes('quad') && (s.includes('26') || s.includes('2026')));
      if (quadSheetName && wb.Sheets[quadSheetName]) {
        const data = XLSX.utils.sheet_to_json(wb.Sheets[quadSheetName], { header: 1, defval: '' });
        data.slice(2).forEach(r => {
          const d = parseInt(r[0], 10);
          if (!isNaN(d) && d > 0 && d <= 31) {
            const oee2 = Number(r[8]) || Number(r[7]) || 0;
            if (oee2 > 0) quadDaily[d] = oee2 * 100;
          }
        });
      }

      // Tuber 6x8 sheet
      const tuberSheetName = findMonthlySheet(wb.SheetNames, monthNum, yearStr, ['6x8']) ||
                             findMonthlySheet(wb.SheetNames, monthNum, yearStr, ['ext']);
      if (tuberSheetName && wb.Sheets[tuberSheetName]) {
        const data = XLSX.utils.sheet_to_json(wb.Sheets[tuberSheetName], { header: 1, defval: '' });
        data.slice(2).forEach(r => {
          const d = parseInt(r[0], 10);
          if (!isNaN(d) && d > 0 && d <= 31) {
            const oee2 = Number(r[7]) || Number(r[6]) || 0;
            if (oee2 > 0) tuberDaily[d] = oee2 * 100;
          }
        });
      }
    }

    // Read Fischer OEE
    const fischerDaily = {};
    if (fs.existsSync(FISCHER_OEE_FILE)) {
      const wbFischer = XLSX.readFile(FISCHER_OEE_FILE);
      const fSheetName = findMonthlySheet(wbFischer.SheetNames, monthNum, yearStr, ['oee']) ||
                         wbFischer.SheetNames.find(s => s.toLowerCase().includes('oee')) ||
                         wbFischer.SheetNames[0];
      if (fSheetName && wbFischer.Sheets[fSheetName]) {
        const data = XLSX.utils.sheet_to_json(wbFischer.Sheets[fSheetName], { header: 1, defval: '' });
        data.slice(1).forEach(r => {
          const rawDate = r[0];
          if (rawDate !== '' && rawDate !== undefined) {
            let dDay = null;
            if (typeof rawDate === 'number') {
              const parsed = XLSX.SSF.parse_date_code(rawDate);
              if (parsed) dDay = parsed.d;
            } else if (typeof rawDate === 'string') {
              const m = rawDate.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (m) dDay = parseInt(m[3], 10);
            }
            if (dDay && dDay > 0 && dDay <= 31) {
              const oee2 = Number(r[8]) || 0;
              if (oee2 > 0) fischerDaily[dDay] = oee2 * 100;
            }
          }
        });
      }
    }

    // Calculate weekly stats
    const processedWeeks = weeks.map(w => {
      // Up to dayNum for current week, or full week if past
      const maxDayToConsider = (dayNum >= w.startDay && dayNum <= w.endDay) ? dayNum : w.endDay;

      const qVals = [];
      const tVals = [];
      const fVals = [];

      for (let d = w.startDay; d <= maxDayToConsider; d++) {
        if (quadDaily[d]) qVals.push(quadDaily[d]);
        if (tuberDaily[d]) tVals.push(tuberDaily[d]);
        if (fischerDaily[d]) fVals.push(fischerDaily[d]);
      }

      const qAvg = qVals.length > 0 ? parseFloat((qVals.reduce((a, b) => a + b, 0) / qVals.length).toFixed(2)) : null;
      const tAvg = tVals.length > 0 ? parseFloat((tVals.reduce((a, b) => a + b, 0) / tVals.length).toFixed(2)) : null;
      const fAvg = fVals.length > 0 ? parseFloat((fVals.reduce((a, b) => a + b, 0) / fVals.length).toFixed(2)) : null;

      return {
        weekNum: w.weekNum,
        startDay: w.startDay,
        endDay: w.endDay,
        label: w.label,
        isCurrentWeek: (dayNum >= w.startDay && dayNum <= w.endDay),
        quad: { avg: qAvg, target: 62, count: qVals.length, isMet: qAvg !== null ? qAvg >= 62 : false },
        tuber: { avg: tAvg, target: 62, count: tVals.length, isMet: tAvg !== null ? tAvg >= 62 : false },
        fischer: { avg: fAvg, target: 60, count: fVals.length, isMet: fAvg !== null ? fAvg >= 60 : false }
      };
    });

    // Find active week for the selected date
    const activeWeek = processedWeeks.find(w => w.isCurrentWeek) || processedWeeks[0];

    return {
      date: dateStr,
      activeWeek,
      weeks: processedWeeks
    };

  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parseWeeklyOee, getMonthWeeks };
