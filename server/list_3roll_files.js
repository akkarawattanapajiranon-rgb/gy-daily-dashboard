const fs = require('fs');
const path = require('path');

const dir = "T:\\10.30 A.M. Production Meeting\\5 BTA\\3 Roll\\2026";
if (fs.existsSync(dir)) {
  const files = fs.readdirSync(dir);
  console.log('Files in 3 Roll 2026:');
  files.forEach(f => console.log(' -', f));
} else {
  console.log('Dir does not exist');
}
