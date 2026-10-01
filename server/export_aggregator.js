const fs = require('fs');
const path = require('path');
const { parseWasteData, parseWasteDataAsync } = require('./waste_parser');
const { parseBreakdown } = require('./breakdown_parser');
const { parseFischerData } = require('./fischer_parser');
const { parseQuadData } = require('./quad_parser');
const { parseTuberData } = require('./tuber_parser');
const { fetchLiveCmsData } = require('./cms_parser');
const { getSnapshot, generateSnapshot } = require('./snapshot_generator');

const metricsMemoryCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1-minute TTL

/**
 * Extract 11 metrics for a single date
 */
async function getMetricsForDate(dateStr, forceRefresh = false) {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  const todayStr = now.toISOString().split('T')[0];
  const yDate = new Date(now.getTime() - 86400000);
  const yesterdayStr = yDate.toISOString().split('T')[0];
  const isRecent = (dateStr === todayStr || dateStr === yesterdayStr);

  const existingSnap = getSnapshot(dateStr);
  const isMissingData = !existingSnap || !existingSnap.breakdown?.Banbury?.hasData || !existingSnap.quad?.oee?.hasData;

  if (forceRefresh) {
    metricsMemoryCache.delete(dateStr);
  } else {
    const cached = metricsMemoryCache.get(dateStr);
    if (cached && (Date.now() - cached.ts < CACHE_TTL_MS)) {
      return cached.data;
    }
  }

  const snap = getSnapshot(dateStr) || {};
  const isToday = (dateStr === todayStr);

  let cmsData = snap.cms || null;
  if (!cmsData && isToday) {
    try {
      cmsData = await fetchLiveCmsData(dateStr);
    } catch (e) {
      cmsData = {};
    }
  }
  cmsData = cmsData || {};

  const quadData = snap.quad || (isToday ? parseQuadData(dateStr) : null) || {};
  const tuberData = snap.tuber || (isToday ? parseTuberData(dateStr) : null) || {};
  const fischerData = snap.fischer || (isToday ? parseFischerData(dateStr) : null) || {};
  const bdData = snap.breakdown || (isToday ? parseBreakdown(dateStr) : null) || {};
  const wasteData = snap.waste || (isToday ? await parseWasteDataAsync(dateStr) : null) || {};

  const batch1 = Number(cmsData?.mixing1?.batch) || 0;
  const batch2 = Number(cmsData?.mixing2?.batch) || 0;
  const hasCms = (batch1 > 0 || batch2 > 0 || Number(cmsData?.totalOee2 || 0) > 0);
  const mixerBatchmix = hasCms ? (batch1 + batch2) : null;
  const mixerOee2 = hasCms ? Number((Number(cmsData?.totalOee2) || 0).toFixed(2)) : null;

  const quadOee2 = (quadData?.oee && quadData.oee.hasData) ? Number(Number(quadData.oee.oee2_pct || 0).toFixed(2)) : null;
  const tuberOee2 = (tuberData?.oee && tuberData.oee.hasData) ? Number(Number(tuberData.oee.oee2_pct || 0).toFixed(2)) : null;
  const fischerOee2 = (fischerData?.oee && fischerData.oee.hasData) ? Number(Number(fischerData.oee.oee2_pct || 0).toFixed(2)) : null;

  const hasBdMixer = bdData?.Banbury?.hasData && bdData.Banbury.actual_bd_pct !== null && bdData.Banbury.actual_bd_pct !== undefined;
  const hasBdExtruder = bdData?.Extruder?.hasData && bdData.Extruder.actual_bd_pct !== null && bdData.Extruder.actual_bd_pct !== undefined;
  const hasBdCalender = bdData?.Calender?.hasData && bdData.Calender.actual_bd_pct !== null && bdData.Calender.actual_bd_pct !== undefined;
  const hasBdCutting = bdData?.Cutting?.hasData && bdData.Cutting.actual_bd_pct !== null && bdData.Cutting.actual_bd_pct !== undefined;

  const bdMixer = hasBdMixer ? Number(Number(bdData.Banbury.actual_bd_pct).toFixed(4)) : null;
  const bdExtruder = hasBdExtruder ? Number(Number(bdData.Extruder.actual_bd_pct).toFixed(4)) : null;
  const bdCalender = hasBdCalender ? Number(Number(bdData.Calender.actual_bd_pct).toFixed(4)) : null;
  const bdCutting = hasBdCutting ? Number(Number(bdData.Cutting.actual_bd_pct).toFixed(4)) : null;

  const hasWaste = wasteData && wasteData.hasData;
  const frictionWaste = hasWaste ? Number(Number(wasteData.frictionSummary || 0).toFixed(2)) : null;
  const millingWaste = hasWaste ? Number(Number(wasteData.millingSummary || 0).toFixed(2)) : null;

  const bdMixerTarget = Number((Number(bdData?.Banbury?.target_bd_pct) || 0.5827).toFixed(4));
  const bdExtruderTarget = Number((Number(bdData?.Extruder?.target_bd_pct) || 0.5098).toFixed(4));
  const bdCalenderTarget = Number((Number(bdData?.Calender?.target_bd_pct) || 0.4662).toFixed(4));
  const bdCuttingTarget = Number((Number(bdData?.Cutting?.target_bd_pct) || 0.1166).toFixed(4));

  const res = {
    date: dateStr,
    mixerBatchmix,
    mixerOee2,
    quadOee2,
    tuberOee2,
    fischerOee2,
    bdMixer,
    bdExtruder,
    bdCalender,
    bdCutting,
    frictionWaste,
    millingWaste,
    targets: {
      mixerBatchmix: 1300,
      mixerOee2: 76.6,
      quadOee2: 62.0,
      tuberOee2: 62.0,
      fischerOee2: 60.0,
      bdMixer: bdMixerTarget,
      bdExtruder: bdExtruderTarget,
      bdCalender: bdCalenderTarget,
      bdCutting: bdCuttingTarget,
      frictionWaste: 285,
      millingWaste: 265
    }
  };

  metricsMemoryCache.set(dateStr, { data: res, ts: Date.now() });
  return res;
}

/**
 * Extract 11 metrics for date range [startDate, endDate]
 */
async function getExportMetricsRange(startDateStr, endDateStr, forceRefresh = false) {
  if (!startDateStr || !endDateStr) return [];
  const [sY, sM, sD] = startDateStr.split('-').map(Number);
  const [eY, eM, eD] = endDateStr.split('-').map(Number);
  if (!sY || !sM || !sD || !eY || !eM || !eD) return [];

  const curr = new Date(sY, sM - 1, sD);
  const stop = new Date(eY, eM - 1, eD);
  const dates = [];

  if (curr > stop) {
    return [await getMetricsForDate(startDateStr, forceRefresh)];
  }

  let count = 0;
  while (curr <= stop && count < 60) {
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    curr.setDate(curr.getDate() + 1);
    count++;
  }

  const results = await Promise.all(dates.map(d => getMetricsForDate(d, forceRefresh)));
  return results;
}

module.exports = { getMetricsForDate, getExportMetricsRange };
