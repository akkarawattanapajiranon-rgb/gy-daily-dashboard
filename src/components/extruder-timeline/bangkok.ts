// Production-day, shift and clock maths for the extruder panel.
//
// LANDMINE, and the reason this file exists standalone: the plant is UTC+7 and
// servers/containers run UTC. `new Date(y, m, d, h)` yields 07:00 UTC = 14:00
// Bangkok and shifts every production day by seven hours, silently, with no
// error anywhere. Every instant below is built by appending an explicit +07:00
// offset to an ISO string. Never construct one any other way.
//
// React-free on purpose, so it is unit-testable without a DOM.

const BANGKOK = "+07:00";
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

export type ProductionShift = "ALL" | "MORNING" | "AFTERNOON" | "NIGHT";

export const PRODUCTION_SHIFTS: ReadonlyArray<{ value: ProductionShift; label: string }> = [
  { value: "ALL", label: "All Shifts" },
  { value: "MORNING", label: "Morning (Shift 1)" },
  { value: "AFTERNOON", label: "Afternoon (Shift 2)" },
  { value: "NIGHT", label: "Night (Shift 3)" },
];

/** The production date `now` falls in. A production day runs 07:00 → 07:00
 *  Bangkok, so 02:00 on the 5th still belongs to the 4th. */
export function bangkokProductionDate(now = new Date()): string {
  const bangkok = new Date(now.getTime() + BANGKOK_OFFSET_MS);
  if (bangkok.getUTCHours() < 7) bangkok.setUTCDate(bangkok.getUTCDate() - 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${bangkok.getUTCFullYear()}-${p(bangkok.getUTCMonth() + 1)}-${p(bangkok.getUTCDate())}`;
}

/** Next calendar date for a 'YYYY-MM-DD' (UTC-safe increment). */
export function nextProductionDate(date: string): string {
  const next = new Date(Date.parse(`${date}T00:00:00Z`) + 24 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${next.getUTCFullYear()}-${p(next.getUTCMonth() + 1)}-${p(next.getUTCDate())}`;
}

function atHour(date: string, hour: number): number {
  return Date.parse(`${date}T${String(hour).padStart(2, "0")}:00:00${BANGKOK}`);
}

/** Bangkok-local [start,end) ms for a shift within the 07:00 production day.
 *  S1 07:00-15:00, S2 15:00-23:00, S3 23:00-07:00(next), ALL = full day. */
export function shiftBounds(
  productionDate: string,
  shift: ProductionShift,
): { startMs: number; endMs: number } {
  const next = nextProductionDate(productionDate);
  switch (shift) {
    case "MORNING":   return { startMs: atHour(productionDate, 7),  endMs: atHour(productionDate, 15) };
    case "AFTERNOON": return { startMs: atHour(productionDate, 15), endMs: atHour(productionDate, 23) };
    case "NIGHT":     return { startMs: atHour(productionDate, 23), endMs: atHour(next, 7) };
    case "ALL":
    default:          return { startMs: atHour(productionDate, 7),  endMs: atHour(next, 7) };
  }
}

/** Where `timestamp` sits in [start,end], clamped to 0..1. A zero-width window
 *  (a mid-edit date input) returns 0 rather than NaN, which would silently
 *  blank the whole canvas. */
export function timelineFraction(timestamp: number, start: number, end: number): number {
  const span = end - start;
  if (!(span > 0) || !Number.isFinite(timestamp)) return 0;
  return Math.min(1, Math.max(0, (timestamp - start) / span));
}

const HH_MM = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", hour12: false,
});
const HH_MM_SS = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
});
const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
});

/** "14:35" in Bangkok, whatever the viewer's own timezone is. Intl with an
 *  explicit timeZone is the only formatter that is safe here — toLocaleString
 *  without it renders the BROWSER's clock, so the same lane reads differently
 *  from a laptop in another country. */
export function formatBangkokTime(timestamp: number): string {
  return Number.isFinite(timestamp) ? HH_MM.format(new Date(timestamp)) : "—";
}

/** Seconds included: the feed samples every ~10s, so HH:MM would make six
 *  consecutive samples look like the same instant in a tooltip. */
export function formatBangkokTimeSeconds(timestamp: number): string {
  return Number.isFinite(timestamp) ? HH_MM_SS.format(new Date(timestamp)) : "—";
}

/** "04/09/2026, 14:35:02" — the CSV form, where the date matters because a
 *  night shift crosses midnight. */
export function formatBangkokDateTime(timestamp: number): string {
  return Number.isFinite(timestamp) ? DATE_TIME.format(new Date(timestamp)) : "";
}
