const XLSX = require('xlsx');

const filePath = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown\\Issue log 2026 _ BCA 14AUG2026.xlsx';
const wb = XLSX.readFile(filePath);

const ws = wb.Sheets['Daliy seen Sep2'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

data.slice(1).forEach((row, i) => {
  if (row.some(c => c !== '')) {
    const rawDate = row[0];
    let parsedDate = rawDate;
    if (typeof rawDate === 'number') {
      const d = XLSX.SSF.parse_date_code(rawDate);
      parsedDate = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
    }
    console.log(`Row ${i+1}: Date=${parsedDate} (${rawDate}), Machine=${row[2]}, Zone=${row[3]}, Issue=${row[4]}, Duration=${row[14]}`);
  }
});
