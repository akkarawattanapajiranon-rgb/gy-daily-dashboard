require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignore self-signed certs globally
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const path = require('path');

const { getSnapshot } = require('./snapshot_generator');

// In-memory API cache (30-second TTL) to avoid heavy synchronous re-parsing on every request
const apiMemoryCache = new Map();
const CACHE_TTL_MS = 30 * 1000;

function getCached(key) {
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
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

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

// Fischer parser (reads local Excel on T: drive)
const { parseFischerData } = require('./fischer_parser');

// Fischer API endpoint
app.get('/api/fischer', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const cacheKey = `fischer:${date}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

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
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

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
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

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
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

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
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

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
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

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
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

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
const { bangkokProductionDate, ExtruderTimelineInputError } = require('./extruder/buildTimeline');

app.get('/api/extruder-timeline', async (req, res) => {
  const date = req.query.date || bangkokProductionDate();
  console.log(`Fetching Extruder Timeline for date: ${date}`);
  try {
    const data = await getExtruderTimeline(date);
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

// Data Exporter endpoint for range or single date
const { getExportMetricsRange } = require('./export_aggregator');

app.get('/api/export-metrics', async (req, res) => {
  const startDate = req.query.startDate || req.query.date || new Date().toISOString().split('T')[0];
  const endDate = req.query.endDate || startDate;
  console.log(`Fetching Export Metrics from ${startDate} to ${endDate}`);
  try {
    const data = await getExportMetricsRange(startDate, endDate);
    res.json({ startDate, endDate, totalDays: data.length, rows: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve built Vite assets AFTER API routes
app.use(express.static(path.join(__dirname, '..', 'dist')));

// SPA fallback – serve index.html for any non‑API route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`CMS Proxy Server running on http://localhost:${PORT}`);
});
