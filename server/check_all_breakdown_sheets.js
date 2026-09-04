const XLSX = require('xlsx');

const file = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown\\Issue log 2026 _ BCA 14AUG2026.xlsx';
const wb = XLSX.readFile(file);

console.log('Breakdown Sheet Names:', wb.SheetNames);
