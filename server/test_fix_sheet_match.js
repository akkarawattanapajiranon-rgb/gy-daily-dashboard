const XLSX = require('xlsx');

const oeeFile = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\OEE 2 Sep,2026.xlsx";
const wb = XLSX.readFile(oeeFile);

console.log('Available Sheet Names:', wb.SheetNames);

// Quad sheet matching rule: must include '26' or '2026' AND 'quad'
const quadSheet = wb.SheetNames.find(s => {
  const l = s.toLowerCase();
  return (l.includes('26') || l.includes('2026')) && l.includes('quad');
}) || wb.SheetNames.find(s => s.toLowerCase().includes('quad'));

// Tuber sheet matching rule: must include '26' or '2026' AND ('6x8' or 'ext' or 'tuber')
const tuberSheet = wb.SheetNames.find(s => {
  const l = s.toLowerCase();
  return (l.includes('26') || l.includes('2026')) && (l.includes('6x8') || l.includes('ext') || l.includes('tuber'));
}) || wb.SheetNames.find(s => s.toLowerCase().includes('6x8') || s.toLowerCase().includes('tuber'));

console.log('Matched QUAD Sheet Name:', `"${quadSheet}"`);
console.log('Matched TUBER Sheet Name:', `"${tuberSheet}"`);

console.log('\n--- QUAD SHEET DATA (First 5 Days) ---');
const wsQuad = wb.Sheets[quadSheet];
const dataQuad = XLSX.utils.sheet_to_json(wsQuad, { header: 1, defval: '' });
dataQuad.slice(2, 7).forEach(r => {
  console.log(`Day ${r[0]}: SR=${(Number(r[1])*100).toFixed(2)}%, AR=${(Number(r[3])*100).toFixed(2)}%, PR=${(Number(r[4])*100).toFixed(2)}%, QR=${(Number(r[5])*100).toFixed(2)}%, OEE1=${(Number(r[7])*100).toFixed(2)}%, OEE2=${(Number(r[8])*100).toFixed(2)}%, BD%=${(Number(r[26])*100).toFixed(2)}%`);
});

console.log('\n--- TUBER SHEET DATA (First 5 Days) ---');
const wsTuber = wb.Sheets[tuberSheet];
const dataTuber = XLSX.utils.sheet_to_json(wsTuber, { header: 1, defval: '' });
dataTuber.slice(2, 7).forEach(r => {
  console.log(`Day ${r[0]}: SR=${(Number(r[1])*100).toFixed(2)}%, AR=${(Number(r[3])*100).toFixed(2)}%, PR=${(Number(r[4])*100).toFixed(2)}%, QR=${(Number(r[5])*100).toFixed(2)}%, OEE1=${(Number(r[6])*100).toFixed(2)}%, OEE2=${(Number(r[7])*100).toFixed(2)}%, BD%=${(Number(r[8])*100).toFixed(2)}%`);
});
