const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const WASTE_BASE_DIR = 'T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report';

function searchFolder(dirPath, depth = 0) {
  if (depth > 2) return;
  try {
    const items = fs.readdirSync(dirPath);
    items.forEach(item => {
      const p = path.join(dirPath, item);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        console.log('DIR:', p);
        searchFolder(p, depth + 1);
      } else if (item.endsWith('.xls') || item.endsWith('.xlsx')) {
        console.log('FILE:', p);
      }
    });
  } catch (e) {
    console.error(e.message);
  }
}

searchFolder(WASTE_BASE_DIR);
