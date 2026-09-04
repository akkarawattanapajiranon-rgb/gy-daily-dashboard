const XLSX = require('xlsx');

const tuberFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Q -TUBER 6''X 8''\\Booker Sheet - 6'' x 8 ''\\2026\\9. Sep 2026  BOOKING.xls";
const quadFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\Booker Sheet\\2026\\9. Sep 2026 update Booking.xlsx";

function examineQuadShiftData(daySheet) {
  console.log(`\n================ QUAD BOOKING - DAY ${daySheet} ================`);
  const wb = XLSX.readFile(quadFile);
  const ws = wb.Sheets[daySheet];
  if (!ws) {
    console.log(`Sheet ${daySheet} not found`);
    return;
  }
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Print Header Row around Row 4 & 5
  console.log('Header Row 4:', data[4].slice(0, 10));
  console.log('Header Row 5:', data[5].slice(0, 10));

  const shifts = [
    { name: 'Shift 1', start: 18, end: 47 },
    { name: 'Shift 2', start: 60, end: 93 },
    { name: 'Shift 3', start: 106, end: 140 }
  ];

  shifts.forEach(s => {
    console.log(`\n--- Quad ${s.name} ---`);
    const rows = data.slice(s.start, s.end);
    rows.forEach((r, idx) => {
      const partId = r[0];
      const code1 = r[1]; // Tread Code
      const code2 = r[3]; // CAP/BASE Code
      const qty1 = r[4];  // Order Qty
      const qty2 = r[5];  // Actual Qty Produced (ทำได้)
      const qty3 = r[7];  // Sapphires (ทำได้)
      
      if (partId || code1 || code2 || qty2) {
        console.log(`Row ${s.start + idx}: PartID="${partId}", Code1="${code1}", Code2="${code2}", QtyPlan=${qty1}, QtyProd=${qty2}, QtySapphire=${qty3}`);
      }
    });
  });
}

function examineTuberShiftData(daySheet) {
  console.log(`\n================ TUBER BOOKING - DAY ${daySheet} ================`);
  const wb = XLSX.readFile(tuberFile);
  const ws = wb.Sheets[daySheet];
  if (!ws) {
    console.log(`Sheet ${daySheet} not found`);
    return;
  }
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Print Header Row around Row 4 & 5
  console.log('Header Row 4:', data[4].slice(0, 12));
  console.log('Header Row 5:', data[5].slice(0, 12));

  const shifts = [
    { name: 'Shift 1', start: 7, end: 45 },
    { name: 'Shift 2', start: 46, end: 88 },
    { name: 'Shift 3', start: 89, end: 135 }
  ];

  shifts.forEach(s => {
    console.log(`\n--- Tuber ${s.name} ---`);
    const rows = data.slice(s.start, s.end);
    rows.forEach((r, idx) => {
      const partId = r[0];
      // Print non-empty items across columns 1..11
      const codes = [];
      for (let c = 1; c <= 11; c++) {
        if (r[c] !== '') codes.push(`col${c}:${r[c]}`);
      }
      if (partId || codes.length > 0) {
        console.log(`Row ${s.start + idx}: PartID="${partId}", Data=[${codes.join(', ')}]`);
      }
    });
  });
}

examineQuadShiftData('1');
examineTuberShiftData('1');
