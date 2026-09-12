const fs = require('fs');
const path = require('path');
const {
  bangkokProductionDate,
  buildExtruderTimeline,
  EXTRUDER_LINES,
  ExtruderTimelineInputError,
  isValidExtruderDate,
  MAX_SAMPLES_PER_LINE,
  nextDate
} = require('./buildTimeline');
const { lineConfigs, loadLineRows } = require('./oracleSource');

const MAX_RETAINED_DAYS = 15; // Store max 15 days rolling window locally on user's machine
const REFRESH_AFTER_MS = 10 * 60 * 1000; // 10 minutes (600,000 ms)
const STORE_DIR = path.join(__dirname, '..', 'extruder_store');

if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

const days = new Map();

function emptyDay() {
  const lines = new Map();
  for (const line of EXTRUDER_LINES) {
    lines.set(line, { rows: [], lastDt: null, truncated: false, error: null });
  }
  return { lines, fetchedAtMs: 0, inFlight: null };
}

function getStoreFilePath(dateStr) {
  return path.join(STORE_DIR, `${dateStr}.json`);
}

function loadDayFromDisk(dateStr) {
  const filePath = getStoreFilePath(dateStr);
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(raw);
    const day = emptyDay();
    day.fetchedAtMs = json.fetchedAtMs || Date.now();

    for (const [line, stateData] of Object.entries(json.lines || {})) {
      day.lines.set(line, {
        rows: stateData.rows || [],
        lastDt: stateData.lastDt || null,
        truncated: Boolean(stateData.truncated),
        error: null
      });
    }
    return day;
  } catch (e) {
    console.warn(`[Extruder Store] Failed to read ${dateStr}.json:`, e.message);
    return null;
  }
}

function saveDayToDisk(dateStr, day) {
  const filePath = getStoreFilePath(dateStr);
  try {
    const linesObj = {};
    for (const [line, state] of day.lines.entries()) {
      linesObj[line] = {
        rows: state.rows,
        lastDt: state.lastDt,
        truncated: state.truncated
      };
    }
    const data = {
      date: dateStr,
      fetchedAtMs: day.fetchedAtMs,
      lines: linesObj
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn(`[Extruder Store] Failed to save ${dateStr}.json:`, e.message);
  }
}

/**
 * Retain only last 15 days of files in server/extruder_store/
 */
function pruneOldFiles(nowDateStr) {
  try {
    if (!fs.existsSync(STORE_DIR)) return;
    const files = fs.readdirSync(STORE_DIR);
    
    // Calculate cutoff date (15 days ago)
    const refDate = new Date(nowDateStr + 'T00:00:00Z');
    const cutoffDate = new Date(refDate.getTime() - (MAX_RETAINED_DAYS - 1) * 86400000);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const datePart = file.replace('.json', '');
      if (datePart < cutoffStr) {
        const fullPath = path.join(STORE_DIR, file);
        fs.unlinkSync(fullPath);
        days.delete(datePart);
        console.log(`[Extruder Store] Pruned historical file older than 15 days: ${file}`);
      }
    }
  } catch (e) {
    console.warn('[Extruder Store] Error pruning old files:', e.message);
  }
}

// Migrate existing extruder_cache.json if present into extruder_store
function migrateLegacyCache() {
  const legacyFile = path.join(__dirname, '..', 'extruder_cache.json');
  if (fs.existsSync(legacyFile)) {
    try {
      const json = JSON.parse(fs.readFileSync(legacyFile, 'utf8'));
      for (const [dateStr, dateObj] of Object.entries(json)) {
        const filePath = getStoreFilePath(dateStr);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, JSON.stringify({
            date: dateStr,
            fetchedAtMs: dateObj.fetchedAtMs || Date.now(),
            lines: dateObj.lines || {}
          }, null, 2), 'utf8');
          console.log(`[Extruder Store] Migrated legacy cache for ${dateStr}`);
        }
      }
    } catch (e) {
      console.warn('[Extruder Store] Migration warning:', e.message);
    }
  }
}

// Run migration & initial cleanup on module load
migrateLegacyCache();
pruneOldFiles(bangkokProductionDate());

function mergeRows(state, incoming) {
  if (!incoming || incoming.length === 0) return;
  const seen = new Set(state.rows.map((r) => `${r.dt}|${r.runNum}`));
  for (const row of incoming) {
    const key = `${row.dt}|${row.runNum}`;
    if (seen.has(key)) continue;
    seen.add(key);
    state.rows.push(row);
    if (state.lastDt === null || row.dt > state.lastDt) state.lastDt = row.dt;
  }
  if (state.rows.length > MAX_SAMPLES_PER_LINE) {
    state.rows.sort((a, b) => a.dt.localeCompare(b.dt));
    state.rows = state.rows.slice(state.rows.length - MAX_SAMPLES_PER_LINE);
    state.truncated = true;
  }
}

async function refresh(date, day) {
  const configs = lineConfigs();
  const results = await Promise.all(
    configs.map(async (cfg) => {
      const state = day.lines.get(cfg.line);
      return [cfg.line, await loadLineRows(cfg, date, state?.lastDt ?? null)];
    })
  );

  for (const [line, result] of results) {
    const state = day.lines.get(line);
    if (!state) continue;
    if (result.error) {
      if (state.rows && state.rows.length > 0) {
        state.error = null;
      } else {
        state.error = result.error;
      }
      continue;
    }
    state.error = null;
    state.truncated = state.truncated || result.truncated;
    mergeRows(state, result.rows);
  }
  day.fetchedAtMs = Date.now();
  saveDayToDisk(date, day);
}

async function getExtruderTimeline(date, now = () => new Date(), forceRefresh = false) {
  if (!isValidExtruderDate(date)) {
    throw new ExtruderTimelineInputError("date must use YYYY-MM-DD");
  }

  const currentDateStr = bangkokProductionDate(now());
  pruneOldFiles(currentDateStr);

  // Check 15-day window constraint: Day 16+ is not supported and will never query Oracle
  const refDate = new Date(currentDateStr + 'T00:00:00Z');
  const cutoffDate = new Date(refDate.getTime() - (MAX_RETAINED_DAYS - 1) * 86400000);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  if (date < cutoffStr) {
    throw new ExtruderTimelineInputError(`Historical extruder data older than 15 days (${cutoffStr}) is not available.`);
  }

  let day = days.get(date);
  if (!day || [...day.lines.values()].some(l => !l.rows || l.rows.length === 0)) {
    const diskDay = loadDayFromDisk(date);
    if (diskDay) {
      day = diskDay;
      days.set(date, day);
    } else if (!day) {
      day = emptyDay();
      days.set(date, day);
    }
  }

  const isCurrent = (date === currentDateStr);
  const allLinesHaveData = EXTRUDER_LINES.every(line => {
    const l = day.lines.get(line);
    return l && l.rows && l.rows.length > 0;
  });
  const hasAnyData = EXTRUDER_LINES.some(line => {
    const l = day.lines.get(line);
    return l && l.rows && l.rows.length > 0;
  });

  const next = nextDate(date);
  const dayEndMs = Date.parse(`${next}T07:00:00+07:00`);
  // A past production day is fully complete only if fetchedAtMs was after the 24-hr day ended at 07:00 AM
  const isPastDayFullySynced = (!isCurrent && day.fetchedAtMs >= dayEndMs);

  const ttl = isCurrent ? REFRESH_AFTER_MS : 86400000;
  const ageMs = Date.now() - day.fetchedAtMs;
  const cached = allLinesHaveData && (isCurrent ? (ageMs < ttl) : isPastDayFullySynced) && !forceRefresh;

  if (!cached) {
    const current = day;
    const pending = current.inFlight
      || (current.inFlight = refresh(date, current).finally(() => { current.inFlight = null; }));

    // Non-blocking serving: if we already have data from disk/memory and not a manual forced refresh,
    // serve immediately without making the user wait, and let refresh finish in the background.
    if (hasAnyData && !forceRefresh) {
      pending.catch((err) => console.warn(`[Extruder Store] Background refresh error for ${date}:`, err.message));
    } else {
      await pending.catch(() => {});
    }
  }

  return buildExtruderTimeline({
    date,
    cached: Boolean(cached || hasAnyData),
    lines: [...day.lines.entries()].map(([line, state]) => ({
      line,
      rows: state.rows,
      truncated: state.truncated,
      error: state.rows && state.rows.length > 0 ? null : state.error,
    })),
  });
}

let daemonTimer = null;

async function syncCurrentDayDaemon() {
  const today = bangkokProductionDate();
  try {
    let day = days.get(today);
    if (!day || [...day.lines.values()].some(l => !l.rows || l.rows.length === 0)) {
      const diskDay = loadDayFromDisk(today);
      if (diskDay) {
        day = diskDay;
        days.set(today, day);
      } else if (!day) {
        day = emptyDay();
        days.set(today, day);
      }
    }

    if (!day.inFlight) {
      day.inFlight = refresh(today, day).finally(() => {
        day.inFlight = null;
      });
      await day.inFlight;
      const counts = [...day.lines.entries()].map(([k, v]) => `${k}: ${v.rows.length}`).join(', ');
      console.log(`[Extruder Daemon] Synced and saved ${today} to disk (${counts}) at ${new Date().toLocaleTimeString('en-GB')}`);
    }
  } catch (e) {
    console.warn(`[Extruder Daemon] Sync error for ${today}:`, e.message);
  }
}

function startExtruderDaemon() {
  if (daemonTimer) return;
  console.log('[Extruder Daemon] Starting automatic 10-minute background saver for current day...');
  // Initial sync after 3s delay
  setTimeout(() => {
    syncCurrentDayDaemon().catch(() => {});
  }, 3000);
  // Recurring every 10 minutes (REFRESH_AFTER_MS)
  daemonTimer = setInterval(() => {
    syncCurrentDayDaemon().catch(() => {});
  }, REFRESH_AFTER_MS);
}

// Auto-start daemon when dayStore module is loaded
startExtruderDaemon();

function __resetStore() {
  days.clear();
}

module.exports = {
  mergeRows,
  getExtruderTimeline,
  startExtruderDaemon,
  syncCurrentDayDaemon,
  __resetStore
};
