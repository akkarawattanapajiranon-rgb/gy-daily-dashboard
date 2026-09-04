try {
  const XLSX = require('xlsx');
  console.log('xlsx OK');
} catch(e) {
  console.log('ERROR:', e.message);
}
