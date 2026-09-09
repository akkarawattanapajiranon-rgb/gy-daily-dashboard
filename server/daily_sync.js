const { generateSnapshot } = require('./snapshot_generator');
const { execSync } = require('child_process');

async function runDailySync() {
  console.log('====================================================');
  console.log('🚀 Starting Daily Cloud Data Sync for Vercel...');
  console.log('====================================================');

  const today = new Date();
  const datesToSync = [];

  // Sync today and yesterday (fast 2-day sync)
  for (let i = 0; i < 2; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    datesToSync.push(dateStr);
  }

  for (const dateStr of datesToSync) {
    await generateSnapshot(dateStr);
  }

  console.log('====================================================');
  console.log('📦 Building static production assets...');
  try {
    const viteBin = path.join(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js');
    const projectRoot = path.join(__dirname, '..');
    execSync(`node "${viteBin}" build`, { stdio: 'inherit', cwd: projectRoot });
    console.log('✓ Build successful!');
  } catch (e) {
    console.error('Build error:', e.message);
  }

  console.log('====================================================');
  console.log('☁️ Pushing snapshots & build to Vercel/GitHub...');
  try {
    execSync('git add .', { stdio: 'inherit' });
    const msg = `Daily Cloud Sync: ${datesToSync[0]} (${new Date().toLocaleString()})`;
    execSync(`git commit -m "${msg}"`, { stdio: 'inherit' });
    execSync('git push origin master', { stdio: 'inherit' });
    console.log('====================================================');
    console.log('✅ Daily Cloud Sync completed! Vercel updated successfully!');
    console.log('====================================================');
  } catch (e) {
    console.log('Git sync status:', e.message || 'No new changes to push');
  }
  process.exit(0);
}

runDailySync();
