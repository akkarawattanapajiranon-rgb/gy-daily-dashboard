const { parseBreakdown } = require('./breakdown_parser');

// Test Sep 1 and Sep 2
['2026-09-01', '2026-09-02', '2026-09-03'].forEach(d => {
  console.log('\n=== Date:', d, '===');
  console.log(JSON.stringify(parseBreakdown(d), null, 2));
});
