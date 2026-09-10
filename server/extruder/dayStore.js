const fs = require('fs');
const path = require('path');
const {
  bangkokProductionDate,
  buildExtruderTimeline,
  EXTRUDER_LINES,
  ExtruderTimelineInputError,
  isValidExtruderDate,
  MAX_SAMPLES_PER_LINE
} = require('./buildTimeline');
const { lineConfigs, loadLineRows } = require('./oracleSource');

const MAX_RETAINED_DAYS = 7; // Store max 7 days rolling window locally on user's machine
const REFRESH_AFTER_MS = 5 * 60 * 1000; // 5 minutes (300,000 ms)
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
 * Retain only last 7 days of files in server/extruder_store/
 */
function pruneOldFiles(nowDateStr) {
  try {
    if (!fs.existsSync(STORE_DIR)) return;
    const files = fs.readdirSync(STORE_DIR);
    
    // Calculate cutoff date (7 days ago)
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
        console.log(`[Extruder Store] Pruned historical file older than 7 days: ${file}`);
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

async function getExtruderTimeline(date, now = () => new Date()) {
  if (!isValidExtruderDate(date)) {
    throw new ExtruderTimelineInputError("date must use YYYY-MM-DD");
  }

  const currentDateStr = bangkokProductionDate(now());
  pruneOldFiles(currentDateStr);

  let day = days.get(date);
  if (!day) {
    day = loadDayFromDisk(date) || emptyDay();
    days.set(date, day);
  }

  const isCurrent = (date === currentDateStr);
  const ttl = isCurrent ? REFRESH_AFTER_MS : 3600000;
  const ageMs = Date.now() - day.fetchedAtMs;
  const cached = (day.fetchedAtMs > 0 && ageMs < ttl) || (!isCurrent && day.lines.get("DUPLEX")?.rows.length > 0);

  if (!cached && isCurrent) {
    const current = day;
    const pending = current.inFlight
      || (current.inFlight = refresh(date, current).finally(() => { current.inFlight = null; }));
    await pending.catch(() => {});
  }

  return buildExtruderTimeline({
    date,
    cached,
    lines: [...day.lines.entries()].map(([line, state]) => ({
      line,
      rows: state.rows,
      truncated: state.truncated,
      error: state.error,
    })),
  });
}

function __resetStore() {
  days.clear();
}

module.exports = {
  mergeRows,
  getExtruderTimeline,
  __resetStore
};
