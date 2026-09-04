const { parseWasteData } = require('./waste_parser');

['2026-09-03', '2026-09-02', '2026-06-03', '2026-05-03', '2026-04-03'].forEach(d => {
  console.log(`\nDate ${d}:`, parseWasteData(d));
});
