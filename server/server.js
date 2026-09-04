require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignore self-signed certs globally
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const path = require('path');

// Breakdown parser (reads local Excel on T: drive)
const { parseBreakdown } = require('./breakdown_parser');

// Breakdown API endpoint
app.get('/api/breakdown', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  console.log(`Fetching Breakdown data for date: ${date}`);
  const data = parseBreakdown(date);
  if (data.error) {
    return res.status(404).json({ error: data.error });
  }
  res.json(data);
});

// Fischer parser (reads local Excel on T: drive)
const { parseFischerData } = require('./fischer_parser');

// Fischer API endpoint
app.get('/api/fischer', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  console.log(`Fetching Fischer data for date: ${date}`);
  const data = parseFischerData(date);
  if (data.error) {
    return res.status(404).json({ error: data.error });
  }
  res.json(data);
});

// 3 Roll parser (reads local Excel on T: drive)
const { parse3RollData } = require('./roll3_parser');

// 3 Roll API endpoint
app.get('/api/3roll', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  console.log(`Fetching 3 Roll WINDUP data for date: ${date}`);
  const data = parse3RollData(date);
  if (data.error) {
    return res.status(404).json({ error: data.error });
  }
  res.json(data);
});

// Weekly OEE parser (reads QUAD, TUBER, FISCHER OEE for WTD AVG)
const { parseWeeklyOee } = require('./weekly_oee_parser');

// Weekly OEE API endpoint
app.get('/api/oee-weekly', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  console.log(`Fetching Weekly OEE WTD data for date: ${date}`);
  const data = parseWeeklyOee(date);
  if (data.error) {
    return res.status(404).json({ error: data.error });
  }
  res.json(data);
});

// Workaway parser (reads Disposition Non-moving Excel on T: drive)
const { parseWorkawayData } = require('./workaway_parser');

// Workaway API endpoint
app.get('/api/workaway', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  console.log(`Fetching Workaway Inventory data for date: ${date}`);
  const data = parseWorkawayData(date);
  if (data.error) {
    return res.status(404).json({ error: data.error });
  }
  res.json(data);
});

// Quad parser
const { parseQuadData } = require('./quad_parser');
app.get('/api/quad', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  console.log(`Fetching Quad data for date: ${date}`);
  const data = parseQuadData(date);
  if (data.error) {
    return res.status(404).json({ error: data.error });
  }
  res.json(data);
});

// Tuber parser
const { parseTuberData } = require('./tuber_parser');
app.get('/api/tuber', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  console.log(`Fetching Tuber data for date: ${date}`);
  const data = parseTuberData(date);
  if (data.error) {
    return res.status(404).json({ error: data.error });
  }
  res.json(data);
});

// Waste parser (reads local Excel on T: drive)
const { parseWasteData } = require('./waste_parser');

app.get('/api/waste', (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  console.log(`Fetching Waste data for date: ${date}`);
  const data = parseWasteData(date);
  if (data.error && !data.hasData) {
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
