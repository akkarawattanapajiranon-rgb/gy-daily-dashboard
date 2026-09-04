const XLSX = require('xlsx');

const tuberFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Q -TUBER 6''X 8''\\Booker Sheet - 6'' x 8 ''\\2026\\9. Sep 2026  BOOKING.xls";
const quadFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\Booker Sheet\\2026\\9. Sep 2026 update Booking.xlsx";

console.log('================ TUBER BOOKING (9. Sep 2026 BOOKING.xls) ================');
const wbTuber = XLSX.readFile(tuberFile);
console.log('Sheets:', wbTuber.SheetNames);

const tuberWs1 = wbTuber.Sheets['1'];
const tuberData1 = XLSX.utils.sheet_to_json(tuberWs1, { header: 1, defval: '' });
console.log('\nTuber Day 1 - All Rows with Data:');
tuberData1.forEach((r, idx) => {
  const nonEmpties = r.map((c, i) => c !== '' ? `col${i}:${c}` : null).filter(Boolean);
  if (nonEmpties.length > 0) {
    console.log(`Row ${idx}:`, nonEmpties.join(' | '));
  }
});

console.log('\n================ QUAD BOOKING (9. Sep 2026 update Booking.xlsx) ================');
const wbQuad = XLSX.readFile(quadFile);
console.log('Sheets:', wbQuad.SheetNames);

const quadWs1 = wbQuad.Sheets['1'];
const quadData1 = XLSX.utils.sheet_to_json(quadWs1, { header: 1, defval: '' });
console.log('\nQuad Day 1 - All Rows with Data:');
quadData1.forEach((r, idx) => {
  const nonEmpties = r.map((c, i) => c !== '' ? `col${i}:${c}` : null).filter(Boolean);
  if (nonEmpties.length > 0) {
    console.log(`Row ${idx}:`, nonEmpties.join(' | '));
  }
});
