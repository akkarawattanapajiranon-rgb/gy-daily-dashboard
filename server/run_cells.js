const fs = require('fs');
let code = fs.readFileSync('test_scrape4.js', 'utf8');
code = code.replace(/\$r\('tr'\)\.each\(\(i, el\) => \{[\s\S]*?\}\);/, 
  `$r('tr').each((i, row) => { 
     console.log('ROW ' + i); 
     $r(row).find('td').each((j, td) => { 
       console.log('  ' + j + ': ' + $r(td).text().replace(/\\s+/g, ' ').trim()); 
     }); 
   });`);
fs.writeFileSync('test_scrape4_cells.js', code);
require('./test_scrape4_cells.js');
