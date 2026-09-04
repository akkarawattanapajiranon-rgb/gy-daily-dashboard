const XLSX = require('xlsx');

const tuberFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Q -TUBER 6''X 8''\\Booker Sheet - 6'' x 8 ''\\2026\\9. Sep 2026  BOOKING.xls";
const quadFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\Booker Sheet\\2026\\9. Sep 2026 update Booking.xlsx";

function parseTuberBooking(dayNumber) {
  const wb = XLSX.readFile(tuberFile);
  const sheetName = String(dayNumber);
  const ws = wb.Sheets[sheetName];
  if (!ws) return { error: `Sheet ${sheetName} not found` };

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const shifts = {
    1: { name: 'Shift 1 (กะ 1)', items: [], totalQty: 0 },
    2: { name: 'Shift 2 (กะ 2)', items: [], totalQty: 0 },
    3: { name: 'Shift 3 (กะ 3)', items: [], totalQty: 0 }
  };

  const shiftRanges = [
    { shift: 1, start: 7, end: 43 },
    { shift: 2, start: 49, end: 84 },
    { shift: 3, start: 92, end: 130 }
  ];

  shiftRanges.forEach(sr => {
    const rows = data.slice(sr.start, sr.end);
    rows.forEach(r => {
      const partId = String(r[0]).trim();
      let code = '';
      for (let c = 1; c <= 11; c++) {
        if (r[c] !== '') {
          code = String(r[c]).trim();
          break;
        }
      }
      const qtyTarget = Number(r[16]) || 0;
      const qtyProduced = Number(r[17]) || 0;

      if (code || partId) {
        if (code && qtyProduced > 0) {
          shifts[sr.shift].items.push({ partId, code, qtyTarget, qtyProduced });
          shifts[sr.shift].totalQty += qtyProduced;
        }
      }
    });
  });

  const grandTotal = shifts[1].totalQty + shifts[2].totalQty + shifts[3].totalQty;

  return { day: dayNumber, grandTotal, shifts };
}

function parseQuadBooking(dayNumber) {
  const wb = XLSX.readFile(quadFile);
  const sheetName = String(dayNumber);
  const ws = wb.Sheets[sheetName];
  if (!ws) return { error: `Sheet ${sheetName} not found` };

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const shifts = {
    1: { name: 'Shift 1 (กะ 1)', items: [], totalQty: 0 },
    2: { name: 'Shift 2 (กะ 2)', items: [], totalQty: 0 },
    3: { name: 'Shift 3 (กะ 3)', items: [], totalQty: 0 }
  };

  const shiftRanges = [
    { shift: 1, start: 19, end: 43 },
    { shift: 2, start: 67, end: 89 },
    { shift: 3, start: 113, end: 137 }
  ];

  shiftRanges.forEach(sr => {
    const rows = data.slice(sr.start, sr.end);
    rows.forEach(r => {
      const partId = String(r[0]).trim();
      const code1 = String(r[1]).trim();
      const code2 = String(r[3]).trim();
      const code = code1 || code2;

      const qtyTarget = Number(r[4]) || 0;
      const qtyProduced = Number(r[5]) || 0;
      const qtySapphire = Number(r[7]) || 0;

      if ((code || partId) && (qtyProduced > 0 || qtySapphire > 0)) {
        shifts[sr.shift].items.push({ partId, code1, code2, code, qtyTarget, qtyProduced, qtySapphire });
        shifts[sr.shift].totalQty += (qtyProduced + qtySapphire);
      }
    });
  });

  const grandTotal = shifts[1].totalQty + shifts[2].totalQty + shifts[3].totalQty;

  return { day: dayNumber, grandTotal, shifts };
}

console.log('=== TEST TUBER BOOKING DAY 1 ===');
console.log(JSON.stringify(parseTuberBooking(1), null, 2));

console.log('\n=== TEST QUAD BOOKING DAY 1 ===');
console.log(JSON.stringify(parseQuadBooking(1), null, 2));
