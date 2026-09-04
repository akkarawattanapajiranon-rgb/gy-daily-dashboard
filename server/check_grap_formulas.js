const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

const months = ['4. APRIL 2026', '5. MAY 2026'];

months.forEach(month => {
  const dir = `T:\\10.30 A.M. Production Meeting\\5 BTA\\Waste Report\\${month}`;
  const files = fs.readdirSync(dir);
  const fFileName = files.find(f => f.toLowerCase().includes('friction') && !f.startsWith('~$'));
  const mFileName = files.find(f => f.toLowerCase().includes('milling') && !f.startsWith('~$'));

  console.log(`\n================ ${month} Grap Formulas & Values ================`);

  if (fFileName) {
    const wbF = XLSX.readFile(path.join(dir, fFileName), { cellFormulas: true });
    const gF = wbF.Sheets['Grap'];
    if (gF) {
      const rowsF = XLSX.utils.sheet_to_json(gF, { header: 1, defval: '' });
      console.log('--- FRICTION FILE Grap Sheet ---');
      rowsF.slice(0, 4).forEach((r, i) => console.log(`Row ${i}:`, r.slice(0, 6)));
      console.log('Cell B2 (Friction Day 1):', gF['B2'] ? gF['B2'].f : 'none', 'Val:', gF['B2'] ? gF['B2'].v : 'none');
      console.log('Cell B3 (Milling Day 1):', gF['B3'] ? gF['B3'].f : 'none', 'Val:', gF['B3'] ? gF['B3'].v : 'none');
      console.log('Cell D2 (Friction Day 3):', gF['D2'] ? gF['D2'].f : 'none', 'Val:', gF['D2'] ? gF['D2'].v : 'none');
    }
  }

  if (mFileName) {
    const wbM = XLSX.readFile(path.join(dir, mFileName), { cellFormulas: true });
    const gM = wbM.Sheets['Grap'];
    if (gM) {
      const rowsM = XLSX.utils.sheet_to_json(gM, { header: 1, defval: '' });
      console.log('--- MILLING FILE Grap Sheet ---');
      rowsM.slice(0, 4).forEach((r, i) => console.log(`Row ${i}:`, r.slice(0, 6)));
      console.log('Cell B2 (Friction Day 1):', gM['B2'] ? gM['B2'].f : 'none', 'Val:', gM['B2'] ? gM['B2'].v : 'none');
      console.log('Cell B3 (Milling Day 1):', gM['B3'] ? gM['B3'].f : 'none', 'Val:', gM['B3'] ? gM['B3'].v : 'none');
      console.log('Cell D3 (Milling Day 3):', gM['D3'] ? gM['D3'].f : 'none', 'Val:', gM['D3'] ? gM['D3'].v : 'none');
    }
  }
});
