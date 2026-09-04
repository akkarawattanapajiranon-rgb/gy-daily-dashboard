const XLSX = require('xlsx');

const checkFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\2026\\09. Fischer check sheet - SEP 2026.xlsx";
const wb = XLSX.readFile(checkFile);
const ws = wb.Sheets['SEP 2026'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

data.slice(165, 220).forEach((r, idx) => {
  const rowIdx = idx + 165;
  const rawDate = r[0];
  if (!rawDate) return;
  
  let dStr = '';
  if (typeof rawDate === 'number') {
    const d = XLSX.SSF.parse_date_code(rawDate);
    dStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  } else {
    dStr = String(rawDate).trim();
  }
  
  const tmCode = String(r[5] || '').trim();
  const sapCode = String(r[6] || '').trim();
  const specCode = String(r[10] || '').trim(); // or Col 6/7/8/9
  const hasMaterialCode = tmCode !== '' || sapCode !== '' || specCode !== '';
  
  console.log(`Row ${rowIdx}: Date="${dStr}", Shift="${r[1]}", TM="${tmCode}", SAP="${sapCode}", Spec="${specCode}", hasMaterialCode=${hasMaterialCode}`);
});
