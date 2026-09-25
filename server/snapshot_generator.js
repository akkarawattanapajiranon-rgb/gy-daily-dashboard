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

    const target3Roll = roll3?.totalRolls || 0;

    const snapshot = {
      date: dateStr,
      generatedAt: new Date().toISOString(),
      waste: waste && !waste.error ? waste : null,
      cms: cms && !cms.error ? cms : null,
      target3Roll,
      breakdown: breakdown && !breakdown.error ? breakdown : null,
      fischer: fischer && !fischer.error ? fischer : null,
      roll3: roll3 && !roll3.error ? roll3 : null,
      roll42: roll42 && !roll42.error ? roll42 : null,
      quad: quad && !quad.error ? quad : null,
      tuber: tuber && !tuber.error ? tuber : null,
      workaway: workaway && !workaway.error ? workaway : null,
      weeklyOee: weeklyOee && !weeklyOee.error ? weeklyOee : null,
      aeroDelay: aeroDelay && !aeroDelay.error ? aeroDelay : null,
      wbrDelay: wbrDelay && !wbrDelay.error ? wbrDelay : null
    };

    const fileName = `${dateStr}.json`;
    fs.writeFileSync(path.join(SNAPSHOT_DIR, fileName), JSON.stringify(snapshot, null, 2), 'utf8');
    fs.writeFileSync(path.join(CLIENT_SNAPSHOT_DIR, fileName), JSON.stringify(snapshot, null, 2), 'utf8');

    console.log(`[Snapshot Generator] Successfully saved ${fileName} (${(JSON.stringify(snapshot).length / 1024).toFixed(1)} KB)`);

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
