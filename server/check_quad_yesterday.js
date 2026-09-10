const { getExtruderTimeline } = require('./extruder/dayStore');

async function test() {
  console.log('--- Checking QUAD Extruder Timeline for 2026-09-09 ---');
  const res = await getExtruderTimeline('2026-09-09');
  console.log('Result for 2026-09-09:');
  console.log('QUAD:', res.QUAD ? res.QUAD.samples?.length : res);
  console.log('DUPLEX:', res.DUPLEX ? res.DUPLEX.samples?.length : res);
}

test();
