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

    const hp1 = toNum(r.hpress1) ?? 0;
    const hp2 = toNum(r.hpress2) ?? 0;
    const hp3 = toNum(r.hpress3) ?? 0;
    const hp4 = toNum(r.hpress4) ?? 0;
    const maxHp = Math.max(hp1, hp2, hp3, hp4);

    const lineSpeed = toNum(r.lineSpeed) ?? 0;
    const s21 = toNum(r.s21) ?? 0;
    const s22 = toNum(r.s22) ?? 0;
    const s23 = toNum(r.s23) ?? 0;
    const s24 = toNum(r.s24) ?? 0;
    const maxScrewSpeed = Math.max(s21, s22, s23, s24);

    const isDuplexOrTuber = line.toUpperCase().includes("DUPLEX") || line.toUpperCase().includes("TUBER");
    const isQuad = line.toUpperCase().includes("QUAD");
    const hasSpeed = lineSpeed > 0.5 || maxScrewSpeed > 5.0;

    let act = toNum(r.tatawAct);

    if (isQuad) {
      // User Rules for QUAD:
      // 1. Hpress 3 ไม่ทำงาน (<= 3.0 Bars) + TAW act ไม่มี speed เลย => ขึ้นดำ (act = null)
      // 2. Hpress 3 ไม่ทำงาน + TAW act มี speed รันแต่ต่ำกว่า TAW spec => ขึ้นแดง (act retained)
      // 3. Hpress 3 ไม่ทำงาน + TAW act มี speed รันมากกว่า/เท่ากับ TAW spec => ขึ้นเขียว (act retained)
      // 4. Hpress 3 ทำงาน (> 3.0 Bars) + TAW act มี speed ปกติ => เทียบตาม standard เดิม (act retained)
      const isHpress3Active = hp3 > 3.0;
      if (!isHpress3Active && !hasSpeed) {
        act = null;
      }
    } else if (isDuplexOrTuber) {
      // Tuber/DUPLEX: ใช้ Hpress2 เป็นตัวชี้วัด — ถ้า < 3.0 bar = เครื่องไม่ทำงาน
      const isHpress2Active = hp2 > 3.0;
      if (!isHpress2Active && !hasSpeed) {
        act = null;
      }
    } else {
      const hasPressureSensors = hp1 > 0 || hp2 > 0 || hp3 > 0 || hp4 > 0;
      const isStopped = hasPressureSensors && maxHp <= 3.0;
      if (isStopped) act = null;
    }

    const hpressVal = isDuplexOrTuber ? toNum(r.hpress2) : toNum(r.hpress3);

    samples.push([tMs, act, toNum(r.tawSpec), toNum(r.efficiency), hpressVal]);

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
