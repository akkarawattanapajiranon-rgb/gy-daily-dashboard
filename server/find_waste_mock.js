const fs = require('fs');
const path = require('path');

function searchInDir(dir, term) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git') searchInDir(p, term);
    } else {
      const content = fs.readFileSync(p, 'utf8');
      if (content.includes(term)) {
        console.log(`Found "${term}" in ${p}`);
      }
    }
  });
}

searchInDir('c:\\Users\\aa11909\\OneDrive - Goodyear\\Documents\\AI\\DOR\\daily-dashboard\\server', '343.6');
searchInDir('c:\\Users\\aa11909\\OneDrive - Goodyear\\Documents\\AI\\DOR\\daily-dashboard\\src', '343.6');
