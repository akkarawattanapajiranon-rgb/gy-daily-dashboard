const { parseQuadData } = require('./quad_parser');

const dates = [
  '2026-01-15',
  '2026-02-15',
  '2026-03-15',
  '2026-04-15',
  '2026-05-15',
  '2026-06-15',
  '2026-07-15',
  '2026-08-15',
  '2026-09-01'
];

dates.forEach(d => {
  const res = parseQuadData(d);
  console.log(`[QUAD] Date: ${d} | OEE HasData: ${res.oee?.hasData} (OEE2: ${res.oee?.oee2_pct}%) | Output HasData: ${res.output?.hasData} (Total: ${res.output?.grandTotal})`);
});
