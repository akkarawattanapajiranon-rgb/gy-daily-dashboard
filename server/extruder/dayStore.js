const {
  bangkokProductionDate,
  buildExtruderTimeline,
  EXTRUDER_LINES,
  ExtruderTimelineInputError,
  isValidExtruderDate,
  MAX_SAMPLES_PER_LINE
} = require('./buildTimeline');
const { lineConfigs, loadLineRows } = require('./oracleSource');

const MAX_RETAINED_DAYS = 2;
const REFRESH_AFTER_MS = 10000;
const HISTORICAL_REFRESH_AFTER_MS = 15 * 60000;

const days = new Map();

function emptyDay() {
  const lines = new Map();
  for (const line of EXTRUDER_LINES) {
    lines.set(line, { rows: [], lastDt: null, truncated: false, error: null });
  }
  return { lines, fetchedAtMs: 0, inFlight: null };
}

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

  for (const [line, result] of results) {
    const state = day.lines.get(line);
    if (!state) continue;
    state.error = result.error;
    if (result.error) continue;
    state.truncated = state.truncated || result.truncated;
    mergeRows(state, result.rows);
  }
  day.fetchedAtMs = Date.now();
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
