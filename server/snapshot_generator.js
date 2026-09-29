const fs = require('fs');
const path = require('path');
const { parseWasteData, parseWasteDataAsync } = require('./waste_parser');
const { fetchLiveCmsData } = require('./cms_parser');
const { parseBreakdown } = require('./breakdown_parser');
const { parseFischerData } = require('./fischer_parser');
const { parse3RollData } = require('./roll3_parser');
const { parse4Roll2Data } = require('./roll42_parser');
const { parseQuadData } = require('./quad_parser');
const { parseTuberData } = require('./tuber_parser');
const { parseWorkawayData } = require('./workaway_parser');
const { parseWeeklyOee } = require('./weekly_oee_parser');
const { parseAeroDelay } = require('./aero_delay_parser');
const { parseWbrDelay } = require('./wbr_delay_parser');

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const CLIENT_SNAPSHOT_DIR = path.join(__dirname, '..', 'src', 'data', 'snapshots');

if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
if (!fs.existsSync(CLIENT_SNAPSHOT_DIR)) fs.mkdirSync(CLIENT_SNAPSHOT_DIR, { recursive: true });

async function generateSnapshot(dateStr) {
  console.log(`[Snapshot Generator] Building daily snapshot for ${dateStr}...`);
  try {
    const waste = await parseWasteDataAsync(dateStr);
    await new Promise(r => setImmediate(r));
    const cms = await fetchLiveCmsData(dateStr);
    await new Promise(r => setImmediate(r));
    const breakdown = parseBreakdown(dateStr);
    await new Promise(r => setImmediate(r));
    const fischer = parseFischerData(dateStr);
    await new Promise(r => setImmediate(r));
    const roll3 = parse3RollData(dateStr);
    await new Promise(r => setImmediate(r));
    const roll42 = parse4Roll2Data(dateStr);
    await new Promise(r => setImmediate(r));
    const quad = parseQuadData(dateStr);
    await new Promise(r => setImmediate(r));
    const tuber = parseTuberData(dateStr);
    await new Promise(r => setImmediate(r));
    const workaway = parseWorkawayData(dateStr);
    await new Promise(r => setImmediate(r));
    const weeklyOee = parseWeeklyOee(dateStr);
    await new Promise(r => setImmediate(r));
    const aeroDelay = parseAeroDelay(dateStr);
    await new Promise(r => setImmediate(r));
    const wbrDelay = parseWbrDelay(dateStr);

    const existing = getSnapshot(dateStr) || {};

    const target3Roll = roll3?.totalRolls ?? existing.target3Roll ?? 0;

    function hasValidData(val) {
      if (!val || val.error) return false;
      if (val.hasData === true) return true;
      if (Array.isArray(val) && val.length > 0) return true;
      if (val.topLoss && val.topLoss.length > 0) return true;
      if (val.activeWeek) return true;
      if (val.output && val.output.hasData) return true;
      if (val.oee && val.oee.hasData) return true;
      if (val.checksheet && val.checksheet.hasData) return true;
      if (val.summary) return true;
      if (val.items && val.items.length > 0) return true;
      if (val.totalRolls !== undefined && val.totalRolls !== null && val.totalRolls > 0) return true;
      if (val.totalQty !== undefined && val.totalQty !== null && val.totalQty > 0) return true;
      return false;
    }

    function pickBest(newVal, existingVal) {
      if (hasValidData(newVal)) return newVal;
      if (hasValidData(existingVal)) return existingVal;
      return (newVal && !newVal.error) ? newVal : (existingVal || null);
    }

    const snapshot = {
      date: dateStr,
      generatedAt: new Date().toISOString(),
      waste: pickBest(waste, existing.waste),
      cms: pickBest(cms, existing.cms),
      target3Roll,
      breakdown: pickBest(breakdown, existing.breakdown),
      fischer: pickBest(fischer, existing.fischer),
      roll3: pickBest(roll3, existing.roll3),
      roll42: pickBest(roll42, existing.roll42),
      quad: pickBest(quad, existing.quad),
      tuber: pickBest(tuber, existing.tuber),
      workaway: pickBest(workaway, existing.workaway),
      weeklyOee: pickBest(weeklyOee, existing.weeklyOee),
      aeroDelay: pickBest(aeroDelay, existing.aeroDelay),
      wbrDelay: pickBest(wbrDelay, existing.wbrDelay)
    };

    const fileName = `${dateStr}.json`;
    const snapJson = JSON.stringify(snapshot, null, 2);
    fs.writeFileSync(path.join(SNAPSHOT_DIR, fileName), snapJson, 'utf8');
    fs.writeFileSync(path.join(CLIENT_SNAPSHOT_DIR, fileName), snapJson, 'utf8');

    const publicSnapDir = path.join(__dirname, '..', 'public', 'data', 'snapshots');
    if (!fs.existsSync(publicSnapDir)) fs.mkdirSync(publicSnapDir, { recursive: true });
    fs.writeFileSync(path.join(publicSnapDir, fileName), snapJson, 'utf8');

    const distSnapDir = path.join(__dirname, '..', 'dist', 'data', 'snapshots');
    if (fs.existsSync(path.join(__dirname, '..', 'dist'))) {
      if (!fs.existsSync(distSnapDir)) fs.mkdirSync(distSnapDir, { recursive: true });
      fs.writeFileSync(path.join(distSnapDir, fileName), snapJson, 'utf8');
    }

    console.log(`[Snapshot Generator] Successfully saved ${fileName} (${(snapJson.length / 1024).toFixed(1)} KB)`);

    return snapshot;
  } catch (err) {
    console.error(`[Snapshot Generator] Error generating snapshot for ${dateStr}:`, err.message);
    return null;
  }
}

function getSnapshot(dateStr) {
  try {
    const filePath = path.join(SNAPSHOT_DIR, `${dateStr}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    const clientPath = path.join(CLIENT_SNAPSHOT_DIR, `${dateStr}.json`);
    if (fs.existsSync(clientPath)) {
      return JSON.parse(fs.readFileSync(clientPath, 'utf8'));
    }
  } catch (e) {
    console.error(`Error reading snapshot for ${dateStr}:`, e.message);
  }
  return null;
}

module.exports = {
  generateSnapshot,
  getSnapshot
};
