const fs = require('fs');
const path = require('path');

const BASE_DIR = "T:\\10.30 A.M. Production Meeting\\5 BTA";

function listDir(dir, depth = 0) {
  if (depth > 3 || !fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      console.log(`${'  '.repeat(depth)}[DIR] ${item}`);
      listDir(full, depth + 1);
    } else if (item.endsWith('.xlsx') || item.endsWith('.xls') || item.endsWith('.csv')) {
      console.log(`${'  '.repeat(depth)}  - ${item}`);
    }
  });
}

console.log('=== LISTING ALL EXCEL FILES IN 5 BTA ===');
listDir(BASE_DIR);
