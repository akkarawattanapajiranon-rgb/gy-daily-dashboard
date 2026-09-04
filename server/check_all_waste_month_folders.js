const fs = require('fs');
const path = require('path');

const baseDir = "T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report";

const items = fs.readdirSync(baseDir);
items.forEach(item => {
  const full = path.join(baseDir, item);
  if (fs.statSync(full).isDirectory()) {
    console.log(`Subfolder: ${item}`);
    const files = fs.readdirSync(full);
    files.forEach(f => console.log(`   - ${f}`));
  }
});
