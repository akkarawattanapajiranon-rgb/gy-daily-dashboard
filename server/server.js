require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignore self-signed certs globally
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Disable all browser HTTP caching for API endpoints and HTML pages
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/' || req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

const path = require('path');
const fs = require('fs');

const { getSnapshot, generateSnapshot } = require('./snapshot_generator');
const { runMorningSync } = require('./cron_morning_sync');

// Automatic Cloud Sync Schedule: Updates snapshots & Vercel automatically (08:30, 09:00, 09:10 AM and every 2 hours)
setInterval(() => {
  const now = new Date();
  const bangkokTime = new Date(now.getTime() + (7 * 3600 * 1000));
  const hours = bangkokTime.getUTCHours();
  const minutes = bangkokTime.getUTCMinutes();
  
  const isMorningReview = (hours === 9 && (minutes === 0 || minutes === 10)) || (hours === 8 && minutes === 30);
  const isPeriodicSync = (minutes === 0 && [11, 13, 15, 17, 19, 21, 23, 7].includes(hours));

  if (isMorningReview || isPeriodicSync) {
    console.log(`[Server Schedule] Running automatic cloud data sync (${hours}:${String(minutes).padStart(2, '0')})...`);
    runMorningSync().catch(err => console.error('[Automatic Sync Error]', err.message));
  }
}, 60 * 1000);

// Immediate Catch-Up Sync on Startup (Triggers 15s after startup non-blockingly)
setTimeout(async () => {
  const now = new Date();
  const bangkokTime = new Date(now.getTime() + (7 * 3600 * 1000));
  const todayStr = `${bangkokTime.getUTCFullYear()}-${String(bangkokTime.getUTCMonth() + 1).padStart(2, '0')}-${String(bangkokTime.getUTCDate()).padStart(2, '0')}`;
  console.log(`[Server Startup] Refreshing initial snapshot for ${todayStr}...`);
  try {
    await generateSnapshot(todayStr);
  } catch (err) {
    console.warn('[Startup Sync Error]', err.message);
  }
}, 15000);

// Auto-Refresh Current Day Data & Snapshot every 5 minutes (300,000 ms)
setInterval(async () => {
  const now = new Date();
  const bangkokTime = new Date(now.getTime() + (7 * 3600 * 1000));
  const todayStr = `${bangkokTime.getUTCFullYear()}-${String(bangkokTime.getUTCMonth() + 1).padStart(2, '0')}-${String(bangkokTime.getUTCDate()).padStart(2, '0')}`;
  try {
    console.log(`[5-Minute Auto Poller] Refreshing today's data & snapshot (${todayStr})...`);
    await generateSnapshot(todayStr);
  } catch (err) {
    console.warn(`[5-Minute Auto Poller] Notice for ${todayStr}:`, err.message);
  }
}, 5 * 60 * 1000);

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

// Breakdown parser (reads local Excel on T: drive)
const { parseBreakdown } = require('./breakdown_parser');

// Breakdown API endpoint
app.get('/api/breakdown', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const cacheKey = `breakdown:${date}`;
  const forceRefresh = !!req.query._t;
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  if (!forceRefresh) {
    const snap = getSnapshot(date);
    if (snap && snap.breakdown) {
      setCached(cacheKey, snap.breakdown);
      res.json(snap.breakdown);
      setImmediate(() => {
        try {
          const fresh = parseBreakdown(date);
          if (fresh && !fresh.error) setCached(cacheKey, fresh);
        } catch (e) {}
      });
      return;
    }
  }

  console.log(`Fetching Breakdown data for date: ${date}`);
  const data = parseBreakdown(date);
  if (data.error) {
    const snap = getSnapshot(date);
    if (snap && snap.breakdown) return res.json(snap.breakdown);
    return res.status(404).json({ error: data.error });
  }
  setCached(cacheKey, data);
  res.json(data);
});

// Aero Component Delay parser (reads local Excel on N: drive)
const { parseAeroDelay } = require('./aero_delay_parser');

// Aero Component Delay API endpoint
app.get('/api/aero-delay', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const cacheKey = `aeroDelay:${date}`;
  const forceRefresh = !!req.query._t;
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  if (!forceRefresh) {
    const snap = getSnapshot(date);
    if (snap && snap.aeroDelay) {
      setCached(cacheKey, snap.aeroDelay);
      res.json(snap.aeroDelay);
      setImmediate(() => {
        try {
          const fresh = parseAeroDelay(date);
          if (fresh && !fresh.error) setCached(cacheKey, fresh);
        } catch (e) {}
      });
      return;
    }
  }

  console.log(`Fetching Aero Delay data for date: ${date}`);
  const data = parseAeroDelay(date);
  if (data.error) {
    const snap = getSnapshot(date);
    if (snap && snap.aeroDelay) return res.json(snap.aeroDelay);
    return res.status(404).json({ error: data.error });
  }
  setCached(cacheKey, data);
  res.json(data);
});

// WBR Component Delay parser (reads local Excel on N: drive)
const { parseWbrDelay } = require('./wbr_delay_parser');

// WBR Component Delay API endpoint
app.get('/api/wbr-delay', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const cacheKey = `wbrDelay:${date}`;
  const forceRefresh = !!req.query._t;
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  if (!forceRefresh) {
    const snap = getSnapshot(date);
    if (snap && snap.wbrDelay) {
      setCached(cacheKey, snap.wbrDelay);
      res.json(snap.wbrDelay);
      setImmediate(() => {
        try {
          const fresh = parseWbrDelay(date);
          if (fresh && !fresh.error) setCached(cacheKey, fresh);
        } catch (e) {}
      });
      return;
    }
  }

  console.log(`Fetching WBR Delay data for date: ${date}`);
  const data = parseWbrDelay(date);
  if (data.error) {
    const snap = getSnapshot(date);
    if (snap && snap.wbrDelay) return res.json(snap.wbrDelay);
    return res.status(404).json({ error: data.error });
  }
  setCached(cacheKey, data);
  res.json(data);
});

// Fischer parser (reads local Excel on T: drive)
const { parseFischerData } = require('./fischer_parser');

// Fischer API endpoint
app.get('/api/fischer', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const cacheKey = `fischer:${date}`;
  const forceRefresh = !!req.query._t;
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  if (!forceRefresh) {
    const snap = getSnapshot(date);
    if (snap && snap.fischer) {
      setCached(cacheKey, snap.fischer);
      res.json(snap.fischer);
      setImmediate(() => {
        try {
          const fresh = parseFischerData(date);
          if (fresh && !fresh.error) setCached(cacheKey, fresh);
        } catch (e) {}
      });
      return;
    }
  }

  console.log(`Fetching Fischer data for date: ${date}`);
  const data = parseFischerData(date);
  if (data.error) {
    const snap = getSnapshot(date);
    if (snap && snap.fischer) return res.json(snap.fischer);
    return res.status(404).json({ error: data.error });
  }
  setCached(cacheKey, data);
  res.json(data);
});

// 3 Roll parser (reads local Excel on T: drive)
const { parse3RollData } = require('./roll3_parser');

// 3 Roll API endpoint
app.get('/api/3roll', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const cacheKey = `3roll:${date}`;
  const forceRefresh = !!req.query._t;
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  if (!forceRefresh) {
    const snap = getSnapshot(date);
    if (snap && snap.roll3) {
      setCached(cacheKey, snap.roll3);
      res.json(snap.roll3);
      setImmediate(() => {
        try {
          const fresh = parse3RollData(date);
          if (fresh && !fresh.error) setCached(cacheKey, fresh);
        } catch (e) {}
      });
      return;
    }
  }

  console.log(`Fetching 3 Roll WINDUP data for date: ${date}`);
  const data = parse3RollData(date);
  if (data.error) {
    const snap = getSnapshot(date);
    if (snap && snap.roll3) return res.json(snap.roll3);
    return res.status(404).json({ error: data.error });
  }
  setCached(cacheKey, data);
  res.json(data);
});

// 4 Roll 2 parser (reads Productivity Check sheet on T: drive)
const { parse4Roll2Data } = require('./roll42_parser');

app.get('/api/4roll2', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const cacheKey = `4roll2:${date}`;
  const forceRefresh = !!req.query._t;
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  if (!forceRefresh) {
    const snap = getSnapshot(date);
    if (snap && snap.roll42) {
      setCached(cacheKey, snap.roll42);
      res.json(snap.roll42);
      setImmediate(() => {
        try {
          const fresh = parse4Roll2Data(date);
          if (fresh && !fresh.error) setCached(cacheKey, fresh);
        } catch (e) {}
      });
      return;
    }
  }

  console.log(`Fetching 4 Roll 2 Productivity data for date: ${date}`);
  const data = parse4Roll2Data(date);
  if (data.error) {
    const snap = getSnapshot(date);
    if (snap && snap.roll42) return res.json(snap.roll42);
    return res.status(404).json({ error: data.error });
  }
  setCached(cacheKey, data);
  res.json(data);
});

// Weekly OEE parser (reads QUAD, TUBER, FISCHER OEE for WTD AVG)
const { parseWeeklyOee } = require('./weekly_oee_parser');

// Weekly OEE API endpoint
app.get('/api/oee-weekly', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const cacheKey = `oee-weekly:${date}`;
  const forceRefresh = !!req.query._t;
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  if (!forceRefresh) {
    const snap = getSnapshot(date);
    if (snap && snap.weeklyOee) {
      setCached(cacheKey, snap.weeklyOee);
      res.json(snap.weeklyOee);
      setImmediate(() => {
        try {
          const fresh = parseWeeklyOee(date);
          if (fresh && !fresh.error) setCached(cacheKey, fresh);
        } catch (e) {}
      });
      return;
    }
  }

  console.log(`Fetching Weekly OEE WTD data for date: ${date}`);
  const data = parseWeeklyOee(date);
  if (data.error) {
    const snap = getSnapshot(date);
    if (snap && snap.weeklyOee) return res.json(snap.weeklyOee);
    return res.status(404).json({ error: data.error });
  }
  setCached(cacheKey, data);
  res.json(data);
});

// Workaway parser (reads Disposition Non-moving Excel on T: drive)
const { parseWorkawayData } = require('./workaway_parser');

// Workaway API endpoint
app.get('/api/workaway', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const cacheKey = `workaway:${date}`;
  const forceRefresh = !!req.query._t;
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  if (!forceRefresh) {
    const snap = getSnapshot(date);
    if (snap && snap.workaway) {
      setCached(cacheKey, snap.workaway);
      res.json(snap.workaway);
      setImmediate(() => {
        try {
          const fresh = parseWorkawayData(date);
          if (fresh && !fresh.error) setCached(cacheKey, fresh);
        } catch (e) {}
      });
      return;
    }
  }

  console.log(`Fetching Workaway Inventory data for date: ${date}`);
  const data = parseWorkawayData(date);
  if (data.error) {
    const snap = getSnapshot(date);
    if (snap && snap.workaway) return res.json(snap.workaway);
    return res.status(404).json({ error: data.error });
  }
  setCached(cacheKey, data);
  res.json(data);
});

// Quad parser
const { parseQuadData } = require('./quad_parser');
app.get('/api/quad', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const cacheKey = `quad:${date}`;
  const forceRefresh = !!req.query._t;
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  if (!forceRefresh) {
    const snap = getSnapshot(date);
    if (snap && snap.quad) {
      setCached(cacheKey, snap.quad);
      res.json(snap.quad);
      setImmediate(() => {
        try {
          const fresh = parseQuadData(date);
          if (fresh && !fresh.error) setCached(cacheKey, fresh);
        } catch (e) {}
      });
      return;
    }
  }

  console.log(`Fetching Quad data for date: ${date}`);
  const data = parseQuadData(date);
  if (data.error) {
    const snap = getSnapshot(date);
    if (snap && snap.quad) return res.json(snap.quad);
    return res.status(404).json({ error: data.error });
  }
  setCached(cacheKey, data);
  res.json(data);
});

// Tuber parser
const { parseTuberData } = require('./tuber_parser');
app.get('/api/tuber', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const cacheKey = `tuber:${date}`;
  const forceRefresh = !!req.query._t;
  const cached = getCached(cacheKey, forceRefresh);
  if (cached) return res.json(cached);

  if (!forceRefresh) {
    const snap = getSnapshot(date);
    if (snap && snap.tuber) {
      setCached(cacheKey, snap.tuber);
      res.json(snap.tuber);
      setImmediate(() => {
        try {
          const fresh = parseTuberData(date);
          if (fresh && !fresh.error) setCached(cacheKey, fresh);
        } catch (e) {}
      });
      return;
    }
  }

  console.log(`Fetching Tuber data for date: ${date}`);
  const data = parseTuberData(date);
  if (data.error) {
    const snap = getSnapshot(date);
    if (snap && snap.tuber) return res.json(snap.tuber);
    return res.status(404).json({ error: data.error });
  }
  setCached(cacheKey, data);
  res.json(data);
});

// Waste parser (reads gy_reports from gy-waste-report Firebase and local Excel fallback)
const { parseWasteData, parseWasteDataAsync } = require('./waste_parser');

app.get('/api/waste', async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  console.log(`Fetching Waste data for date: ${date}`);
  const data = await parseWasteDataAsync(date);
  if ((!data || data.error || !data.hasData)) {
    const snap = getSnapshot(date);
    if (snap && snap.waste && snap.waste.hasData) return res.json(snap.waste);
  }
  if (!data) {
    return res.json({
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
  }
  res.json(data);
});

// CMS live parser
const { fetchLiveCmsData } = require('./cms_parser');

app.get('/api/cms', async (req, res) => {
  const targetDate = req.query.date || new Date().toISOString().split('T')[0];
  console.log(`Fetching CMS Data for date: ${targetDate}`);
  const liveData = await fetchLiveCmsData(targetDate);

  if (liveData && !liveData.error) {
    return res.json(liveData);
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

  // Instant fast-path: for any date with existing public or store cache
  if (!forceRefresh) {
    const candidateFiles = [
      path.join(__dirname, '..', 'public', 'data', 'extruder', `${date}.json`),
      path.join(__dirname, '..', 'dist', 'data', 'extruder', `${date}.json`),
      path.join(__dirname, 'extruder_store', `${date}.json`)
    ];
    for (const f of candidateFiles) {
      if (fs.existsSync(f)) {
        try {
          const fileContent = fs.readFileSync(f, 'utf8');
          const json = JSON.parse(fileContent);
          if (json && (json.success !== false || json.lines)) {
            res.setHeader('Cache-Control', 'public, max-age=300');
            res.type('json').send(fileContent);
            // Trigger background sync if needed
            getExtruderTimeline(date, undefined, false).catch(() => {});
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
