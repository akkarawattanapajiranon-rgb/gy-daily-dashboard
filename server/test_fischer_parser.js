const { parseFischerData } = require('./fischer_parser');

['2026-09-01', '2026-09-02', '2026-09-03'].forEach(d => {
  console.log(`\n=================== FISCHER DATA FOR ${d} ===================`);
  console.log(JSON.stringify(parseFischerData(d), null, 2));
});
