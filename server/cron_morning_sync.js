const { generateSnapshot } = require('./snapshot_generator');
const { getExtruderTimeline } = require('./extruder/dayStore');
const { parseLspData } = require('./lsp_parser');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');

let isSyncRunning = false;

async function runMorningSync() {
  if (isSyncRunning) {
    console.log('[Morning Sync Cron] Sync already in progress, skipping duplicate invocation.');
    return;
  }
  isSyncRunning = true;
  const now = new Date();
  console.log(`[Morning Sync Cron] Running scheduled Vercel morning sync at ${now.toLocaleString()}...`);

  // Calculate yesterday and today's date strings (Asia/Bangkok timezone)
  const today = new Date(now.getTime() + (7 * 3600 * 1000));
  const datesToSync = [];
  
  // Sync today and past 14 days (15 days rolling window)
  for (let i = 0; i < 15; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    datesToSync.push(dateStr);
  }

  try {
    for (const dateStr of datesToSync) {
      await generateSnapshot(dateStr);
      // Pre-generate static Extruder Timeline files for Vercel/Cloud deployment
      try {
        await getExtruderTimeline(dateStr, undefined, true);
      } catch (extErr) {
        console.warn(`[Morning Sync Cron] Extruder sync notice for ${dateStr}:`, extErr.message);
      }
    }
    
    console.log('[Morning Sync Cron] 🛡️ Parsing latest EHS Safety LSP Tracking data...');
    try {
      parseLspData();
    } catch (lspErr) {
      console.warn('[Morning Sync Cron] LSP parse notice:', lspErr.message);
    }

    console.log('[Morning Sync Cron] 📦 Building static production assets...');
    const projectRoot = path.join(__dirname, '..');
    await execPromise('node node_modules/vite/bin/vite.js build', { cwd: projectRoot });

    console.log('[Morning Sync Cron] ☁️ Checking for changes to push to Vercel/GitHub...');
    await execPromise('git add .', { cwd: projectRoot });
    const { stdout: statusOut } = await execPromise('git status --porcelain', { cwd: projectRoot });
    const status = statusOut ? statusOut.trim() : '';
    
    if (status) {
      const msg = `Auto Sync Update: ${datesToSync[0]} (Startup / Scheduled Sync)`;
      await execPromise(`git commit -m "${msg}"`, { cwd: projectRoot });
      await execPromise('git push origin master', { cwd: projectRoot });
      console.log(`[Morning Sync Cron] ✅ Successfully pushed updated data to Vercel/GitHub!`);
    } else {
      console.log(`[Morning Sync Cron] ✨ All data is already up-to-date. No new changes to push.`);
    }
  } catch (err) {
    console.warn(`[Morning Sync Cron] Sync status:`, err.message);
  } finally {
    isSyncRunning = false;
  }
}

if (require.main === module) {
  runMorningSync().then(() => process.exit(0));
}

module.exports = { runMorningSync };
