const { parseBreakdown } = require('./breakdown_parser');

['2026-09-01', '2026-09-02', '2026-09-03'].forEach(date => {
  console.log(`\n=================== DATE: ${date} ===================`);
  const res = parseBreakdown(date);
  console.log(JSON.stringify(res, null, 2));
});
