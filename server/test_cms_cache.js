const { fetchLiveCmsData } = require('./cms_parser');

async function runTest() {
  console.log('--- TEST 1: Fetching 2026-09-02 ---');
  const res1 = await fetchLiveCmsData('2026-09-02');
  console.log('Res 1:', res1);

  console.log('\n--- TEST 2: Instant Cache Fetch 2026-09-02 ---');
  const res2 = await fetchLiveCmsData('2026-09-02');
  console.log('Res 2:', res2);

  console.log('\n--- TEST 3: Fetching 2026-09-03 ---');
  const res3 = await fetchLiveCmsData('2026-09-03');
  console.log('Res 3:', res3);
}

runTest();
