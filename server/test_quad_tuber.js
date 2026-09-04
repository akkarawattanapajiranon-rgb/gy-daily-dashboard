const { parseQuadData } = require('./quad_parser');
const { parseTuberData } = require('./tuber_parser');

['2026-09-01', '2026-09-02', '2026-09-03'].forEach(date => {
  console.log(`\n================ QUAD DATA FOR ${date} ================`);
  const quad = parseQuadData(date);
  console.log('QUAD OEE:', quad.oee);
  console.log('QUAD Output GrandTotal:', quad.output.grandTotal, 'Top Codes:', quad.output.codeBreakdown ? quad.output.codeBreakdown.slice(0, 5) : []);

  console.log(`\n================ TUBER DATA FOR ${date} ================`);
  const tuber = parseTuberData(date);
  console.log('TUBER OEE:', tuber.oee);
  console.log('TUBER Output GrandTotal:', tuber.output.grandTotal, 'Top Codes:', tuber.output.codeBreakdown ? tuber.output.codeBreakdown.slice(0, 5) : []);
});
