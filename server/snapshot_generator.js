const fs = require('fs');
const path = require('path');
const { parseWasteData } = require('./waste_parser');
const { fetchLiveCmsData } = require('./cms_parser');
const { parseBreakdown } = require('./breakdown_parser');
const { parseFischerData } = require('./fischer_parser');
const { parse3RollData } = require('./roll3_parser');
const { parseQuadData } = require('./quad_parser');
const { parseTuberData } = require('./tuber_parser');
const { parseWorkawayData } = require('./workaway_parser');
const { parseWeeklyOee } = require('./weekly_oee_parser');

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const CLIENT_SNAPSHOT_DIR = path.join(__dirname, '..', 'src', 'data', 'snapshots');

if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
if (!fs.existsSync(CLIENT_SNAPSHOT_DIR)) fs.mkdirSync(CLIENT_SNAPSHOT_DIR, { recursive: true });

async function generateSnapshot(dateStr) {
  console.log(`[Snapshot Generator] Building daily snapshot for ${dateStr}...`);
  try {
    const waste = parseWasteData(dateStr);
    const cms = await fetchLiveCmsData(dateStr);
    const breakdown = parseBreakdown(dateStr);
    const fischer = parseFischerData(dateStr);
    const roll3 = parse3RollData(dateStr);
    const quad = parseQuadData(dateStr);
    const tuber = parseTuberData(dateStr);
    const workaway = parseWorkawayData(dateStr);
    const weeklyOee = parseWeeklyOee(dateStr);

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
      quad: quad && !quad.error ? quad : null,
      tuber: tuber && !tuber.error ? tuber : null,
      workaway: workaway && !workaway.error ? workaway : null,
      weeklyOee: weeklyOee && !weeklyOee.error ? weeklyOee : null
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
