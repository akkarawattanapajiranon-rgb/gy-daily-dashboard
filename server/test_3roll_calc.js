const XLSX = require('xlsx');

const filePath = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\3 Roll\\2026\\9 -Treatment Release SEP 2026.xls';
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets['WINDUP'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

['2026-09-01', '2026-09-02', '2026-09-03'].forEach(targetDate => {
  console.log(`\n=================== 3 ROLL WINDUP FOR ${targetDate} ===================`);
  
  const codeCounts = {};
  let totalRolls = 0;

  data.slice(5).forEach(row => {
    const rawDate = row[1]; // Col B (index 1) = CALENDER DATE
    if (rawDate === '' || rawDate === undefined) return;

    let dStr = '';
    if (typeof rawDate === 'number') {
      const d = XLSX.SSF.parse_date_code(rawDate);
      dStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
    } else if (typeof rawDate === 'string') {
      dStr = rawDate.trim();
    }

    if (dStr === targetDate) {
      totalRolls++;
      const code = String(row[2]).trim().toUpperCase() || 'UNKNOWN'; // Col C (index 2) = LOCAL TREATMENT CODE
      codeCounts[code] = (codeCounts[code] || 0) + 1;
    }
  });

  console.log(`Total Rolls (ม้วนทั้งหมด): ${totalRolls}`);
  console.log('Breakdown by Code (Col C):', JSON.stringify(codeCounts, null, 2));
});
