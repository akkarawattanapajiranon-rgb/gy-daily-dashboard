const { generateSnapshot } = require('./snapshot_generator');

async function runMorningSync() {
  const now = new Date();
  console.log(`[Morning Sync Cron] Running scheduled morning sync at ${now.toISOString()}...`);

  // Calculate yesterday and today's date strings (Asia/Bangkok timezone)
  const today = new Date(now.getTime() + (7 * 3600 * 1000));
  const yesterday = new Date(now.getTime() + (7 * 3600 * 1000) - (24 * 3600 * 1000));

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  console.log(`[Morning Sync Cron] Syncing yesterday (${yesterdayStr}) and today (${todayStr})...`);

  try {
    await generateSnapshot(yesterdayStr);
    await generateSnapshot(todayStr);
    console.log(`[Morning Sync Cron] ✅ Completed morning sync for ${yesterdayStr} and ${todayStr} before 9:15 AM!`);
  } catch (err) {
    console.error(`[Morning Sync Cron] ❌ Error during morning sync:`, err.message);
  }
}

if (require.main === module) {
  runMorningSync().then(() => process.exit(0));
}

module.exports = { runMorningSync };
