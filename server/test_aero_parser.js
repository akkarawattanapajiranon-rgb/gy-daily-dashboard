const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function parseTimeStringToMinutes(timeStr) {
  let [h, m] = timeStr.split('.').map(n => parseInt(n, 10));
  if (isNaN(h)) h = 0;
  if (isNaN(m)) m = 0;
  if (h >= 24) h = h % 24;
  return h * 60 + m;
}

function calculateRangeDurationMinutes(startStr, endStr) {
  let startMins = parseTimeStringToMinutes(startStr);
  let endMins = parseTimeStringToMinutes(endStr);
  let diff = endMins - startMins;
  if (diff <= 0) {
    diff += 24 * 60; // Across midnight
  }
  return diff;
}

function parseAeroDelayLine(lineText) {
  const text = lineText.trim();
  if (!text.toLowerCase().includes('d/l')) return null;

  const lower = text.toLowerCase();
  let category = null;
  let componentName = '';

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

const testStrings = [
  'd/l tread > 19.30 - 23.00',
  'd/l tread > 23.00 -02.30',
  'd/l band 4 > 18.30 -20.30',
  'd/l band=1 02.30-07.00',
  'd/l band 6=07.00-9.30',
  'd/l tread > 23.00 -07.00',
  'd/l side wall 10.00-15.00',
  'd/l bead 24.00-01.30',
  'd/l bead > 17.00 - 18.30',
  'd/l breaker 23.00-24.30',
  'd/l ply. > 21.00 - 23.00'
];

testStrings.forEach(s => console.log(parseAeroDelayLine(s)));
