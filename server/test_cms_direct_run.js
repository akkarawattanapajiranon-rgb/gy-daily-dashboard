const { fetchLiveCmsData } = require('./cms_parser');

async function testAll() {
  for (const date of ['2026-09-01', '2026-09-02', '2026-09-03']) {
    console.log(`\n=== LIVE CMS DATA FOR ${date} ===`);
    const data = await fetchLiveCmsData(date);
    console.log(JSON.stringify(data, null, 2));
  }
}

testAll();
