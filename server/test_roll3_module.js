const { parse3RollData } = require('./roll3_parser');

['2026-09-01', '2026-09-02', '2026-09-03'].forEach(d => {
  console.log(`\n=================== 3 ROLL PARSER TEST FOR ${d} ===================`);
  console.log(JSON.stringify(parse3RollData(d), null, 2));
});
