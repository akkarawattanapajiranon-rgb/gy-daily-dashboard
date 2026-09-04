const { parseWasteData } = require('./waste_parser');

const res = parseWasteData('2026-09-03');
console.log('Current waste_parser result for 2026-09-03:', JSON.stringify(res, null, 2));
