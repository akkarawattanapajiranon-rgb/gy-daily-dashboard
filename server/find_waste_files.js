const fs = require('fs');
const path = require('path');

const baseDir = "T:\\10.30 A.M. Production Meeting\\5 BTA";

function searchFolder(dir, depth = 0) {
  if (depth > 3) return;
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f.startsWith('~$')) continue;
      const full = path.join(dir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          searchFolder(full, depth + 1);
        } else if (f.toLowerCase().includes('waste') || f.toLowerCase().includes('scrap')) {
          console.log('FOUND:', full);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

searchFolder(baseDir);
