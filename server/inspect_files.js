const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const tuberBookingDir = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Q -TUBER 6''X 8''\\Booker Sheet - 6'' x 8 ''\\2026";
const quadBookingDir = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\Booker Sheet\\2026";
const oeeFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\OEE 2 Sep,2026.xlsx";

console.log('=== TUBER BOOKING DIR FILES ===');
if (fs.existsSync(tuberBookingDir)) {
  console.log(fs.readdirSync(tuberBookingDir));
} else {
  console.log('Not found:', tuberBookingDir);
}

console.log('\n=== QUAD BOOKING DIR FILES ===');
if (fs.existsSync(quadBookingDir)) {
  console.log(fs.readdirSync(quadBookingDir));
} else {
  console.log('Not found:', quadBookingDir);
}

console.log('\n=== OEE FILE SHEETS ===');
if (fs.existsSync(oeeFile)) {
  const wb = XLSX.readFile(oeeFile, { bookSheets: true });
  console.log(wb.SheetNames);
} else {
  console.log('Not found:', oeeFile);
}
