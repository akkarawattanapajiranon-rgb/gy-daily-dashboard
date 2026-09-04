const XLSX = require('xlsx');

const fileCheck = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\2026\\09. Fischer check sheet - SEP 2026.xlsx';
const wbCheck = XLSX.readFile(fileCheck);

const wsSapphire = wbCheck.Sheets['SPEC GAUGE TREATMENT SAPPHIRE'];
const sapphireData = XLSX.utils.sheet_to_json(wsSapphire, { header: 1, defval: '' });
const sapphireCodes = new Set();
sapphireData.slice(2).forEach(r => {
  if (r[2]) sapphireCodes.add(String(r[2]).trim().toUpperCase());
  if (r[3]) sapphireCodes.add(String(r[3]).trim().toUpperCase());
});

const ws = wbCheck.Sheets['SEP 2026'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

['46266', '46267'].forEach(dateVal => {
  const dayRows = data.slice(5).filter(r => String(r[0]).trim() === dateVal);

  let wbrNormal = 0;
  let wbrSticky = 0;
  let totalWbr = 0;
  let totalSapphire = 0;

  dayRows.forEach(r => {
    const tmCode = String(r[5]).trim().toUpperCase();
    const sapCode = String(r[6]).trim().toUpperCase();
    const speedMode = String(r[11]).trim().toUpperCase();

    const isSapphire = sapphireCodes.has(tmCode) || sapphireCodes.has(sapCode);

    if (isSapphire) {
      totalSapphire++;
    } else {
      totalWbr++;
      if (speedMode === 'STICKY') {
        wbrSticky++;
      } else {
        wbrNormal++;
      }
    }
  });

  console.log(`\nDate ${dateVal}: Total Produce = ${dayRows.length}`);
  console.log(`Total WBR = ${totalWbr}, Total Sapphire = ${totalSapphire}`);
  console.log(`WBR Normal = ${wbrNormal}, WBR Sticky = ${wbrSticky}`);
  console.log(`WBR Normal % = ${(wbrNormal / totalWbr * 100).toFixed(2)}%`);
  console.log(`WBR Sticky % = ${(wbrSticky / totalWbr * 100).toFixed(2)}%`);
});
