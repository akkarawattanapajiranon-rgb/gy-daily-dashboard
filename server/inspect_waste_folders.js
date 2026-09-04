const fs = require('fs');
const path = require('path');

const baseDir = "T:\\10.30 A.M. Production Meeting\\5 BTA";
const dirs = fs.readdirSync(baseDir);
console.log('Folders in 5 BTA:');
dirs.forEach(d => {
  const full = path.join(baseDir, d);
  try {
    if (fs.statSync(full).isDirectory()) {
      console.log(' -', d);
    }
  } catch (e) {}
});
