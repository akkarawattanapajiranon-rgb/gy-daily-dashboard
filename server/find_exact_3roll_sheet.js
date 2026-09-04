const XLSX = require('xlsx');

const file = "T:\\10.30 A.M. Production Meeting\\5 BTA\\3 Roll\\2026\\9 -Treatment Release SEP 2026.xls";

const wb = XLSX.readFile(file);
console.log('All Sheet Names in 9 -Treatment Release SEP 2026.xls:');
wb.SheetNames.forEach((s, idx) => console.log(` [${idx}] "${s}"`));

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  let countForDay3 = 0;
  let countReleaseDay3 = 0;
  const codesDay3 = {};

  data.forEach((r, rIdx) => {
    const rawDate = r[1] !== undefined && r[1] !== '' ? r[1] : r[0];
    let dDay = null;

    if (typeof rawDate === 'number') {
      const d = XLSX.SSF.parse_date_code(rawDate);
      dDay = d.d;
    } else if (typeof rawDate === 'string' && rawDate.trim() !== '') {
      const s = rawDate.trim().toLowerCase();
      if (s.includes('3-sep') || s === '3') dDay = 3;
      else {
        const parsed = parseInt(s, 10);
        if (!isNaN(parsed) && parsed === 3) dDay = 3;
      }
    }

    if (dDay === 3) {
      countForDay3++;
      const code = String(r[2] || r[3] || '').trim();
      const status = String(r[26] || r[25] || '').trim().toUpperCase();

      if (code && code !== '0') {
        codesDay3[code] = (codesDay3[code] || 0) + 1;
      }
      if (status.includes('RELEASE')) {
        countReleaseDay3++;
      }
    }
  });

  if (countForDay3 > 0) {
    console.log(`\n--- Sheet "${sheetName}" ---`);
    console.log(`  Total rows for Day 3 (3-Sep): ${countForDay3}`);
    console.log(`  RELEASE rows for Day 3: ${countReleaseDay3}`);
    console.log(`  Codes found:`, codesDay3);
  }
});
