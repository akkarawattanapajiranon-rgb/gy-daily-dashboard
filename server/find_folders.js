const fs = require('fs');
const path = require('path');

const baseBta = 'T:\\10.30 A.M. Production Meeting\\5 BTA';

console.log('=== Directories in 5 BTA matching TUBER or QUAD ===');
const entries = fs.readdirSync(baseBta);
entries.forEach(e => {
  if (e.toLowerCase().includes('tuber') || e.toLowerCase().includes('quad')) {
    console.log('Found:', e);
    const full = path.join(baseBta, e);
    try {
      const sub = fs.readdirSync(full);
      console.log(`  Sub-items in ${e}:`, sub);
    } catch (err) {
      console.log(`  (file or inaccessible)`);
    }
  }
});
