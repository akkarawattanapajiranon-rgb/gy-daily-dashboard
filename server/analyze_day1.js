const XLSX = require('xlsx');

const fileCheck = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\2026\\09. Fischer check sheet - SEP 2026.xlsx';
const wbCheck = XLSX.readFile(fileCheck);

// Check Sapphire list from 'SPEC GAUGE TREATMENT SAPPHIRE' sheet
const wsSapphire = wbCheck.Sheets['SPEC GAUGE TREATMENT SAPPHIRE'];
const sapphireData = XLSX.utils.sheet_to_json(wsSapphire, { header: 1, defval: '' });
const sapphireCodes = new Set();

sapphireData.slice(2).forEach(r => {
  if (r[2]) sapphireCodes.add(String(r[2]).trim().toUpperCase()); // TM Code (e.g. JR52, JR45)
  if (r[3]) sapphireCodes.add(String(r[3]).trim().toUpperCase()); // SAP Code / Local Code (e.g. TH-TF01044)
});

console.log('Sapphire TM/SAP Codes:', Array.from(sapphireCodes));

// Check rows for Date 46266 (1-Sep-26) in SEP 2026
const ws = wbCheck.Sheets['SEP 2026'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

const day1Rows = data.slice(5).filter(r => r[0] === 46266 || String(r[0]).trim() === '46266' || String(r[0]).includes('1-Sep'));

console.log(`\nFound ${day1Rows.length} rows for 1-Sep-26`);

// Print each row's key columns
day1Rows.forEach((r, idx) => {
  const shift = r[1];
  const tmCode = String(r[5]).trim();
  const sapCode = String(r[6]).trim();
  const tireCode = String(r[7]).trim();
  const speedMode = String(r[11]).trim().toUpperCase(); // NORMAL / STICKY
  const angleSpec = r[22];
  const angleAct1 = r[23];
  const plyType = r[36];
  const meter = r[37];
  const cart = r[38] || 1; // Cart count
  
  const isSapphire = sapphireCodes.has(tmCode.toUpperCase()) || sapphireCodes.has(sapCode.toUpperCase());

  console.log(`Row ${idx+1}: Shift=${shift}, TMCode=${tmCode}, TireCode=${tireCode}, AngleSpec=${angleSpec}, SpeedMode=${speedMode}, Cart=${cart}, Type=${isSapphire ? 'Sapphire' : 'WBR'}`);
});
