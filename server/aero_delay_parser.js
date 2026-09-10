const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const AERO_DIR = 'N:\\Team-B\\LEADER  TEAM  B 2014\\Building lost report - Aero\\Aero Building Loss 2026';

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

function getAeroFilePath(yearStr, monthNum) {
  if (!fs.existsSync(AERO_DIR)) return null;

  const monthName = MONTH_NAMES[monthNum - 1];
  const monthPad = String(monthNum).padStart(2, '0');
  const files = fs.readdirSync(AERO_DIR).filter(f => (f.endsWith('.xls') || f.endsWith('.xlsx')) && !f.startsWith('~$'));

  const match = files.find(f => {
    const l = f.toLowerCase();
    return (l.startsWith(monthPad) || l.includes(monthName)) && l.includes(yearStr);
  });

  return match ? path.join(AERO_DIR, match) : null;
}

function parseTimeStringToMinutes(timeStr) {
  let [h, m] = timeStr.split('.').map(n => parseInt(n, 10));
  if (isNaN(h)) h = 0;
  if (isNaN(m)) m = 0;
  if (h >= 30) h = 23; // Typo fix for e.g. 33.00 -> 23.00
  else if (h >= 24) h = h % 24;
  return h * 60 + m;
}

function calculateRangeDurationMinutes(startStr, endStr) {
  let startMins = parseTimeStringToMinutes(startStr);
  let endMins = parseTimeStringToMinutes(endStr);
  let diff = endMins - startMins;
  if (diff <= 0) {
    diff += 24 * 60; // Spans across midnight
  }
  return diff;
}

function parseAeroDelayLine(lineText) {
  const text = lineText.trim();
  if (!text.toLowerCase().includes('d/l')) return null;

  const lower = text.toLowerCase();
  let category = null;
  let componentName = '';

  // Extrusion vs Comp classification rules:
  // Extrusion: Tread, SW (Sidewall)
  // Comp: Band, Bead, Liner, Chafer, Breaker, Ply, Apex
  if (lower.includes('tread')) {
    category = 'Extrusion';
    componentName = 'Tread';
  } else if (lower.includes('side wall') || lower.includes('sidewall') || lower.includes(' sw ') || lower.endsWith(' sw') || lower.includes('s/w')) {
    category = 'Extrusion';
    componentName = 'Sidewall';
  } else if (lower.includes('band')) {
    category = 'Comp';
    componentName = 'Band';
  } else if (lower.includes('bead')) {
    category = 'Comp';
    componentName = 'Bead';
  } else if (lower.includes('liner')) {
    category = 'Comp';
    componentName = 'Liner';
  } else if (lower.includes('chafer')) {
    category = 'Comp';
    componentName = 'Chafer';
  } else if (lower.includes('breaker')) {
    category = 'Comp';
    componentName = 'Breaker';
  } else if (lower.includes('ply')) {
    category = 'Comp';
    componentName = 'Ply';
  } else if (lower.includes('apex')) {
    category = 'Comp';
    componentName = 'Apex';
  } else {
    category = 'Comp';
    componentName = 'Component';
  }

  // Time range regex: e.g. "19.30 - 23.00", "23.00 -02.30", "02.30-07.00", "07.00-9.30"
  const match = text.match(/(\d{1,2}\.\d{2})\s*[-–>]\s*(\d{1,2}\.\d{2})/);
  let durationMin = 0;
  let timeRangeStr = '';

  if (match) {
    const startStr = match[1];
    const endStr = match[2];
    timeRangeStr = `${startStr} - ${endStr}`;
    durationMin = calculateRangeDurationMinutes(startStr, endStr);
  }

  return {
    rawText: text,
    category,
    componentName,
    timeRangeStr,
    durationMin,
    durationHours: parseFloat((durationMin / 60).toFixed(1))
  };
}

function parseAeroDelay(dateStr) {
  try {
    const [year, month, day] = dateStr.split('-');
    const monthNum = parseInt(month, 10);
    const dayPad = String(parseInt(day, 10)).padStart(2, '0');

    const file = getAeroFilePath(year, monthNum);
    if (!file || !fs.existsSync(file)) {
      return { error: `Aero Building report not found for ${dateStr}` };
    }

    const wb = XLSX.readFile(file);
    const sheetName = wb.SheetNames.find(s => s.trim() === dayPad || s.trim() === String(parseInt(day, 10))) || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      return { error: `Sheet ${sheetName} not found in Aero report` };
    }

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const items = [];
    let currentMachine = '';

    const validMcRegex = /^(U[A-Z]|TAKU|A\d{3}|B\d{3})$/i;

    data.forEach((row, rowIdx) => {
      const mc0 = String(row[0] || '').trim().toUpperCase();
      const mc33 = String(row[33] || '').trim().toUpperCase();

      if (validMcRegex.test(mc0)) {
        currentMachine = mc0;
      } else if (validMcRegex.test(mc33)) {
        currentMachine = mc33;
      } else if (mc0 && mc0.length <= 4 && !['MC', 'DATE', 'TOTAL', 'REQUIRE'].includes(mc0) && isNaN(Number(mc0))) {
        currentMachine = mc0;
      }

      // Check text in description columns (AB/AC/AD/AE/AF, indices 27..31)
      const textCols = [row[27], row[28], row[29], row[30], row[31]]
        .map(c => String(c || '').trim())
        .filter(c => c.length > 0);

      textCols.forEach(text => {
        if (text.toLowerCase().includes('d/l')) {
          const parsed = parseAeroDelayLine(text);
          if (parsed) {
            items.push({
              id: `${rowIdx}-${items.length}`,
              machine: currentMachine || 'Aero',
              ...parsed
            });
          }
        }
      });
    });

    const extrusionItems = items.filter(i => i.category === 'Extrusion');
    const compItems = items.filter(i => i.category === 'Comp');

    const totalExtrusionMin = extrusionItems.reduce((acc, i) => acc + i.durationMin, 0);
    const totalCompMin = compItems.reduce((acc, i) => acc + i.durationMin, 0);
    const totalDelayMin = totalExtrusionMin + totalCompMin;

    return {
      _file: path.basename(file),
      _sheet: sheetName,
      _date: dateStr,
      totalDelayMin,
      totalDelayHours: parseFloat((totalDelayMin / 60).toFixed(1)),
      totalExtrusionMin,
      totalExtrusionHours: parseFloat((totalExtrusionMin / 60).toFixed(1)),
      totalCompMin,
      totalCompHours: parseFloat((totalCompMin / 60).toFixed(1)),
      summary: {
        extrusionCount: extrusionItems.length,
        compCount: compItems.length,
        totalItems: items.length
      },
      items
    };
  } catch (e) {
    return { error: e.message };
  }
}

module.exports = { parseAeroDelay };
