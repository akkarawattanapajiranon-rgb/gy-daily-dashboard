const XLSX = require('xlsx');

const filePath = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown\\Issue log 2026 _ BCA 14AUG2026.xlsx';
const wb = XLSX.readFile(filePath);
const wsDaily = wb.Sheets['Daliy seen Sep2'];
const dailyData = XLSX.utils.sheet_to_json(wsDaily, { header: 1, defval: '' });

function normalizeMachineKey(name) {
  return String(name).trim().toLowerCase()
    .replace(/#/g, '')
    .replace(/\s+/g, '');
}

['2026-09-01', '2026-09-02'].forEach(targetDate => {
  console.log(`\n================ Grouping Test: ${targetDate} ================`);
  const grouped = {};

  dailyData.slice(1).forEach(row => {
    if (!row.some(c => c !== '')) return;
    const rawDate = row[0];
    let rowDateStr = '';
    if (typeof rawDate === 'number') {
      const d = XLSX.SSF.parse_date_code(rawDate);
      rowDateStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
    }

    if (rowDateStr === targetDate) {
      const machineRaw = String(row[2]).trim();
      if (!machineRaw) return;
      const key = normalizeMachineKey(machineRaw);
      const durationMin = Number(row[14]) || 0;

      if (!grouped[key]) {
        grouped[key] = {
          machine: machineRaw,
          totalDurationMin: 0,
          details: []
        };
      }

      grouped[key].totalDurationMin += durationMin;
      grouped[key].details.push({
        shift: String(row[1]).trim(),
        zone: String(row[3]).trim(),
        symptom: String(row[4]).trim(),
        cause: String(row[5]).trim(),
        action: String(row[6]).trim(),
        durationMin: durationMin,
        fixBy: String(row[17]).trim()
      });
    }
  });

  const list = Object.values(grouped).sort((a, b) => b.totalDurationMin - a.totalDurationMin).slice(0, 5);
  console.log(JSON.stringify(list, null, 2));
});
