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

const MAX_RETAINED_DAYS = 5;
const REFRESH_AFTER_MS = 10000;
const HISTORICAL_REFRESH_AFTER_MS = 15 * 60000;
const CACHE_FILE = path.join(__dirname, '..', 'extruder_cache.json');

const days = new Map();

function emptyDay() {
  const lines = new Map();
  for (const line of EXTRUDER_LINES) {
    lines.set(line, { rows: [], lastDt: null, truncated: false, error: null });
  }
  return { lines, fetchedAtMs: 0, inFlight: null };
}

function loadDiskCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const json = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      for (const [dateStr, dateObj] of Object.entries(json)) {
        const day = emptyDay();
        for (const [line, stateData] of Object.entries(dateObj.lines || {})) {
          day.lines.set(line, {
            rows: stateData.rows || [],
            lastDt: stateData.lastDt || null,
            truncated: Boolean(stateData.truncated),
            error: null
          });
        }
        day.fetchedAtMs = dateObj.fetchedAtMs || Date.now();
        days.set(dateStr, day);
      }
      console.log(`[Extruder Cache] Loaded ${days.size} dates from disk cache`);
    }
  } catch (e) {
    console.warn('[Extruder Cache] Failed to load disk cache:', e.message);
  }
}

function saveDiskCache() {
  try {
    const obj = {};
    for (const [dateStr, day] of days.entries()) {
      const linesObj = {};
      for (const [line, state] of day.lines.entries()) {
        linesObj[line] = {
          rows: state.rows,
          lastDt: state.lastDt,
          truncated: state.truncated
        };
      }
      obj[dateStr] = {
        lines: linesObj,
        fetchedAtMs: day.fetchedAtMs
      };
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Extruder Cache] Failed to save disk cache:', e.message);
  }
}

// Initial load on server startup
loadDiskCache();

function evict() {
  if (days.size <= MAX_RETAINED_DAYS) return;
  const ordered = [...days.keys()].sort();
  for (const date of ordered.slice(0, days.size - MAX_RETAINED_DAYS)) days.delete(date);
}

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

  let hasUpdates = false;
  for (const [line, result] of results) {
    const state = day.lines.get(line);
    if (!state) continue;
    if (result.error) {
      // If we have cached rows for this line, preserve them and clear error
      if (state.rows && state.rows.length > 0) {
        state.error = null;
      } else {
        state.error = result.error;
      }
      continue;
    }
    state.error = null;
    state.truncated = state.truncated || result.truncated;
    const lenBefore = state.rows.length;
    mergeRows(state, result.rows);
    if (state.rows.length > lenBefore) {
      hasUpdates = true;
    }
  }
  day.fetchedAtMs = Date.now();
  saveDiskCache();
}

async function getExtruderTimeline(date, now = () => new Date()) {
  if (!isValidExtruderDate(date)) {
    throw new ExtruderTimelineInputError("date must use YYYY-MM-DD");
  }

  let day = days.get(date);
  if (!day) {
    day = emptyDay();
    days.set(date, day);
  }

  const isCurrent = date >= bangkokProductionDate(now());
  const ttl = isCurrent ? REFRESH_AFTER_MS : HISTORICAL_REFRESH_AFTER_MS;
  const ageMs = Date.now() - day.fetchedAtMs;
  const cached = day.fetchedAtMs > 0 && ageMs < ttl;

  if (!cached) {
    const current = day;
    const pending = current.inFlight
      || (current.inFlight = refresh(date, current).finally(() => { current.inFlight = null; }));
    await pending.catch(() => {});
    evict();
  }

  return buildExtruderTimeline({
    date,
    cached,
    lines: [...day.lines.entries()].map(([line, state]) => ({
      line,
      rows: state.rows,
      truncated: state.truncated,
      error: state.rows && state.rows.length > 0 ? null : state.error,
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
