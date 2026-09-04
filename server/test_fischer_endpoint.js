const { parseFischerData } = require('./fischer_parser');

const data = parseFischerData('2026-09-03');
console.log('Parsed Fischer Data for 2026-09-03:', JSON.stringify(data.checksheet, null, 2));
