const XLSX = require('xlsx');
const path = require('path');

const oeeFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\OEE 2 Sep,2026.xlsx";
const tuberFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Q -TUBER 6''X 8''\\Booker Sheet - 6'' x 8 ''\\2026\\9. Sep 2026  BOOKING.xls";
const quadFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\Booker Sheet\\2026\\9. Sep 2026 update Booking.xlsx";

console.log('================ OEE FILE INSPECTION ================');
const wbOee = XLSX.readFile(oeeFile);

['ALL OEE ( Sep, 26) QUAD ', 'ALL OEE ( Sep, 26) 6x8 Ext. '].forEach(sheetName => {
  console.log(`\n--- Sheet: "${sheetName}" ---`);
  const ws = wbOee.Sheets[sheetName];
  if (!ws) {
    console.log('Sheet not found!');
    return;
  }
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  data.slice(0, 15).forEach((r, idx) => {
    console.log(`Row ${idx}:`, r.slice(0, 15));
  });
});

console.log('\n================ TUBER BOOKING FILE INSPECTION ================');
const wbTuber = XLSX.readFile(tuberFile);
console.log('Tuber Sheet Names (first 10):', wbTuber.SheetNames.slice(0, 10));
const tuberWs = wbTuber.Sheets[wbTuber.SheetNames[0]]; // first daily sheet
const tuberData = XLSX.utils.sheet_to_json(tuberWs, { header: 1, defval: '' });
console.log(`\n--- Tuber Sheet: "${wbTuber.SheetNames[0]}" ---`);
tuberData.slice(0, 25).forEach((r, idx) => {
  console.log(`Row ${idx}:`, r.slice(0, 12));
});

console.log('\n================ QUAD BOOKING FILE INSPECTION ================');
const wbQuad = XLSX.readFile(quadFile);
console.log('Quad Sheet Names (first 10):', wbQuad.SheetNames.slice(0, 10));
const quadWs = wbQuad.Sheets[wbQuad.SheetNames[0]]; // first daily sheet
const quadData = XLSX.utils.sheet_to_json(quadWs, { header: 1, defval: '' });
console.log(`\n--- Quad Sheet: "${wbQuad.SheetNames[0]}" ---`);
quadData.slice(0, 25).forEach((r, idx) => {
  console.log(`Row ${idx}:`, r.slice(0, 12));
});
