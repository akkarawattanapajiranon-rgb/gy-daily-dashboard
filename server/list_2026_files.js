const fs = require('fs');
const path = require('path');

const DIRS = [
  "T:\\10.30 A.M. Production Meeting\\5 BTA\\3 Roll\\2026",
  "T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer\\2026",
  "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad\\Booker Sheet\\2026",
  "T:\\10.30 A.M. Production Meeting\\5 BTA\\Q -TUBER 6''X 8''\\Booker Sheet - 6'' x 8 ''\\2026",
  "T:\\10.30 A.M. Production Meeting\\5 BTA\\Engineering Breakdown",
  "T:\\10.30 A.M. Production Meeting\\5 BTA\\6 Fischer",
  "T:\\10.30 A.M. Production Meeting\\5 BTA\\Quad"
];

DIRS.forEach(d => {
  console.log(`\n=== DIR: ${d} ===`);
  if (fs.existsSync(d)) {
    const files = fs.readdirSync(d);
    files.forEach(f => {
      const full = path.join(d, f);
      const stat = fs.statSync(full);
      if (!stat.isDirectory()) {
        console.log(`  - ${f}`);
      }
    });
  } else {
    console.log('  [DIR NOT FOUND]');
  }
});
