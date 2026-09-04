const XLSX = require('xlsx');

const tuberFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Q -TUBER 6''X 8''\\Booker Sheet - 6'' x 8 ''\\2026\\9. Sep 2026  BOOKING.xls";
const quadFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\Booker Sheet\\2026\\9. Sep 2026 update Booking.xlsx";

function analyzeBooking(filePath, name) {
  console.log(`\n================ ${name} ANALYSIS ================`);
  const wb = XLSX.readFile(filePath);
  // Pick tab '1'
  const ws = wb.Sheets['1'];
  if (!ws) {
    console.log('Tab "1" not found!');
    return;
  }
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  console.log('Total Rows:', data.length);
  
  // Find where SHIFT 1, SHIFT 2, SHIFT 3 appear
  data.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      const s = String(cell).trim().toUpperCase();
      if (s.includes('SHIFT') || s.includes('กะ')) {
        console.log(`Row ${rIdx}, Col ${cIdx}: "${cell}"`);
      }
    });
  });
}

analyzeBooking(tuberFile, 'TUBER BOOKING');
analyzeBooking(quadFile, 'QUAD BOOKING');
