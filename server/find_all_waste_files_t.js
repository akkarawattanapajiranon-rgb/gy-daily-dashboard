const fs = require('fs');
const path = require('path');

const BASE_DIR = 'T:\\10.30 A.M. Production Meeting';

function searchWasteFiles(dirPath, depth = 0) {
  if (depth > 4) return;
  try {
    const items = fs.readdirSync(dirPath);
    items.forEach(item => {
      if (item.startsWith('~$')) return;
      const p = path.join(dirPath, item);
      try {
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          searchWasteFiles(p, depth + 1);
        } else if (item.toLowerCase().includes('waste') || item.toLowerCase().includes('friction') || item.toLowerCase().includes('milling')) {
          console.log(`FOUND FILE: ${p}`);
        }
      } catch (err) {}
    });
  } catch (err) {}
}

console.log('Searching all Waste files in T:\\10.30 A.M. Production Meeting...');
searchWasteFiles(BASE_DIR);
