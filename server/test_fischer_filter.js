const XLSX = require('xlsx');

const checkFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\2026\\09. Fischer check sheet - SEP 2026.xlsx";
const wb = XLSX.readFile(checkFile);
const ws = wb.Sheets['SEP 2026'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

const sapphireCodes = new Set();
const wsSapphire = wb.Sheets['SPEC GAUGE TREATMENT SAPPHIRE'];
if (wsSapphire) {
  const sData = XLSX.utils.sheet_to_json(wsSapphire, { header: 1, defval: '' });
  sData.slice(2).forEach(r => {
    if (r[2]) sapphireCodes.add(String(r[2]).trim().toUpperCase());
    if (r[3]) sapphireCodes.add(String(r[3]).trim().toUpperCase());
  });
}

const shifts = {
  1: { wbr: 0, sapphire: 0, total: 0 },
  2: { wbr: 0, sapphire: 0, total: 0 },
  3: { wbr: 0, sapphire: 0, total: 0 }
};

let validRowsCount = 0;
data.slice(5).forEach(row => {
  const rawDate = row[0];
  if (rawDate === '' || rawDate === undefined) return;
  
  let dStr = '';
  if (typeof rawDate === 'number') {
    const d = XLSX.SSF.parse_date_code(rawDate);
    dStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
  } else {
    dStr = String(rawDate).trim();
  }

  if (dStr !== '2026-09-03') return;

  // A row is valid ONLY IF it has material/production information filled in
  const tmCode = String(row[5] || '').trim().toUpperCase();
  const sapCode = String(row[6] || '').trim().toUpperCase();
  const code = String(row[7] || '').trim().toUpperCase();
  const speedMode = String(row[11] || '').trim().toUpperCase();
  const carQty = Number(row[27]) || 0;

  const hasContent = (tmCode !== '' || sapCode !== '' || code !== '' || speedMode !== '' || carQty > 0);

  if (!hasContent) {
    console.log(`[SKIPPED EMPTY DATE ROW]: Date=${dStr}, Shift=${row[1]}, Row cells:`, row.slice(0, 10));
    return;
  }

  validRowsCount++;
  const shift = Number(row[1]) || 1;
  const isSapphire = sapphireCodes.has(tmCode) || sapphireCodes.has(sapCode);

  if (shifts[shift]) {
    if (isSapphire) {
      shifts[shift].sapphire++;
    } else {
      shifts[shift].wbr++;
    }
    shifts[shift].total++;
  }
});

console.log('\n--- FILTERED RESULTS FOR 2026-09-03 ---');
console.log('Total Valid Production Rows:', validRowsCount);
console.log('Shift 1:', shifts[1]);
console.log('Shift 2:', shifts[2]);
console.log('Shift 3:', shifts[3]);
