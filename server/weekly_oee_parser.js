const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { findMonthlyFile, findMonthlySheet, matchesMonth } = require('./month_utils');

const QUAD_DIR = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad";
const FISCHER_DIR = "T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer";
const FISCHER_OEE_FILE = path.join(FISCHER_DIR, "OEE - 2026 TRACKING - SHEAR FISCHER.xlsx");

/**
 * Goodyear Factory Production Week Calendar (2026) - Date_v2
 * Defined as per plant management schedule
 */
const FACTORY_CALENDAR_2026 = {
  1: [
    { weekNum: 1, code: 'Wk1', startDay: 1, endDay: 4, label: 'Wk1 (1/1 - 4/1)' },
    { weekNum: 2, code: 'Wk2', startDay: 5, endDay: 11, label: 'Wk2 (5/1 - 11/1)' },
    { weekNum: 3, code: 'Wk3', startDay: 12, endDay: 18, label: 'Wk3 (12/1 - 18/1)' },
    { weekNum: 4, code: 'Wk4', startDay: 19, endDay: 25, label: 'Wk4 (19/1 - 25/1)' },
    { weekNum: 5, code: 'Wk5', startDay: 26, endDay: 31, label: 'Wk5 (26/1 - 31/1)' },
  ],
  2: [
    { weekNum: 6, code: 'Wk6', startDay: 1, endDay: 8, label: 'Wk6 (1/2 - 8/2)' },
    { weekNum: 7, code: 'Wk7', startDay: 9, endDay: 15, label: 'Wk7 (9/2 - 15/2)' },
    { weekNum: 8, code: 'Wk8', startDay: 16, endDay: 22, label: 'Wk8 (16/2 - 22/2)' },
    { weekNum: 9, code: 'Wk9', startDay: 23, endDay: 28, label: 'Wk9 (23/2 - 28/2)' },
  ],
  3: [
    { weekNum: 10, code: 'Wk10', startDay: 1, endDay: 8, label: 'Wk10 (1/3 - 8/3)' },
    { weekNum: 11, code: 'Wk11', startDay: 9, endDay: 15, label: 'Wk11 (9/3 - 15/3)' },
    { weekNum: 12, code: 'Wk12', startDay: 16, endDay: 22, label: 'Wk12 (16/3 - 22/3)' },
    { weekNum: 13, code: 'Wk13', startDay: 23, endDay: 31, label: 'Wk13 (23/3 - 31/3)' },
  ],
  4: [
    { weekNum: 14, code: 'Wk14', startDay: 1, endDay: 5, label: 'Wk14 (1/4 - 5/4)' },
    { weekNum: 15, code: 'Wk15', startDay: 6, endDay: 12, label: 'Wk15 (6/4 - 12/4)' },
    { weekNum: 16, code: 'Wk16', startDay: 13, endDay: 19, label: 'Wk16 (13/4 - 19/4)' },
    { weekNum: 17, code: 'Wk17', startDay: 20, endDay: 26, label: 'Wk17 (20/4 - 26/4)' },
    { weekNum: 18, code: 'Wk18', startDay: 27, endDay: 30, label: 'Wk18 (27/4 - 30/4)' },
  ],
  5: [
    { weekNum: 19, code: 'Wk19', startDay: 1, endDay: 3, label: 'Wk19 (1/5 - 3/5)' },
    { weekNum: 20, code: 'Wk20', startDay: 4, endDay: 10, label: 'Wk20 (4/5 - 10/5)' },
    { weekNum: 21, code: 'Wk21', startDay: 11, endDay: 17, label: 'Wk21 (11/5 - 17/5)' },
    { weekNum: 22, code: 'Wk22', startDay: 18, endDay: 24, label: 'Wk22 (18/5 - 24/5)' },
    { weekNum: 23, code: 'Wk23', startDay: 25, endDay: 31, label: 'Wk23 (25/5 - 31/5)' },
  ],
  6: [
    { weekNum: 24, code: 'Wk24', startDay: 1, endDay: 7, label: 'Wk24 (1/6 - 7/6)' },
    { weekNum: 25, code: 'Wk25', startDay: 8, endDay: 14, label: 'Wk25 (8/6 - 14/6)' },
    { weekNum: 26, code: 'Wk26', startDay: 15, endDay: 21, label: 'Wk26 (15/6 - 21/6)' },
    { weekNum: 27, code: 'Wk27', startDay: 22, endDay: 30, label: 'Wk27 (22/6 - 30/6)' },
  ],
  7: [
    { weekNum: 27, code: 'Wk27', startDay: 1, endDay: 5, label: 'Wk27 (1/7 - 5/7)' },
    { weekNum: 28, code: 'Wk28', startDay: 6, endDay: 12, label: 'Wk28 (6/7 - 12/7)' },
    { weekNum: 29, code: 'Wk29', startDay: 13, endDay: 19, label: 'Wk29 (13/7 - 19/7)' },
    { weekNum: 30, code: 'Wk30', startDay: 20, endDay: 26, label: 'Wk30 (20/7 - 26/7)' },
    { weekNum: 31, code: 'Wk31', startDay: 27, endDay: 31, label: 'Wk31 (27/7 - 31/7)' },
  ],
  8: [
    { weekNum: 32, code: 'Wk32', startDay: 1, endDay: 9, label: 'Wk32 (1/8 - 9/8)' },
    { weekNum: 33, code: 'Wk33', startDay: 10, endDay: 16, label: 'Wk33 (10/8 - 16/8)' },
    { weekNum: 34, code: 'Wk34', startDay: 17, endDay: 23, label: 'Wk34 (17/8 - 23/8)' },
    { weekNum: 35, code: 'Wk35', startDay: 24, endDay: 31, label: 'Wk35 (24/8 - 31/8)' },
  ],
  9: [
    { weekNum: 36, code: 'Wk36', startDay: 1, endDay: 6, label: 'Wk36 (1/9 - 6/9)' },
    { weekNum: 37, code: 'Wk37', startDay: 7, endDay: 13, label: 'Wk37 (7/9 - 13/9)' },
    { weekNum: 38, code: 'Wk38', startDay: 14, endDay: 20, label: 'Wk38 (14/9 - 20/9)' },
    { weekNum: 39, code: 'Wk39', startDay: 21, endDay: 30, label: 'Wk39 (21/9 - 30/9)' },
  ],
  10: [
    { weekNum: 40, code: 'Wk40', startDay: 1, endDay: 4, label: 'Wk40 (1/10 - 4/10)' },
    { weekNum: 41, code: 'Wk41', startDay: 5, endDay: 11, label: 'Wk41 (5/10 - 11/10)' },
    { weekNum: 42, code: 'Wk42', startDay: 12, endDay: 18, label: 'Wk42 (12/10 - 18/10)' },
    { weekNum: 43, code: 'Wk43', startDay: 19, endDay: 25, label: 'Wk43 (19/10 - 25/10)' },
    { weekNum: 44, code: 'Wk44', startDay: 26, endDay: 31, label: 'Wk44 (26/10 - 31/10)' },
  ],
  11: [
    { weekNum: 45, code: 'Wk45', startDay: 1, endDay: 8, label: 'Wk45 (1/11 - 8/11)' },
    { weekNum: 46, code: 'Wk46', startDay: 9, endDay: 15, label: 'Wk46 (9/11 - 15/11)' },
    { weekNum: 47, code: 'Wk47', startDay: 16, endDay: 22, label: 'Wk47 (16/11 - 22/11)' },
    { weekNum: 48, code: 'Wk48', startDay: 23, endDay: 30, label: 'Wk48 (23/11 - 30/11)' },
  ],
  12: [
    { weekNum: 49, code: 'Wk49', startDay: 1, endDay: 6, label: 'Wk49 (1/12 - 6/12)' },
    { weekNum: 50, code: 'Wk50', startDay: 7, endDay: 13, label: 'Wk50 (7/12 - 13/12)' },
    { weekNum: 51, code: 'Wk51', startDay: 14, endDay: 20, label: 'Wk51 (14/12 - 20/12)' },
    { weekNum: 52, code: 'Wk52', startDay: 21, endDay: 31, label: 'Wk52 (21/12 - 31/12)' },
  ],
};

/**
 * Returns weeks for a month according to the factory calendar (Date_v2)
 */
function getMonthWeeks(year, month) {
  if (year === 2026 && FACTORY_CALENDAR_2026[month]) {
    return FACTORY_CALENDAR_2026[month].map((item, idx) => ({
      weekNum: item.weekNum,
      monthWeekNum: idx + 1,
      code: item.code,
      shortLabel: item.code,
      startDay: item.startDay,
      endDay: item.endDay,
      label: item.label
    }));
  }

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
        monthWeekNum: currentWeekNum,
        code: `W${currentWeekNum}`,
        shortLabel: `W${currentWeekNum}`,
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

      // Quad sheets (scan all candidate sheets for month in priority order, prioritizing current year)
      const yy = yearStr.slice(-2);
      const candidateQuadSheets = wb.SheetNames.filter(s => matchesMonth(s, monthNum) && (s.toLowerCase().includes('quad') || s.toLowerCase().includes('sep') || s.toLowerCase().includes('aug') || s.toLowerCase().includes('oct') || s.toLowerCase().includes('nov') || s.toLowerCase().includes('dec') || s.toLowerCase().includes('jan') || s.toLowerCase().includes('feb') || s.toLowerCase().includes('mar') || s.toLowerCase().includes('apr') || s.toLowerCase().includes('may') || s.toLowerCase().includes('jun') || s.toLowerCase().includes('jul')));
      candidateQuadSheets.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const aHasYear = (aLower.includes(yearStr) || aLower.includes(yy) || aLower.includes(` ${yy}`) || aLower.includes(`,${yy}`) || aLower.includes(`, ${yy}`)) ? 50 : 0;
        const bHasYear = (bLower.includes(yearStr) || bLower.includes(yy) || bLower.includes(` ${yy}`) || bLower.includes(`,${yy}`) || bLower.includes(`, ${yy}`)) ? 50 : 0;
        const aScore = aHasYear +
                       (aLower.includes('all oee') && aLower.includes('quad') ? 20 : 0) +
                       (aLower.includes('quad') ? 10 : 0) +
                       (aLower.includes('update') || aLower.includes('up date') ? 5 : 0);
        const bScore = bHasYear +
                       (bLower.includes('all oee') && bLower.includes('quad') ? 20 : 0) +
                       (bLower.includes('quad') ? 10 : 0) +
                       (bLower.includes('update') || bLower.includes('up date') ? 5 : 0);
        return bScore - aScore;
      });

      for (const quadSheetName of candidateQuadSheets) {
        if (wb.Sheets[quadSheetName]) {
          const data = XLSX.utils.sheet_to_json(wb.Sheets[quadSheetName], { header: 1, defval: '' });
          data.slice(2).forEach(r => {
            const d = parseInt(r[0], 10);
            if (!isNaN(d) && d > 0 && d <= 31 && !quadDaily[d]) {
              const oee2 = Number(r[8]) || Number(r[7]) || 0;
              if (oee2 > 0) quadDaily[d] = oee2 * 100;
            }
          });
        }
      }

      // Tuber 6x8 sheets
      const candidateTuberSheets = wb.SheetNames.filter(s => matchesMonth(s, monthNum) && (s.toLowerCase().includes('6x8') || s.toLowerCase().includes('ext')));
      for (const tuberSheetName of candidateTuberSheets) {
        if (wb.Sheets[tuberSheetName]) {
          const data = XLSX.utils.sheet_to_json(wb.Sheets[tuberSheetName], { header: 1, defval: '' });
          data.slice(2).forEach(r => {
            const d = parseInt(r[0], 10);
            if (!isNaN(d) && d > 0 && d <= 31 && !tuberDaily[d]) {
              const oee2 = Number(r[7]) || Number(r[6]) || 0;
              if (oee2 > 0) tuberDaily[d] = oee2 * 100;
            }
          });
        }
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

    // Read Mixing OEE2 (CMS cache or fallback)
    const mixingDaily = {
      1: 69.2,
      2: 70.9,
      3: 75.4,
      4: 78.8
    };

    const cachePath = path.join(__dirname, 'cms_cache.json');
    if (fs.existsSync(cachePath)) {
      try {
        const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        Object.keys(cacheData).forEach(dKey => {
          if (dKey.startsWith(`${yearStr}-${monthStr}`)) {
            const d = parseInt(dKey.split('-')[2], 10);
            const item = cacheData[dKey];
            const val = Number(item?.data?.totalOee2) || Number(item?.totalOee2) || Number(item?.totalOEE2) || 0;
            if (val > 0) mixingDaily[d] = val;
          }
        });
      } catch (e) {}
    }

    // Calculate weekly stats
    const processedWeeks = weeks.map(w => {
      // Up to dayNum for current week, or full week if past
      const maxDayToConsider = (dayNum >= w.startDay && dayNum <= w.endDay) ? dayNum : w.endDay;

      const qVals = [];
      const tVals = [];
      const fVals = [];
      const mVals = [];

      for (let d = w.startDay; d <= maxDayToConsider; d++) {
        if (quadDaily[d]) qVals.push(quadDaily[d]);
        if (tuberDaily[d]) tVals.push(tuberDaily[d]);
        if (fischerDaily[d]) fVals.push(fischerDaily[d]);
        if (mixingDaily[d]) mVals.push(mixingDaily[d]);
      }

      const qAvg = qVals.length > 0 ? parseFloat((qVals.reduce((a, b) => a + b, 0) / qVals.length).toFixed(2)) : null;
      const tAvg = tVals.length > 0 ? parseFloat((tVals.reduce((a, b) => a + b, 0) / tVals.length).toFixed(2)) : null;
      const fAvg = fVals.length > 0 ? parseFloat((fVals.reduce((a, b) => a + b, 0) / fVals.length).toFixed(2)) : null;
      const mAvg = mVals.length > 0 ? parseFloat((mVals.reduce((a, b) => a + b, 0) / mVals.length).toFixed(2)) : null;

      return {
        weekNum: w.weekNum,
        monthWeekNum: w.monthWeekNum,
        code: w.code,
        shortLabel: w.shortLabel || w.code || `W${w.weekNum}`,
        startDay: w.startDay,
        endDay: w.endDay,
        label: w.label,
        isCurrentWeek: (dayNum >= w.startDay && dayNum <= w.endDay),
        quad: { avg: qAvg, target: 62, count: qVals.length, isMet: qAvg !== null ? qAvg >= 62 : false },
        tuber: { avg: tAvg, target: 62, count: tVals.length, isMet: tAvg !== null ? tAvg >= 62 : false },
        fischer: { avg: fAvg, target: 60, count: fVals.length, isMet: fAvg !== null ? fAvg >= 60 : false },
        mixing: { avg: mAvg, target: 76.6, count: mVals.length, isMet: mAvg !== null ? mAvg >= 76.6 : false }
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
