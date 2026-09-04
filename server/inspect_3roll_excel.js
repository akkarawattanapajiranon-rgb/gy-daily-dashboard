const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const file = "T:\\10.30 A.M. Production Meeting\\5 BTA\\3 Roll\\2026\\9 - Treatment Release SEP 2026.xls";

if (fs.existsSync(file)) {
  console.log('--- INSPECTING 3 ROLL SEP 2026 FILE ---');
  const wb = XLSX.readFile(file);
  console.log('Sheets:', wb.SheetNames);
  
  const windSheet = wb.SheetNames.find(s => s.toLowerCase().includes('wind')) || wb.SheetNames[0];
  console.log(`Using sheet: ${windSheet}`);
  const ws = wb.Sheets[windSheet];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('Total rows in sheet:', data.length);

  // Print first 20 rows
  data.slice(0, 20).forEach((r, idx) => console.log(`Row ${idx}:`, r.slice(0, 10)));

  console.log('\n--- LOOKING FOR DATE 3-Sep (or dayNum = 3) ---');
  data.forEach((r, idx) => {
    const rawDate = r[0];
    let dDay = null;
    if (typeof rawDate === 'number') {
      const d = XLSX.SSF.parse_date_code(rawDate);
      dDay = d.d;
    } else if (typeof rawDate === 'string' && rawDate.trim() !== '') {
      const parsed = parseInt(rawDate.trim(), 10);
      if (!isNaN(parsed)) dDay = parsed;
    }

    if (dDay === 3) {
      console.log(`Day 3 Row ${idx}:`, r.slice(0, 8));
    }
  });
} else {
  console.log('Sep 3 Roll file not found');
}
