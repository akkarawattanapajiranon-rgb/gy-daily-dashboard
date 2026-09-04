const { parseQuadData } = require('./quad_parser');
const { parseTuberData } = require('./tuber_parser');
const { parse3RollData } = require('./roll3_parser');
const { parseFischerData } = require('./fischer_parser');
const { parseBreakdown } = require('./breakdown_parser');

const testDates = [
  '2026-01-15',
  '2026-02-15',
  '2026-03-15',
  '2026-04-15',
  '2026-05-15',
  '2026-06-15',
  '2026-07-15',
  '2026-08-15',
  '2026-09-01',
  '2026-10-15',
  '2026-11-15',
  '2026-12-15'
];

console.log('================ MULTI-MONTH AUTOMATIC FILE/TAB DISCOVERY TEST ================');

testDates.forEach(d => {
  console.log(`\n---------------- DATE: ${d} ----------------`);
  
  const quad = parseQuadData(d);
  console.log(`[QUAD]      OEE2: ${quad.oee?.oee2_pct ?? 'No Data'}% | Output: ${quad.output?.grandTotal ?? 0} pcs/m`);

  const tuber = parseTuberData(d);
  console.log(`[TUBER]     OEE2: ${tuber.oee?.oee2_pct ?? 'No Data'}% | Output: ${tuber.output?.grandTotal ?? 0} pcs/m`);

  const roll3 = parse3RollData(d);
  console.log(`[3 ROLL]    Target: ${roll3.target ?? 'No Data'} | Total Rolls: ${roll3.totalRolls}`);

  const fischer = parseFischerData(d);
  console.log(`[FISCHER]   OEE2: ${fischer.oee?.oee2_pct ?? 'No Data'}% | CheckSheet Total: ${fischer.checksheet?.totalProduce ?? 0} cars`);

  const breakdown = parseBreakdown(d);
  console.log(`[BREAKDOWN] Sheet: ${breakdown._sheet} | Total BD%: ${breakdown._total?.actual_bd_pct ?? 'No Data'}% | Top Loss Count: ${breakdown.topLoss?.length}`);
});
