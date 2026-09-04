const XLSX = require('xlsx');

const fileOEE = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\OEE - 2026 TRACKING - SHEAR FISCHER.xlsx';
const wbOEE = XLSX.readFile(fileOEE);

const MONTH_SHEETS = {
  '01': 'oee_summary_JAN 26',
  '02': 'oee_summary_FEB 26',
  '03': 'oee_summary_MAR 26',
  '04': 'oee_summary_APR 26',
  '05': 'oee_summary_MAY 26',
  '06': 'oee_summary_JUN 26',
  '07': 'oee_summary_JUL 26',
  '08': 'oee_summary_AUG 26',
  '09': 'oee_summary_SEP 26',
  '10': 'oee_summary_OCT 26',
  '11': 'oee_summary_NOV 26',
  '12': 'oee_summary_DEC 26',
};

function parseOEE(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const monthKey = month;
  
  let sheetName = MONTH_SHEETS[monthKey];
  if (!sheetName || !wbOEE.SheetNames.includes(sheetName)) {
    sheetName = wbOEE.SheetNames.find(s => s.toLowerCase().includes(`sep`)) || wbOEE.SheetNames[0];
  }

  const ws = wbOEE.Sheets[sheetName];
  if (!ws) return { error: `Sheet ${sheetName} not found` };

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  
  // Find row matching the date
  let matchedRow = null;
  data.forEach((row, i) => {
    if (i === 0) return; // skip header
    const rawDate = row[0];
    if (rawDate === '' || rawDate === undefined) return;
    
    let dStr = '';
    if (typeof rawDate === 'number') {
      const d = XLSX.SSF.parse_date_code(rawDate);
      dStr = `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
    } else if (typeof rawDate === 'string') {
      dStr = rawDate.trim();
    }

    if (dStr === dateStr) {
      matchedRow = row;
    }
  });

  if (!matchedRow) {
    return { error: `No OEE data found for date ${dateStr}` };
  }

  // Row columns: Date, TARGET, SR, Max SR, AR, PR, QR, OEE1, OEE2
  const target = Number(matchedRow[1]) || 0;
  const sr = Number(matchedRow[2]) || 0;
  const ar = Number(matchedRow[4]) || 0;
  const pr = Number(matchedRow[5]) || 0;
  const qr = Number(matchedRow[6]) || 0;
  const oee1 = Number(matchedRow[7]) || 0;
  const oee2 = Number(matchedRow[8]) || 0;

  return {
    date: dateStr,
    sheet: sheetName,
    target_pct: parseFloat((target * 100).toFixed(2)),
    sr_pct: parseFloat((sr * 100).toFixed(2)),
    ar_pct: parseFloat((ar * 100).toFixed(2)),
    pr_pct: parseFloat((pr * 100).toFixed(2)),
    qr_pct: parseFloat((qr * 100).toFixed(2)),
    oee1_pct: parseFloat((oee1 * 100).toFixed(2)),
    oee2_pct: parseFloat((oee2 * 100).toFixed(2)),
  };
}

['2026-09-01', '2026-09-02', '2026-09-03'].forEach(d => {
  console.log(`\n=== OEE for ${d} ===`);
  console.log(JSON.stringify(parseOEE(d), null, 2));
});
