const fs = require('fs');
const path = require('path');
const { parseWasteData } = require('./waste_parser');
const { parseBreakdown } = require('./breakdown_parser');
const { parseFischerData } = require('./fischer_parser');
const { parseQuadData } = require('./quad_parser');
const { parseTuberData } = require('./tuber_parser');
const { fetchLiveCmsData } = require('./cms_parser');
const { getSnapshot } = require('./snapshot_generator');

const metricsMemoryCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1-minute TTL

/**
 * Extract 11 metrics for a single date
 */
async function getMetricsForDate(dateStr) {
  const cached = metricsMemoryCache.get(dateStr);
  if (cached && (Date.now() - cached.ts < CACHE_TTL_MS)) {
    return cached.data;
  }

  const snap = getSnapshot(dateStr) || {};

  let cmsData = snap.cms;
  if (!cmsData) {
    try {
      cmsData = await fetchLiveCmsData(dateStr);
    } catch (e) {
      cmsData = {};
    }
  }
  cmsData = cmsData || {};

  const quadData = snap.quad || parseQuadData(dateStr) || {};
  const tuberData = snap.tuber || parseTuberData(dateStr) || {};
  const fischerData = snap.fischer || parseFischerData(dateStr) || {};
  const bdData = snap.breakdown || parseBreakdown(dateStr) || {};
  const wasteData = snap.waste || parseWasteData(dateStr) || {};

  const batch1 = Number(cmsData?.mixing1?.batch) || 0;
  const batch2 = Number(cmsData?.mixing2?.batch) || 0;
  const mixerBatchmix = batch1 + batch2;

  const mixerOee2 = Number(cmsData?.totalOee2) || 0;
  const quadOee2 = Number(quadData?.oee?.oee2_pct) || 0;
  const tuberOee2 = Number(tuberData?.oee?.oee2_pct) || 0;
  const fischerOee2 = Number(fischerData?.oee?.oee2_pct) || 0;

  const bdMixer = Number(bdData?.Banbury?.actual_bd_pct) || 0;
  const bdExtruder = Number(bdData?.Extruder?.actual_bd_pct) || 0;
  const bdCalender = Number(bdData?.Calender?.actual_bd_pct) || 0;
  const bdCutting = Number(bdData?.Cutting?.actual_bd_pct) || 0;

  const frictionWaste = Number(wasteData?.frictionSummary) || 0;
  const millingWaste = Number(wasteData?.millingSummary) || 0;

  const res = {
    date: dateStr,
    mixerBatchmix,
    mixerOee2: Number(mixerOee2.toFixed(2)),
    quadOee2: Number(quadOee2.toFixed(2)),
    tuberOee2: Number(tuberOee2.toFixed(2)),
    fischerOee2: Number(fischerOee2.toFixed(2)),
    bdMixer: Number(bdMixer.toFixed(4)),
    bdExtruder: Number(bdExtruder.toFixed(4)),
    bdCalender: Number(bdCalender.toFixed(4)),
    bdCutting: Number(bdCutting.toFixed(4)),
    frictionWaste: Number(frictionWaste.toFixed(2)),
    millingWaste: Number(millingWaste.toFixed(2))
  };

  metricsMemoryCache.set(dateStr, { data: res, ts: Date.now() });
  return res;
}

/**
 * Extract 11 metrics for date range [startDate, endDate]
 */
async function getExportMetricsRange(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const dates = [];

  if (start > end) {
    return [await getMetricsForDate(startDateStr)];
  }

  const curr = new Date(start);
  let count = 0;
  while (curr <= end && count < 60) {
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    curr.setDate(curr.getDate() + 1);
    count++;
  }

  const results = await Promise.all(dates.map(d => getMetricsForDate(d)));
  return results;
}

module.exports = { getMetricsForDate, getExportMetricsRange };
