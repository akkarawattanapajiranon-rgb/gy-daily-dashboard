const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\4. APRIL 2026\\4. Apr 2026-Friction Waste Report 2026.xlsx';
const wb = XLSX.readFile(file, { cellFormulas: true });

const daySheet = wb.Sheets['1']; // Day 1
console.log('--- APRIL 2026 DAY 1 ---');
console.log('Cell F1 (Friction Waste total):', daySheet['F1'] ? daySheet['F1'].v : 'N/A', 'Formula:', daySheet['F1'] ? daySheet['F1'].f : 'N/A');
console.log('Cell I1:', daySheet['I1'] ? daySheet['I1'].v : 'N/A', 'Formula:', daySheet['I1'] ? daySheet['I1'].f : 'N/A');
console.log('Cell L1:', daySheet['L1'] ? daySheet['L1'].v : 'N/A', 'Formula:', daySheet['L1'] ? daySheet['L1'].f : 'N/A');
console.log('Cell O1:', daySheet['O1'] ? daySheet['O1'].v : 'N/A', 'Formula:', daySheet['O1'] ? daySheet['O1'].f : 'N/A');

console.log('Cell F2 (Milling Waste total):', daySheet['F2'] ? daySheet['F2'].v : 'N/A', 'Formula:', daySheet['F2'] ? daySheet['F2'].f : 'N/A');
console.log('Cell I2:', daySheet['I2'] ? daySheet['I2'].v : 'N/A', 'Formula:', daySheet['I2'] ? daySheet['I2'].f : 'N/A');
console.log('Cell L2:', daySheet['L2'] ? daySheet['L2'].v : 'N/A', 'Formula:', daySheet['L2'] ? daySheet['L2'].f : 'N/A');
console.log('Cell O2:', daySheet['O2'] ? daySheet['O2'].v : 'N/A', 'Formula:', daySheet['O2'] ? daySheet['O2'].f : 'N/A');
