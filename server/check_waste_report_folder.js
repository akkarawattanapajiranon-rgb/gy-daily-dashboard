const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const wasteDir = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report";

if (fs.existsSync(wasteDir)) {
  const files = fs.readdirSync(wasteDir);
  console.log('Files in Waste Report folder:');
  files.forEach(f => console.log(' -', f));
} else {
  console.log('Waste Report folder does not exist');
}
