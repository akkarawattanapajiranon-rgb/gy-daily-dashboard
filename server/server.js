process.env.UV_THREADPOOL_SIZE = '64';
require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignore self-signed certs globally

process.on('uncaughtException', (err) => {
  console.error('[Server Uncaught Exception]', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.warn('[Server Unhandled Rejection]', reason);
});
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// Instant fast-path for static extruder timeline JSON files (BEFORE any heavy middlewares)
app.get('/data/extruder/:file', (req, res) => {
  const file = req.params.file;
  const paths = [
    path.join(__dirname, '..', 'public', 'data', 'extruder', file),
    path.join(__dirname, '..', 'dist', 'data', 'extruder', file)
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.sendFile(p);
    }
  }

  // Fallback to store: convert raw store to client timeline format
  const storePath = path.join(__dirname, 'extruder_store', file);
  if (fs.existsSync(storePath)) {
    try {
      const date = file.replace('.json', '');
      const raw = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      const { buildExtruderTimeline } = require('./extruder/buildTimeline');
      const timeline = buildExtruderTimeline({
        date,
        cached: true,
        lines: Object.entries(raw.lines || {}).map(([line, s]) => ({
          line,
          rows: s.rows || [],
          truncated: Boolean(s.truncated),
          error: null
        }))
      });
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.json(timeline);
    } catch (e) {}
  }

  res.status(404).json({ error: 'Extruder timeline file not found' });
});

// Disable all browser HTTP caching for API endpoints and HTML pages
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/' || req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

const { getSnapshot, generateSnapshot } = require('./snapshot_generator');
const { fork } = require('child_process');

// In-memory API cache: 5 minute TTL — ป้องกัน Excel parse ซ้ำๆ จาก T: drive ทุก request
// (กด F5/Live Data จะ bypass cache ด้วย forceRefresh=true → _t= query param)
const apiMemoryCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key, forceRefresh = false) {
  if (forceRefresh) return null; // bypass cache
  const item = apiMemoryCache.get(key);
  if (item && (Date.now() - item.ts < CACHE_TTL_MS)) {
    return item.data;
  }
  return null;
}

function setCached(key, data) {
  if (data && !data.error) {
    apiMemoryCache.set(key, { data, ts: Date.now() });
  }
}

// Preload recent snapshots (last 7 days) into memory cache on startup for 0ms boot responses
function preloadSnapshots() {
  try {
    const snapshotDir = path.join(__dirname, 'snapshots');
    if (!fs.existsSync(snapshotDir)) return;
    const files = fs.readdirSync(snapshotDir).filter(f => f.endsWith('.json')).sort().reverse().slice(0, 7);
    let count = 0;
    for (const f of files) {
      const date = f.replace('.json', '');
      try {
        const snap = JSON.parse(fs.readFileSync(path.join(snapshotDir, f), 'utf8'));
        if (snap) {
          if (snap.breakdown) { apiMemoryCache.set(`breakdown:${date}`, { data: snap.breakdown, ts: Date.now() }); count++; }
          if (snap.aeroDelay) apiMemoryCache.set(`aeroDelay:${date}`, { data: snap.aeroDelay, ts: Date.now() });
          if (snap.wbrDelay) apiMemoryCache.set(`wbrDelay:${date}`, { data: snap.wbrDelay, ts: Date.now() });
          if (snap.fischer) apiMemoryCache.set(`fischer:${date}`, { data: snap.fischer, ts: Date.now() });
          if (snap.roll3) apiMemoryCache.set(`3roll:${date}`, { data: snap.roll3, ts: Date.now() });
          if (snap.roll42) apiMemoryCache.set(`4roll2:${date}`, { data: snap.roll42, ts: Date.now() });
          if (snap.weeklyOee) apiMemoryCache.set(`oee-weekly:${date}`, { data: snap.weeklyOee, ts: Date.now() });
          if (snap.workaway) apiMemoryCache.set(`workaway:${date}`, { data: snap.workaway, ts: Date.now() });
          if (snap.quad) apiMemoryCache.set(`quad:${date}`, { data: snap.quad, ts: Date.now() });
          if (snap.tuber) apiMemoryCache.set(`tuber:${date}`, { data: snap.tuber, ts: Date.now() });
          if (snap.waste) apiMemoryCache.set(`waste:${date}`, { data: snap.waste, ts: Date.now() });
          if (snap.cms) apiMemoryCache.set(`cms:${date}`, { data: snap.cms, ts: Date.now() });
        }
      } catch (e) {}
    }
    console.log(`[Server Cache] Preloaded ${files.length} recent snapshot dates into memory cache.`);
  } catch (err) {
    console.warn('[Server Cache] Preload notice:', err.message);
  }
}
preloadSnapshots();

// Automatic Cloud Sync Worker (Runs in completely separate OS process to never block Express)
let syncWorkerProcess = null;
function triggerBackgroundCloudSync() {
  if (syncWorkerProcess && syncWorkerProcess.exitCode === null) {
    console.log('[Server Schedule] Cloud sync already running in background process, skipping duplicate.');
    return;
  }
  const scriptPath = path.join(__dirname, 'cron_morning_sync.js');
  console.log('[Server Schedule] 🚀 Spawning isolated background worker for scheduled sync...');
  try {
    syncWorkerProcess = fork(scriptPath, [], {
      stdio: 'ignore'
    });
    syncWorkerProcess.on('error', (workerErr) => {
      console.warn('[Server Schedule] Sync worker error notice:', workerErr.message);
      syncWorkerProcess = null;
    });
    syncWorkerProcess.on('exit', (code) => {
      console.log(`[Server Schedule] Background cloud sync worker completed (code ${code})`);
      syncWorkerProcess = null;
      preloadSnapshots();
    });
  } catch (err) {
    console.warn('[Server Schedule] Failed to spawn background sync worker:', err.message);
  }
}

// Check schedule every minute: 08:30, 09:00, 09:10 AM and every 2 hours
setInterval(() => {
  const now = new Date();
  const bangkokTime = new Date(now.getTime() + (7 * 3600 * 1000));
  const hours = bangkokTime.getUTCHours();
  const minutes = bangkokTime.getUTCMinutes();
  
  const isMorningReview = (hours === 9 && (minutes === 0 || minutes === 10)) || (hours === 8 && minutes === 30);
  const isPeriodicSync = (minutes === 0 && [11, 13, 15, 17, 19, 21, 23, 7].includes(hours));

  if (isMorningReview || isPeriodicSync) {
    console.log(`[Server Schedule] Scheduled trigger at ${hours}:${String(minutes).padStart(2, '0')}`);
    triggerBackgroundCloudSync();
  }
}, 60 * 1000);

function getBangkokDateStr(offsetDays = 0) {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  return d.toISOString().split('T')[0];
}

let bgSnapshotTimer = null;
let isBgSnapshotRunning = false;
function triggerDebouncedBackgroundSnapshot(dateStr) {
  if (isBgSnapshotRunning) return;
  if (bgSnapshotTimer) clearTimeout(bgSnapshotTimer);
  bgSnapshotTimer = setTimeout(() => {
    isBgSnapshotRunning = true;
    console.log(`[Background Sync] Refreshing snapshot for ${dateStr} in background...`);
    generateSnapshot(dateStr).finally(() => {
      isBgSnapshotRunning = false;
      preloadSnapshots();
    });
  }, 1500);
}

// Endpoint to immediately generate a fresh snapshot for a given date on user demand
app.get('/api/refresh-snapshot', async (req, res) => {
  const date = req.query.date || getBangkokDateStr();
  console.log(`[API] Manual refresh snapshot requested for date: ${date}`);
  try {
    const snap = await generateSnapshot(date);
    preloadSnapshots();
    res.json({ success: true, date, snapshot: snap });
  } catch (err) {
    console.error(`[API] Manual refresh error for ${date}:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

function handleDataEndpoint(req, res, metricKey, parseFn) {
  const date = req.query.date || getBangkokDateStr();
  const cacheKey = `${metricKey}:${date}`;
  const forceRefresh = !!req.query._t;

  // 1. Memory cache hit (skip if forceRefresh)
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  const todayStr = getBangkokDateStr();
  const yesterdayStr = getBangkokDateStr(-1);
  const isRecentDate = (date === todayStr || date === yesterdayStr);
  const snap = getSnapshot(date);

  // If forceRefresh on a recent date, schedule background snapshot revalidation
  if (forceRefresh && isRecentDate) {
    triggerDebouncedBackgroundSnapshot(date);
  }

  // 2. Snapshot fast-path
  if (snap && snap[metricKey]) {
    const val = snap[metricKey];
    // Check if snapshot has real data (hasData !== false, or for breakdown actual_bd_pct !== null)
    const hasData = val && val.hasData !== false && (metricKey !== 'breakdown' || (val.Banbury && val.Banbury.hasData !== false));
    if (hasData || !isRecentDate) {
      setCached(cacheKey, val);
      return res.json(val);
    }
  }

  // 3. Fallback to parser (if snapshot is missing or hasData is false on recent dates)
  console.log(`Fetching fresh ${metricKey} data for date: ${date}`);
  try {
    const data = parseFn(date);
    if (data && !data.error) {
      setCached(cacheKey, data);
      return res.json(data);
    }
    if (snap && snap[metricKey]) return res.json(snap[metricKey]);
    return res.status(404).json({ error: data?.error || 'Data not found' });
  } catch (err) {
    if (snap && snap[metricKey]) return res.json(snap[metricKey]);
    return res.status(500).json({ error: err.message });
  }
}

// Breakdown parser (reads local Excel on T: drive)
const { parseBreakdown } = require('./breakdown_parser');
app.get('/api/breakdown', (req, res) => handleDataEndpoint(req, res, 'breakdown', parseBreakdown));

// Aero Component Delay parser (reads local Excel on N: drive)
const { parseAeroDelay } = require('./aero_delay_parser');
app.get('/api/aero-delay', (req, res) => handleDataEndpoint(req, res, 'aeroDelay', parseAeroDelay));

// WBR Component Delay parser (reads local Excel on N: drive)
const { parseWbrDelay } = require('./wbr_delay_parser');
app.get('/api/wbr-delay', (req, res) => handleDataEndpoint(req, res, 'wbrDelay', parseWbrDelay));

// Fischer parser (reads local Excel on T: drive)
const { parseFischerData } = require('./fischer_parser');
app.get('/api/fischer', (req, res) => handleDataEndpoint(req, res, 'fischer', parseFischerData));

// 3 Roll parser (reads local Excel on T: drive)
const { parse3RollData } = require('./roll3_parser');
app.get('/api/3roll', (req, res) => handleDataEndpoint(req, res, 'roll3', parse3RollData));

// 4 Roll 2 parser (reads Productivity Check sheet on T: drive)
const { parse4Roll2Data } = require('./roll42_parser');
app.get('/api/4roll2', (req, res) => handleDataEndpoint(req, res, 'roll42', parse4Roll2Data));

// Weekly OEE parser (reads QUAD, TUBER, FISCHER OEE for WTD AVG)
const { parseWeeklyOee } = require('./weekly_oee_parser');
app.get('/api/oee-weekly', (req, res) => handleDataEndpoint(req, res, 'weeklyOee', parseWeeklyOee));

// Workaway parser (reads Disposition Non-moving Excel on T: drive)
const { parseWorkawayData } = require('./workaway_parser');
app.get('/api/workaway', (req, res) => handleDataEndpoint(req, res, 'workaway', parseWorkawayData));

// Quad parser
const { parseQuadData } = require('./quad_parser');
app.get('/api/quad', (req, res) => handleDataEndpoint(req, res, 'quad', parseQuadData));

// Tuber parser
const { parseTuberData } = require('./tuber_parser');
app.get('/api/tuber', (req, res) => handleDataEndpoint(req, res, 'tuber', parseTuberData));

// Waste parser (reads gy_reports from gy-waste-report Firebase and local Excel fallback)
const { parseWasteData, parseWasteDataAsync } = require('./waste_parser');
app.get('/api/waste', async (req, res) => {
  const date = req.query.date || getBangkokDateStr();
  const cacheKey = `waste:${date}`;
  const forceRefresh = !!req.query._t;
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  const todayStr = getBangkokDateStr();
  const isPastDate = date < todayStr;
  const snap = getSnapshot(date);

  if (snap && snap.waste) {
    if (forceRefresh && !isPastDate) {
      triggerDebouncedBackgroundSnapshot(date);
    }
    setCached(cacheKey, snap.waste);
    return res.json(snap.waste);
  }

  console.log(`Fetching Waste data for date: ${date}`);
  try {
    const data = await parseWasteDataAsync(date);
    const result = (data && !data.error) ? data : (snap?.waste || {
      date,
      millingSummary: 0,
      frictionSummary: 0,
      beadSummary: 0,
      millingTop: [],
      frictionTop: [],
      beadTop: [],
      dataDate: date,
      hasData: false
    });
    setCached(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.json(snap?.waste || { date, hasData: false });
  }
});

// CMS live parser
const { fetchLiveCmsData } = require('./cms_parser');
app.get('/api/cms', async (req, res) => {
  const targetDate = req.query.date || getBangkokDateStr();
  const cacheKey = `cms:${targetDate}`;
  const forceRefresh = !!req.query._t;
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  const todayStr = getBangkokDateStr();
  const isPastDate = targetDate < todayStr;
  const snap = getSnapshot(targetDate);

  if (snap && snap.cms && (snap.cms.mixing1?.batch > 0 || snap.cms.totalOee2)) {
    if (forceRefresh && !isPastDate) {
      triggerDebouncedBackgroundSnapshot(targetDate);
    }
    setCached(cacheKey, snap.cms);
    return res.json(snap.cms);
  }

  console.log(`Fetching CMS Data for date: ${targetDate}`);
  try {
    const liveData = await fetchLiveCmsData(targetDate);
    if (liveData && !liveData.error) {
      setCached(cacheKey, liveData);
      return res.json(liveData);
    }
  } catch (err) {}

  if (snap && snap.cms) {
    setCached(cacheKey, snap.cms);
    return res.json(snap.cms);
  }

  // Fallback data if CMS server is offline or unreachable
  const mockDb = {
    '2026-09-03': {
      mixing1: { batch: 226, ar: 72.6, pr: 90.7, qr: 85.8, oee2: 56.5 },
      mixing2: { batch: 249, ar: 85.8, pr: 93.0, qr: 100.0, oee2: 79.8 },
      totalOee2: 67.7
    },
    '2026-09-02': {
      mixing1: { batch: 629, ar: 85.8, pr: 89.8, qr: 88.4, oee2: 68.1 },
      mixing2: { batch: 622, ar: 83.8, pr: 88.2, qr: 100.0, oee2: 73.9 },
      totalOee2: 70.9
    },
    '2026-09-01': {
      mixing1: { batch: 600, ar: 87.0, pr: 90.5, qr: 96.2, oee2: 75.8 },
      mixing2: { batch: 560, ar: 83.5, pr: 88.2, qr: 94.8, oee2: 69.8 },
      totalOee2: 72.8
    }
  };

  if (mockDb[targetDate]) {
    return res.json(mockDb[targetDate]);
  }

  res.json({
    mixing1: { batch: 0, ar: '0.0', pr: '0.0', qr: '0.0', oee2: '0.0' },
    mixing2: { batch: 0, ar: '0.0', pr: '0.0', qr: '0.0', oee2: '0.0' },
    totalOee2: '0.0',
    hasData: false
  });
});

// Extruder Timeline parser
const { getExtruderTimeline } = require('./extruder/dayStore');
const { bangkokProductionDate, ExtruderTimelineInputError, nextDate } = require('./extruder/buildTimeline');

app.get('/api/extruder-timeline', async (req, res) => {
  const date = req.query.date || bangkokProductionDate();
  const forceRefresh = req.query.refresh === 'true';
  console.log(`Fetching Extruder Timeline for date: ${date}${forceRefresh ? ' (forceRefresh)' : ''}`);

  // Instant fast-path: for any date with pre-built client JSON
  if (!forceRefresh) {
    const candidateFiles = [
      path.join(__dirname, '..', 'public', 'data', 'extruder', `${date}.json`),
      path.join(__dirname, '..', 'dist', 'data', 'extruder', `${date}.json`)
    ];
    for (const f of candidateFiles) {
      if (fs.existsSync(f)) {
        try {
          const fileContent = fs.readFileSync(f, 'utf8');
          const json = JSON.parse(fileContent);
          if (json && Array.isArray(json.lines)) {
            res.setHeader('Cache-Control', 'public, max-age=300');
            res.type('json').send(fileContent);
            return;
          }
        } catch (e) {}
      }
    }
  }

  try {
    const data = await getExtruderTimeline(date, undefined, forceRefresh);
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.json(data);
  } catch (err) {
    if (err instanceof ExtruderTimelineInputError) {
      return res.status(400).json({ success: false, error: err.message });
    }
    console.error('[extruder-timeline]', err);
    res.status(500).json({ success: false, error: 'internal error' });
  }
});

// EHS Safety LSP Tracking parser
const { parseLspData } = require('./lsp_parser');

app.get('/api/lsp', (req, res) => {
  console.log('Fetching EHS Safety LSP Tracking Data');
  const data = parseLspData();
  res.json(data);
});

// EHS Safety LSP PPT Exporter
const { generateLspPpt } = require('./lsp_ppt_generator');
app.get('/api/export-lsp-ppt', async (req, res) => {
  const team = req.query.team || 'Staff';
  const month = req.query.month || 'SEP';
  console.log(`Exporting LSP PPT for team: ${team}, month: ${month}`);
  try {
    const buffer = await generateLspPpt(team, month);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="LSP_Audit_Report_${month}_2026_${team}.pptx"`);
    res.send(buffer);
  } catch (err) {
    console.error('Error generating LSP PPT:', err);
    res.status(500).json({ error: err.message });
  }
});

// Data Exporter endpoint for range or single date
const { getExportMetricsRange } = require('./export_aggregator');

app.get('/api/export-metrics', async (req, res) => {
  const startDate = req.query.startDate || req.query.date || new Date().toISOString().split('T')[0];
  const endDate = req.query.endDate || startDate;
  const forceRefresh = req.query.refresh === 'true';
  console.log(`Fetching Export Metrics from ${startDate} to ${endDate} (forceRefresh: ${forceRefresh})`);
  try {
    const data = await getExportMetricsRange(startDate, endDate, forceRefresh);
    res.json({ startDate, endDate, totalDays: data.length, rows: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Standalone Desktop App (.exe) download endpoint
app.get('/download/LSP_Tracker.exe', (req, res) => {
  const exePath = path.join(__dirname, '..', 'public', 'download', 'LSP_Tracker.exe');
  if (fs.existsSync(exePath)) {
    return res.download(exePath, 'LSP_Tracker.exe');
  }
  res.status(404).send('LSP_Tracker.exe not found');
});

app.get('/download/DOR_Dashboard.exe', (req, res) => {
  const exePath = path.join(__dirname, '..', 'public', 'download', 'DOR_Dashboard.exe');
  if (fs.existsSync(exePath)) {
    return res.download(exePath, 'DOR_Dashboard.exe');
  }
  res.status(404).send('DOR_Dashboard.exe not found');
});

// Serve static extruder timeline JSON files directly from public and store with priority
app.use('/data/extruder', express.static(path.join(__dirname, '..', 'public', 'data', 'extruder')));
app.use('/data/extruder', express.static(path.join(__dirname, 'extruder_store')));
app.use('/data', express.static(path.join(__dirname, '..', 'public', 'data')));

// Serve built Vite assets AFTER API routes
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// SPA fallback – serve index.html for any non‑API route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`CMS Proxy Server running on http://localhost:${PORT}`);
});
