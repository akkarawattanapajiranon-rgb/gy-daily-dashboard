const fs = require('fs');
const path = require('path');
const { getExtruderTimeline, __resetStore } = require('./extruder/dayStore');

async function forceRebuild() {
  console.log('=== Force Rebuilding Extruder Store Cache for All Dates (Sep 1 to 10) ===');

  const dates = [
    '2026-09-01',
    '2026-09-02',
    '2026-09-03',
    '2026-09-04',
    '2026-09-05',
    '2026-09-06',
    '2026-09-07',
    '2026-09-08',
    '2026-09-09',
    '2026-09-10'
  ];

  for (const date of dates) {
    console.log(`\nProcessing date ${date}...`);
    // Delete existing cached file to force complete refetch from Oracle DB
    const storePath = path.join(__dirname, 'extruder_store', `${date}.json`);
    if (fs.existsSync(storePath)) {
      // Check if QUAD rows are 0
      const content = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      const quadRows = content.lines?.QUAD?.rows?.length || 0;
      console.log(`Existing ${date}.json has QUAD rows: ${quadRows}`);
      if (quadRows === 0) {
        fs.unlinkSync(storePath);
        console.log(`Deleted outdated ${date}.json to force refetch.`);
      }
    }

    __resetStore();

    try {
      const result = await getExtruderTimeline(date);
      const quadSamples = result.lines?.find(l => l.line === 'QUAD')?.samples?.length || 0;
      const duplexSamples = result.lines?.find(l => l.line === 'DUPLEX')?.samples?.length || 0;
      console.log(`Rebuilt ${date}: QUAD samples=${quadSamples}, DUPLEX samples=${duplexSamples}`);
    } catch (err) {
      console.error(`Error processing ${date}:`, err.message);
    }
  }

  console.log('\n=== Extruder Cache Rebuild Complete ===');
}

forceRebuild();
