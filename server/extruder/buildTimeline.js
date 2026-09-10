const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BANGKOK = "+07:00";
const EXTRUDER_LINES = ["QUAD", "DUPLEX"];
const MAX_SAMPLES_PER_LINE = 12000;

class ExtruderTimelineInputError extends Error {
  constructor(message) {
    super(message);
    this.name = "ExtruderTimelineInputError";
  }
}

function parseExtruderDtMs(dt) {
  return Date.parse(`${dt.trim().replace(" ", "T")}${BANGKOK}`);
}

function isValidExtruderDate(date) {
  if (!DATE_RE.test(date)) return false;
  const y = Number(date.slice(0, 4));
  const mo = Number(date.slice(5, 7));
  const d = Number(date.slice(8, 10));
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function nextDate(date) {
  const next = new Date(Date.parse(`${date}T00:00:00Z`) + 24 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${next.getUTCFullYear()}-${p(next.getUTCMonth() + 1)}-${p(next.getUTCDate())}`;
}

function dayBounds(date) {
  return { start: `${date} 07:00:00`, end: `${nextDate(date)} 07:00:00` };
}

function bangkokProductionDate(now = new Date()) {
  const bangkok = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  if (bangkok.getUTCHours() < 7) bangkok.setUTCDate(bangkok.getUTCDate() - 1);
  const p = (n) => String(n).padStart(2, "0");
  return `${bangkok.getUTCFullYear()}-${p(bangkok.getUTCMonth() + 1)}-${p(bangkok.getUTCDate())}`;
}

function capRows(rows, cap) {
  const truncated = rows.length > cap;
  return { rows: truncated ? rows.slice(0, cap) : rows, truncated };
}

function buildExtruderLine(line, rows, truncated, error = null) {
  const ordered = [...rows].sort((a, b) => {
    const c = a.dt.localeCompare(b.dt);
    return c !== 0 ? c : a.runNum - b.runNum;
  });

  const samples = [];
  const runs = [];

  for (const r of ordered) {
    const tMs = parseExtruderDtMs(r.dt);
    if (!Number.isFinite(tMs)) continue;

    samples.push([tMs, toNum(r.tatawAct), toNum(r.tawSpec), toNum(r.efficiency)]);

    const last = runs[runs.length - 1];
    if (last && last.runNum === r.runNum) {
      last.endMs = tMs;
    } else {
      runs.push({
        runNum: r.runNum,
        recipeName: r.recipeName ?? null,
        recipeId: toNum(r.recipeId),
        startMs: tMs,
        endMs: tMs,
      });
    }
  }

  return { line, samples, runs, truncated, error };
}

function buildExtruderTimeline(input) {
  if (!isValidExtruderDate(input.date)) {
    throw new ExtruderTimelineInputError("date must use YYYY-MM-DD");
  }
  const next = nextDate(input.date);
  const lines = input.lines.map((l) => buildExtruderLine(l.line, l.rows, l.truncated, l.error ?? null));

  let asOfMs = null;
  for (const l of lines) {
    const last = l.samples[l.samples.length - 1];
    if (last && (asOfMs === null || last[0] > asOfMs)) asOfMs = last[0];
  }

  return {
    success: true,
    cached: input.cached ?? false,
    date: input.date,
    asOfMs,
    window: {
      start: new Date(Date.parse(`${input.date}T07:00:00${BANGKOK}`)).toISOString(),
      end: new Date(Date.parse(`${next}T07:00:00${BANGKOK}`)).toISOString(),
      timezone: "Asia/Bangkok",
    },
    lines,
  };
}

module.exports = {
  EXTRUDER_LINES,
  MAX_SAMPLES_PER_LINE,
  ExtruderTimelineInputError,
  parseExtruderDtMs,
  isValidExtruderDate,
  toNum,
  nextDate,
  dayBounds,
  bangkokProductionDate,
  capRows,
  buildExtruderLine,
  buildExtruderTimeline
};
