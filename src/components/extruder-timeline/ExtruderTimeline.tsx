"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildExtruderGaps,
  buildExtruderSegments,
  clampRunsToWindow,
  classifyCodePct,
  classifyTaw,
  deriveChangeovers,
  describeCodePct,
  filterSamplesToWindow,
  formatDurationLong,
  formatDurationShort,
  isCoverageMaterial,
  resolveRunAt,
  summarizeCodes,
  summarizeGaps,
  summarizeLine,
  MAX_GAP_MS,
  TAW_TOLERANCE_PCT,
  VERDICT_COLOR,
  type ExtruderChangeover,
  type ExtruderGap,
  type ExtruderSegment,
} from "./extruderTimelineModel";
import {
  bangkokProductionDate,
  formatBangkokTime,
  formatBangkokTimeSeconds,
  shiftBounds,
  timelineFraction,
  PRODUCTION_SHIFTS,
  type ProductionShift,
} from "./bangkok";
import { csvFilename, downloadCsv, extruderIdleCsv, extruderTimelineCsv, toCsv } from "./csv";
import { useExtruderTimeline } from "./useExtruderTimeline";
import type { ExtruderRun, ExtruderSample } from "./types";

/**
 * Extruder — TAW Actual vs Spec, one lane per extruder line over a production
 * day, drawn live from the machines' own Oracle historians.
 *
 * The whole panel is one component plus one canvas child on purpose: it is
 * meant to be dropped into an unrelated app by copying this folder, and every
 * split into "shared" pieces is one more thing the host app has to already
 * have. Its only runtime dependency is React.
 *
 * See README.md in this folder for the endpoint contract and the Oracle side.
 */

const TICK_COUNT = 9;
/** amber-400 — distinct from both verdict fills, which rules out red and green
 *  for any annotation drawn over the lane. */
const CHANGEOVER_COLOR = "#fbbf24";
/** Stop chips shown per lane before the tail collapses behind "+N shorter".
 *  A full day can hold dozens; lead with the big ones. */
const IDLE_STOPS_SHOWN = 6;
/** Older than this and the "updated Xs ago" line turns into a warning. Two
 *  missed polls, not one: a single slow response is not an outage. */
const STALE_AFTER_MS = 90_000;

/** A hover lands on either a painted sample or a black stretch. The union keeps
 *  them distinct — a gap has no sample to report, and showing a neighbouring
 *  sample's readings over downtime would misattribute them. */
type TooltipState =
  | { kind: "sample"; line: string; sample: ExtruderSample; run: ExtruderRun | null; x: number; y: number }
  | { kind: "gap"; line: string; gap: ExtruderGap; x: number; y: number };

function formatValue(value: number | null, digits = 1): string {
  return value === null || !Number.isFinite(value)
    ? "—"
    : value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function formatPct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

/** Dark time as a share of the ELAPSED window. Null on a zero-width window (a
 *  mid-edit date input, or a shift that has not started) rather than dividing
 *  by zero. */
function gapPct(totalMs: number, elapsedMs: number): number | null {
  return elapsedMs > 0 ? (totalMs / elapsedMs) * 100 : null;
}

/* ── Toolbar bits ─────────────────────────────────────────────────────── */

/** `build` is a thunk, not a prebuilt table: serialising a full production day
 *  (~8,640 samples per line) on every render of a panel that re-renders on each
 *  mousemove would be pure waste. It runs on click only. `rowCount` is passed
 *  separately so the button can disable itself — and say why — without building
 *  anything; a panel with nothing loaded must not hand the user a header-only
 *  file that looks like a silent failure. */
function CsvButton({
  filename, build, rowCount,
}: {
  filename: () => string;
  build: () => { headers: string[]; rows: (string | number | boolean | null | undefined)[][] };
  rowCount: number;
}) {
  const empty = rowCount <= 0;
  return (
    <button
      type="button"
      onClick={() => {
        const table = build();
        downloadCsv(filename(), toCsv(table.headers, table.rows));
      }}
      disabled={empty}
      title={empty ? "Nothing to export for this selection" : `Export ${rowCount.toLocaleString()} rows as CSV`}
      className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
    >
      ⭳ CSV
    </button>
  );
}

/* ── The lane canvas ──────────────────────────────────────────────────── */

/** One line's canvas: per-sample verdict fills plus changeover rules. Canvas
 *  rather than SVG or divs — a day is ~8,640 samples per line, and 8,640 DOM
 *  nodes per lane would make the hover unusable. */
function ExtruderLaneCanvas({
  line, segments, changeovers, runs, gaps, startMs, endMs, setTooltip,
}: {
  line: string;
  segments: ExtruderSegment[];
  changeovers: ExtruderChangeover[];
  runs: ExtruderRun[];
  gaps: ExtruderGap[];
  startMs: number;
  endMs: number;
  setTooltip: (v: TooltipState | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current, container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    // Backing store scaled to the device pixel ratio, then the context scaled
    // back — without this the lane is visibly blurry on every laptop screen.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Hour gridlines.
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 1;
    for (let i = 0; i < TICK_COUNT; i += 1) {
      const x = (i / (TICK_COUNT - 1)) * rect.width;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke();
    }

    // Verdict fills, in two passes ordered good-then-noGood rather than one
    // ascending-time pass. At full-day density (~108s/px, ~11 samples/px) every
    // ~10s segment is forced up to a 1px-wide fillRect, so a single pass in
    // time order lets each fill overpaint ~90% of its predecessor — a red
    // sample 10s before a green one nearly vanishes. Painting all "good" first
    // and all "noGood" second means red always wins its pixel: at day zoom, a
    // pixel containing any off-spec sample reads fully red. That is the correct
    // bias for a conformance monitor — the failure mode this trades away is a
    // pixel-wide dip reading redder than an average would show, never off-spec
    // disappearing. noData has no colour (null), so the guard below skips it in
    // both passes and a stopped machine reads as blank, never as bad output.
    for (const verdict of ["good", "noGood"] as const) {
      const color = VERDICT_COLOR[verdict];
      if (!color) continue;
      ctx.fillStyle = color;
      for (const seg of segments) {
        if (seg.verdict !== verdict) continue;
        const startX = timelineFraction(seg.startMs, startMs, endMs) * rect.width;
        const endX = timelineFraction(seg.endMs, startMs, endMs) * rect.width;
        ctx.fillRect(Math.min(startX, rect.width - 1), 0, Math.max(1, endX - startX), rect.height);
      }
    }

    // Changeover rules, drawn last so they sit above the fills.
    ctx.strokeStyle = CHANGEOVER_COLOR;
    ctx.lineWidth = 1;
    for (const co of changeovers) {
      if (co.atMs < startMs || co.atMs > endMs) continue;
      const x = timelineFraction(co.atMs, startMs, endMs) * rect.width;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke();
    }
  }, [segments, changeovers, startMs, endMs]);

  useEffect(() => {
    draw();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  const hitTest = useCallback((clientX: number): ExtruderSegment | ExtruderGap | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const hoverMs = startMs + ((clientX - rect.left) / rect.width) * (endMs - startMs);
    const tol = ((endMs - startMs) / Math.max(rect.width, 1)) * 4;
    for (let i = segments.length - 1; i >= 0; i -= 1) {
      const seg = segments[i]!;
      if ((hoverMs >= seg.startMs && hoverMs <= seg.endMs) || Math.abs(hoverMs - seg.endMs) <= tol) {
        return seg;
      }
    }
    // Only once no segment claims the pointer: a gap is what is left, and gaps
    // are checked without the `tol` slack so hovering just inside a painted run
    // cannot report downtime.
    for (const gap of gaps) {
      if (hoverMs >= gap.startMs && hoverMs <= gap.endMs) return gap;
    }
    return null;
  }, [segments, gaps, startMs, endMs]);

  return (
    <div className="flex-1">
      <div ref={containerRef} className="relative h-10 overflow-hidden rounded-md border border-zinc-700 bg-zinc-950">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair"
          aria-label={`${line} TAW actual versus spec timeline`}
          onMouseMove={(e) => {
            const hit = hitTest(e.clientX);
            if (!hit) { setTooltip(null); return; }
            setTooltip("sample" in hit
              ? { kind: "sample", line, sample: hit.sample, run: resolveRunAt(runs, hit.sample[0]), x: e.clientX, y: e.clientY }
              : { kind: "gap", line, gap: hit, x: e.clientX, y: e.clientY });
          }}
          onMouseLeave={() => setTooltip(null)}
        />
      </div>
      {/* Changeover ticks. The 1px rule on a busy red/green bar is easy to miss,
          so each one also gets a marker in its own strip below the lane. */}
      <div className="relative h-3">
        {changeovers.map((co) => {
          if (co.atMs < startMs || co.atMs > endMs) return null;
          const pct = timelineFraction(co.atMs, startMs, endMs) * 100;
          return (
            <span
              key={co.atMs}
              className="absolute top-0 -translate-x-1/2 text-[8px] leading-none"
              style={{ left: `${pct}%`, color: CHANGEOVER_COLOR }}
              title={`Changeover ${co.fromRecipe ?? "?"} → ${co.toRecipe ?? "?"} at ${formatBangkokTime(co.atMs)}`}
            >
              ▲
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ── The panel ────────────────────────────────────────────────────────── */

export default function ExtruderTimeline({
  endpoint = "/api/extruder-timeline",
  pollMs = 15_000,
  date: controlledDate,
  onDateChange,
}: {
  /** Where the timeline JSON lives. An absolute URL works too, if the panel and
   *  the API are on different origins (mind CORS on the API side). */
  endpoint?: string;
  /** Poll interval. The feed samples every ~10s, so anything under that just
   *  re-reads the same data. */
  pollMs?: number;
  /** Production date, when the host page owns it. */
  date?: string;
  onDateChange?: (d: string) => void;
} = {}) {
  // Uncontrolled fallback keeps the panel usable on its own.
  const [ownDate, setOwnDate] = useState(() => bangkokProductionDate());
  const date = controlledDate ?? ownDate;
  const setDate = onDateChange ?? setOwnDate;
  const [shift, setShift] = useState<ProductionShift>("ALL");
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  /** Per-line "show every idle stop, not just the longest few". */
  const [idleExpanded, setIdleExpanded] = useState<Record<string, boolean>>({});

  const { data: response, loading, error, lastOkMs, refresh } =
    useExtruderTimeline(date, { endpoint, pollMs });

  // Re-renders the freshness line on its own, so "updated 8s ago" keeps
  // counting between polls instead of freezing until the next response.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 5_000);
    return () => clearInterval(t);
  }, []);

  const bounds = useMemo(() => shiftBounds(date, shift), [date, shift]);

  // Everything below is derived from the shift window, so every number on
  // screen reflects the selection rather than the whole day.
  const lanes = useMemo(() => {
    if (!response) return [];
    return response.lines.map((line) => {
      const samples = filterSamplesToWindow(line.samples, bounds.startMs, bounds.endMs);
      const runs = clampRunsToWindow(line.runs, bounds.startMs, bounds.endMs);
      // Segments are built from the FULL sample list, not the filtered one: the
      // first in-window sample must measure its gap against the real previous
      // reading, which may sit just before the window.
      const segments = buildExtruderSegments(line.samples, bounds.startMs, bounds.endMs);
      // Clamped to now, so a live shift's not-yet-elapsed remainder is never
      // counted as missing time.
      const gaps = buildExtruderGaps(segments, bounds.startMs, bounds.endMs, Date.now());
      return {
        line: line.line,
        truncated: line.truncated,
        error: line.error,
        samples,
        runs,
        segments,
        changeovers: deriveChangeovers(runs),
        codes: summarizeCodes(runs, samples),
        summary: summarizeLine(samples),
        gaps,
        gapSummary: summarizeGaps(gaps),
        // Denominator for the dark-%, matching the clamp above. Measuring
        // against the full shift would understate the share every time the
        // selection includes the future.
        elapsedMs: Math.max(0, Math.min(bounds.endMs, Date.now()) - bounds.startMs),
      };
    });
  }, [response, bounds]);

  const hoveredSample = tooltip?.kind === "sample" ? tooltip : null;
  const tooltipVerdict = hoveredSample
    ? classifyTaw(hoveredSample.sample[1], hoveredSample.sample[2])
    : null;
  const tooltipDelta = hoveredSample && hoveredSample.sample[1] !== null && hoveredSample.sample[2] !== null
    ? hoveredSample.sample[1] - hoveredSample.sample[2]
    : null;

  const ageMs = lastOkMs === null ? null : Date.now() - lastOkMs;
  const stale = ageMs !== null && ageMs > STALE_AFTER_MS;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-bold text-zinc-900">🌀 Extruder — TAW Actual vs Spec</h3>
        {controlledDate === undefined && (
          <input
            type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm" aria-label="Production date"
          />
        )}
        <select
          value={shift}
          onChange={(e) => setShift(e.target.value as ProductionShift)}
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
          aria-label="Shift"
        >
          {PRODUCTION_SHIFTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          type="button" onClick={refresh} disabled={loading} aria-label="Refresh"
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          {loading ? "…" : "↻"}
        </button>
        {/* Freshness, always visible. A polling panel that silently stops
            updating is indistinguishable from a quiet machine — this is the
            only thing on screen that tells the two apart. */}
        <span
          className={`text-[11px] ${stale ? "font-semibold text-amber-700" : "text-zinc-500"}`}
          title={response?.asOfMs ? `Newest machine sample ${formatBangkokTimeSeconds(response.asOfMs)}` : undefined}
        >
          {ageMs === null ? "never updated" : `updated ${Math.round(ageMs / 1000)}s ago`}
          {response?.asOfMs ? ` · newest sample ${formatBangkokTime(response.asOfMs)}` : ""}
          {stale ? " — feed may be stalled" : ""}
        </span>
        <CsvButton
          filename={() => csvFilename(["extruder-timeline", date, shift === "ALL" ? null : shift])}
          build={() => extruderTimelineCsv(lanes)}
          rowCount={lanes.reduce((n, l) => n + l.samples.length, 0)}
        />
        <span className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm" style={{ background: VERDICT_COLOR.good! }} />
            act ≥ spec −{TAW_TOLERANCE_PCT}%
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm" style={{ background: VERDICT_COLOR.noGood! }} />
            act &lt; spec −{TAW_TOLERANCE_PCT}%
          </span>
          <span className="flex items-center gap-1">
            {/* noData paints nothing on the canvas (VERDICT_COLOR.noData is
                null) — this swatch matches the lane background so "blank" is
                the one state a user could otherwise never look up. */}
            <span className="inline-block h-2 w-3 rounded-sm border border-zinc-700 bg-zinc-950" />
            no data / stopped
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-px" style={{ background: CHANGEOVER_COLOR }} />
            changeover
          </span>
        </span>
      </div>

      {loading && !response && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">Loading…</div>
      )}
      {/* An error alongside live lanes is a stale warning, not a failure — the
          lanes below are the last good read and are still worth looking at. */}
      {error && (
        <div className={`rounded-xl border p-3 text-sm ${response
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-red-200 bg-red-50 text-red-600"}`}>
          {response
            ? `Last refresh failed (${error}) — showing the previous read.`
            : `Extruder timeline unavailable (${error}).`}
        </div>
      )}

      {/* Lanes */}
      {lanes.length > 0 && (
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
          {lanes.map((lane) => (
            <div key={lane.line} className="flex items-center gap-3">
              <div className="w-28 shrink-0">
                <div className="text-sm font-bold text-zinc-900">{lane.line}</div>
                <div className="text-[10px] text-zinc-500">
                  {lane.samples.length.toLocaleString()} samples
                </div>
                <div className="text-[10px] font-semibold text-zinc-700">
                  {/* goodPct's denominator excludes no-data samples (correct —
                      an undeclared spec should not read as 0% conformance), but
                      that alone can render a confident green % over a lane that
                      was mostly unscored. The scored/total count makes that
                      coverage visible instead of silent. */}
                  {formatPct(lane.summary.goodPct)} at spec
                  {" "}({lane.summary.scored.toLocaleString()}/{lane.summary.total.toLocaleString()} scored)
                </div>
                <div className="text-[10px] text-zinc-500">
                  act {formatValue(lane.summary.meanAct, 0)} / spec {formatValue(lane.summary.meanSpec, 0)}
                </div>
                {/* How much of the selected window the lane paints black.
                    Without this the operator can see time is missing but has no
                    way to tell whether it is ten minutes or four hours. */}
                <div
                  className="text-[10px] font-semibold text-zinc-600"
                  title={lane.gapSummary.count > 0
                    ? `${lane.gapSummary.count} stop${lane.gapSummary.count === 1 ? "" : "s"}, longest ${formatDurationLong(lane.gapSummary.longestMs)}`
                    : "Every moment of this window reported a reading"}
                >
                  ⏸ {formatDurationLong(lane.gapSummary.totalMs)} idle
                  {" "}({formatPct(gapPct(lane.gapSummary.totalMs, lane.elapsedMs))})
                </div>
              </div>
              {lane.samples.length === 0 ? (
                // Same total height as ExtruderLaneCanvas (h-10 canvas + h-3
                // changeover strip) so one line being down doesn't shift the
                // other's row out of alignment with it.
                <div className="flex-1">
                  <div className="flex h-10 items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 text-xs text-zinc-500">
                    {/* A named fault, not a shrug: "no data" and "the historian
                        is unreachable" are different problems with different
                        owners, and only the server knows which one this is. */}
                    {lane.error ?? "No extruder data for this selection."}
                  </div>
                  <div className="h-3" />
                </div>
              ) : (
                <ExtruderLaneCanvas
                  line={lane.line}
                  segments={lane.segments}
                  changeovers={lane.changeovers}
                  runs={lane.runs}
                  gaps={lane.gaps}
                  startMs={bounds.startMs}
                  endMs={bounds.endMs}
                  setTooltip={setTooltip}
                />
              )}
              {lane.truncated && (
                <span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-[10px] text-amber-800">
                  Capped — earliest samples dropped
                </span>
              )}
            </div>
          ))}
          {/* Hour axis */}
          <div className="flex items-center gap-3">
            <div className="w-28 shrink-0" />
            <div className="flex flex-1 justify-between text-[10px] text-zinc-400">
              {Array.from({ length: TICK_COUNT }, (_, i) => (
                <span key={i}>
                  {formatBangkokTime(bounds.startMs + ((bounds.endMs - bounds.startMs) * i) / (TICK_COUNT - 1))}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Idle time for the selected shift or day. The lane headers carry the
          total; this breaks it into running-vs-idle and lists the stops, which
          is the form the question is actually asked in. */}
      {lanes.length > 0 && (
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-zinc-900">
              Idle time — {PRODUCTION_SHIFTS.find((s) => s.value === shift)?.label ?? shift}
            </span>
            <span className="text-[11px] text-zinc-500">
              a stop is &gt;{Math.round(MAX_GAP_MS / 1000)}s with no reading; measured over
              elapsed time only, never the part of a shift still to come
            </span>
            <CsvButton
              filename={() => csvFilename(["extruder-idle", date, shift === "ALL" ? null : shift])}
              build={() => extruderIdleCsv(lanes.map((l) => ({ line: l.line, gaps: l.gaps })))}
              rowCount={lanes.reduce((n, l) => n + l.gaps.length, 0)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-zinc-500">
                  <th className="py-1 pr-3 font-semibold">Line</th>
                  <th className="py-1 pr-3 font-semibold">Elapsed</th>
                  <th className="py-1 pr-3 font-semibold">Running</th>
                  <th className="py-1 pr-3 font-semibold">Idle</th>
                  <th className="py-1 pr-3 font-semibold">Idle %</th>
                  <th className="py-1 pr-3 font-semibold">Stops</th>
                  <th className="py-1 pr-3 font-semibold">Longest</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {lanes.map((lane) => (
                  <tr key={lane.line} className="border-t border-zinc-100">
                    <td className="py-1 pr-3 font-bold text-zinc-800">{lane.line}</td>
                    <td className="py-1 pr-3 text-zinc-600">{formatDurationLong(lane.elapsedMs)}</td>
                    {/* Running is elapsed minus idle rather than a separate
                        measurement, so the two always add up to the window and
                        cannot drift apart on screen. */}
                    <td className="py-1 pr-3 font-semibold text-green-700">
                      {formatDurationLong(Math.max(0, lane.elapsedMs - lane.gapSummary.totalMs))}
                    </td>
                    <td className="py-1 pr-3 font-semibold text-zinc-900">
                      {formatDurationLong(lane.gapSummary.totalMs)}
                    </td>
                    <td className="py-1 pr-3 text-zinc-600">
                      {formatPct(gapPct(lane.gapSummary.totalMs, lane.elapsedMs))}
                    </td>
                    <td className="py-1 pr-3 text-zinc-600">{lane.gapSummary.count.toLocaleString()}</td>
                    <td className="py-1 pr-3 text-zinc-600">
                      {lane.gapSummary.count > 0 ? formatDurationLong(lane.gapSummary.longestMs) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* The stops themselves, longest first — "when" is the next question
              after "how much". Capped, but the cap is stated rather than
              silently truncating, and the CSV above carries every row. */}
          {lanes.map((lane) => {
            const longest = [...lane.gaps].sort((a, b) => b.durationMs - a.durationMs);
            // Per-lane rather than one shared flag: opening one line's tail is
            // not a request to also unfold the other's.
            const expanded = idleExpanded[lane.line] ?? false;
            const shown = expanded ? longest : longest.slice(0, IDLE_STOPS_SHOWN);
            const hidden = longest.length - shown.length;
            if (shown.length === 0) return null;
            return (
              <div key={lane.line} className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-2">
                <span className="w-28 shrink-0 text-xs font-bold text-zinc-700">{lane.line}</span>
                {shown.map((gap) => (
                  <span
                    key={gap.startMs}
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700"
                  >
                    {formatBangkokTime(gap.startMs)}–{formatBangkokTime(gap.endMs)}
                    <span className="ml-1 font-bold">{formatDurationLong(gap.durationMs)}</span>
                  </span>
                ))}
                {(hidden > 0 || expanded) && (
                  <button
                    type="button"
                    onClick={() => setIdleExpanded((prev) => ({ ...prev, [lane.line]: !expanded }))}
                    aria-expanded={expanded}
                    className="rounded-md px-1 text-[11px] font-semibold text-blue-700 underline decoration-dotted underline-offset-2 hover:text-blue-900"
                  >
                    {expanded ? "show fewer" : `+${hidden.toLocaleString()} shorter — show all`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Codes run in the selected window */}
      {lanes.some((l) => l.codes.length > 0) && (
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-zinc-900">Codes run</span>
            {/* Stated in the open, not just on hover: the chip's % had no
                visible definition, and the first thing anyone asked about it
                was what it compares. */}
            <span className="text-[11px] text-zinc-500">
              % = snapshots at spec ÷ snapshots scored, per code entry
            </span>
          </div>
          {lanes.map((lane) => (
            <div key={lane.line} className="flex flex-wrap items-center gap-2">
              <span className="w-28 shrink-0 text-xs font-bold text-zinc-700">{lane.line}</span>
              {lane.codes.length === 0 ? (
                <span className="text-xs text-zinc-400">—</span>
              ) : lane.codes.map((code, i) => {
                // Coverage is computed and classified in the model
                // (isCoverageMaterial); this only looks up the result, so a
                // mostly-scored chip stays uncluttered and the caveat shows
                // only when it would change how the % should be read.
                const showCoverage = isCoverageMaterial(code);
                return (
                  <span
                    key={`${code.recipeName ?? "unnamed"}-${code.startMs}-${i}`}
                    className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px]"
                  >
                    <span className="font-semibold text-zinc-800">{code.recipeName ?? "(no recipe)"}</span>
                    <span className="text-zinc-500">
                      {formatBangkokTime(code.startMs)}–{formatBangkokTime(code.endMs)} · {formatDurationShort(code.durationMs)}
                    </span>
                    <span
                      className="cursor-help rounded px-1 font-bold text-white"
                      // Spelled out by the model so the wording cannot drift
                      // from the rule that produced the number.
                      title={describeCodePct(code)}
                      style={{
                        // VERDICT_COLOR.noData is null (do-not-paint, for the
                        // canvas); here the chip must still be visible, so the
                        // null lookup falls back to grey. The verdict itself
                        // comes from the model — this line decides nothing.
                        background: VERDICT_COLOR[classifyCodePct(code.goodPct)] ?? "hsl(220, 8%, 56%)",
                      }}
                    >
                      {formatPct(code.goodPct)}
                    </span>
                    {showCoverage && (
                      <span
                        className="text-amber-700"
                        title="Most samples in this code entry weren't scored (missing act or spec) — the % above covers only the scored ones."
                      >
                        {code.scored.toLocaleString()}/{code.samples.toLocaleString()} scored
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          {tooltip.kind === "gap" ? (
            // No readings to show: the machine reported nothing here. State the
            // span and its length, which is the only honest content.
            <>
              <div className="text-zinc-300">{tooltip.line}</div>
              <div className="mt-1 font-bold text-zinc-100">
                ⏸ {formatDurationLong(tooltip.gap.durationMs)} with no data
              </div>
              <div className="tabular-nums text-zinc-400">
                {formatBangkokTimeSeconds(tooltip.gap.startMs)} → {formatBangkokTimeSeconds(tooltip.gap.endMs)}
              </div>
              <div className="mt-1 text-[10px] text-zinc-500">
                Machine stopped, or act/spec not reported
              </div>
            </>
          ) : (
            <>
              <div>{formatBangkokTimeSeconds(tooltip.sample[0])}</div>
              <div className="text-zinc-300">
                {tooltip.line}
                {tooltip.run?.recipeName ? ` · ${tooltip.run.recipeName}` : ""}
                {tooltip.run ? ` · run ${tooltip.run.runNum}` : ""}
              </div>
              <div className="mt-1 tabular-nums">TAW act&nbsp;&nbsp;{formatValue(tooltip.sample[1])}</div>
              <div className="tabular-nums">TAW spec&nbsp;{formatValue(tooltip.sample[2])}</div>
              <div className="tabular-nums">
                Δ&nbsp;&nbsp;{tooltipDelta === null ? "—" : `${tooltipDelta >= 0 ? "+" : ""}${formatValue(tooltipDelta)}`}
                {tooltipVerdict === "good" && <span className="ml-2 font-bold text-green-400">GOOD</span>}
                {tooltipVerdict === "noGood" && <span className="ml-2 font-bold text-red-400">NO GOOD</span>}
                {tooltipVerdict === "noData" && <span className="ml-2 font-bold text-zinc-400">NO DATA</span>}
              </div>
              {tooltip.sample[3] !== null && (
                // Efficiency is a RATIO (act/spec), not a percentage — prod
                // values run 0 to 2.22 with a mean near 1. Rendered with a bare
                // "%" it made a perfectly on-target sample read "1.0%". Scaled
                // here, at the only place that presents it.
                <div className="tabular-nums text-zinc-400">
                  Efficiency {formatValue(tooltip.sample[3] * 100)}%
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
