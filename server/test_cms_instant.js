const { fetchLiveCmsData } = require('./cms_parser');

async function testInstant() {
  console.log('--- TESTING INSTANT CMS FETCH ---');
  const t0 = Date.now();
  const d1 = await fetchLiveCmsData('2026-09-03');
  console.log(`Fetch 2026-09-03 took ${Date.now() - t0}ms:`, d1);

  const t1 = Date.now();
  const d2 = await fetchLiveCmsData('2026-09-02');
  console.log(`Fetch 2026-09-02 took ${Date.now() - t1}ms:`, d2);

  const t2 = Date.now();
  const d3 = await fetchLiveCmsData('2026-01-15');
  console.log(`Fetch 2026-01-15 took ${Date.now() - t2}ms:`, d3);
}

testInstant();
