/**
 * Patch roll42 in existing snapshots using the fixed parser.
 * Regenerates only the roll42 field and saves back to both snapshot dirs.
 */
const fs = require('fs');
const path = require('path');
const { parse4Roll2Data } = require('./roll42_parser');

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const CLIENT_SNAPSHOT_DIR = path.join(__dirname, '..', 'src', 'data', 'snapshots');

const dates = ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10'];

for (const dateStr of dates) {
  console.log(`\n=== Patching roll42 for ${dateStr} ===`);

  const roll42 = parse4Roll2Data(dateStr);
  if (roll42.error) {
    console.log('  ERROR:', roll42.error);
    continue;
  }

  console.log('  totalQty:', roll42.totalQty, '| totalMeters:', roll42.totalMeters);
  [1,2,3].forEach(s => {
    const sh = roll42.shifts[`shift${s}`];
    if (sh.items.length > 0) {
      console.log(`  Shift ${s} (${sh.items.length} items):`);
      sh.items.forEach(i => console.log(`    ${i.sapCode} | ${i.code} | ${i.qty} ${i.unit}`));
    }
  });

  // Patch client snapshot
  const clientPath = path.join(CLIENT_SNAPSHOT_DIR, `${dateStr}.json`);
  if (fs.existsSync(clientPath)) {
    const snap = JSON.parse(fs.readFileSync(clientPath, 'utf8'));
    snap.roll42 = roll42;
    fs.writeFileSync(clientPath, JSON.stringify(snap, null, 2), 'utf8');
    console.log('  ✅ Patched client snapshot:', clientPath);
  } else {
    console.log('  ⚠️ Client snapshot not found:', clientPath);
  }

  // Patch server snapshot
  const serverPath = path.join(SNAPSHOT_DIR, `${dateStr}.json`);
  if (fs.existsSync(serverPath)) {
    const snap = JSON.parse(fs.readFileSync(serverPath, 'utf8'));
    snap.roll42 = roll42;
    fs.writeFileSync(serverPath, JSON.stringify(snap, null, 2), 'utf8');
    console.log('  ✅ Patched server snapshot:', serverPath);
  }
}

console.log('\n=== Done ===');
