const { generateSnapshot } = require('./snapshot_generator');
const { execSync } = require('child_process');
const path = require('path');

async function runMorningSync() {
  const now = new Date();
  console.log(`[Morning Sync Cron] Running scheduled Vercel morning sync at ${now.toLocaleString()}...`);

  // Calculate yesterday and today's date strings (Asia/Bangkok timezone)
  const today = new Date(now.getTime() + (7 * 3600 * 1000));
  const datesToSync = [];
  
  // Sync today and past 7 days for full completeness before 9:15 AM
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    datesToSync.push(dateStr);
  }

  try {
    for (const dateStr of datesToSync) {
      await generateSnapshot(dateStr);
    }
    
    console.log('[Morning Sync Cron] 📦 Building static production assets...');
    const projectRoot = path.join(__dirname, '..');
    execSync('node node_modules/vite/bin/vite.js build', { stdio: 'inherit', cwd: projectRoot });

    console.log('[Morning Sync Cron] ☁️ Pushing snapshots to Vercel/GitHub...');
    execSync('git add .', { stdio: 'inherit', cwd: projectRoot });
    const msg = `Scheduled Morning Vercel Update: ${datesToSync[0]} (before 9:15 AM)`;
    execSync(`git commit -m "${msg}"`, { stdio: 'inherit', cwd: projectRoot });
    execSync('git push origin master', { stdio: 'inherit', cwd: projectRoot });

    console.log(`[Morning Sync Cron] ✅ Completed Vercel morning update before 9:15 AM!`);
  } catch (err) {
    console.warn(`[Morning Sync Cron] Sync status:`, err.message);
  }
}

if (require.main === module) {
  runMorningSync().then(() => process.exit(0));
}

module.exports = { runMorningSync };
