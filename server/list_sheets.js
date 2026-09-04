const XLSX = require('xlsx');
const wb = XLSX.readFile('T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown\\Thailand_Breakdown_2026_Rev.1.xlsx');
console.log(JSON.stringify(wb.SheetNames));
