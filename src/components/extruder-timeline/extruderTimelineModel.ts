// Pure model helpers for the Extruder TAW timeline. React-free so they are
// unit-testable without a DOM, and the single home for the act-vs-spec rule so
// colour, counts and chips can never disagree.
import type { ExtruderRun, ExtruderSample } from "./types";

export type TawVerdict = "good" | "noGood" | "noData";

/** A gap wider than this is a machine stop, not slow production. Segments do
 *  not bridge it — downtime must read as blank lane, never as off-spec output. */
export const MAX_GAP_MS = 60_000;

/** Width given to a sample with no usable predecessor, so it still paints. */
const SLIVER_MS = 1000;

/** Flat fills, deliberately not a gradient: the verdict is binary, and a
 *  gradient would imply a precision that does not exist. null = don't paint. */
export const VERDICT_COLOR: Record<TawVerdict, string | null> = {
  good: "hsl(140, 70%, 42%)",
  noGood: "hsl(0, 78%, 50%)",
  noData: null,
};

/**
 * How far below spec still counts as at spec, as a percentage of spec.
 *
 * NOT zero, which is what the original design called for. TAW act is a
 * continuous analog reading that tracks its setpoint far more tightly than
 * that rule assumed: real QUAD rows hold an 18.0 spec to within ~0.001
 * (±0.006%), oscillating either side of it every ~10s sample. Under a bare
 * `act >= spec` the SIGN of that jitter decided the colour, so roughly half of
 * a perfectly on-target run painted red and the lane header reported a
 * meaningless "44% at spec". 11,120 of QUAD's 41,571 stored samples sit within
 * 0.1% of spec — that cluster is measurement noise, not conformance data.
 *
 * 0.5% is wide enough to swallow the jitter band and narrow enough to keep
 * real signal: only about half of QUAD's samples fall within 5% of spec, so
 * genuine off-spec output (startup, transients, stops) still reads red.
 *
 * Relative rather than absolute because taw_spec varies by product — 18 on
 * WA8X-TOOS, ~1250 on others — and a fixed tolerance would be far too coarse
 * at one end and invisible at the other.
 */
export const TAW_TOLERANCE_PCT = 0.5;

/**
 * The rule, in one place: actual at or above spec — less the tolerance band
 * above — is good, below it is no good. A missing actual, a missing spec, or a
 * spec of zero or less is no data — a zero spec means the recipe never
 * declared one, and painting that green would report conformance that was
 * never measured.
 */
export function classifyTaw(act: number | null, spec: number | null): TawVerdict {
  if (act === null || spec === null) return "noData";
  if (!Number.isFinite(act) || !Number.isFinite(spec)) return "noData";
  if (spec <= 0) return "noData";
  // Boundary inclusive, matching classifyCodePct: exactly on the floor passes.
  return act >= spec * (1 - TAW_TOLERANCE_PCT / 100) ? "good" : "noGood";
}

/** Not 100: at a ~10s sample cadence, a single off-spec sample inside a
 *  multi-hour code entry would otherwise turn the whole chip red, making the
 *  colour meaningless — nearly every chip would be red regardless of how the
 *  run actually performed. 95 leaves room for that kind of one-off noise
 *  while still flagging runs that were genuinely off spec. */
export const CODE_GOOD_PCT_THRESHOLD = 95;

/** Classifies a code entry's scored percentage into the same verdict space as
 *  classifyTaw, so the component can look up a colour instead of deciding
 *  one. The boundary is inclusive: exactly the threshold is good. */
export function classifyCodePct(goodPct: number | null): TawVerdict {
  if (goodPct === null) return "noData";
  return goodPct >= CODE_GOOD_PCT_THRESHOLD ? "good" : "noGood";
}

/**
 * Spells out what a code chip's percentage actually compares, for its
 * tooltip. The number is a share of SNAPSHOTS, not of time or output — every
 * ~10s sample counts equally regardless of how much rubber it represents —
 * and its denominator excludes unscored samples. Neither fact is guessable
 * from a bare "43%", and both change how the figure should be read.
 */
export function describeCodePct(entry: CodeEntry): string {
  if (entry.goodPct === null) {
    return entry.samples > 0
      ? `None of this entry's ${entry.samples.toLocaleString()} snapshots reported both an act and a spec, so there is nothing to score.`
      : "No snapshots fall inside this entry.";
  }
  const unscored = entry.samples - entry.scored;
  return [
    `${entry.good.toLocaleString()} of ${entry.scored.toLocaleString()} scored snapshots were at spec`,
    `(act ≥ spec − ${TAW_TOLERANCE_PCT}%).`,
    `Counts ~10s snapshots, not time or output.`,
    unscored > 0
      ? `${unscored.toLocaleString()} of ${entry.samples.toLocaleString()} snapshots are excluded — no act or spec reported.`
      : `All ${entry.samples.toLocaleString()} snapshots in this entry were scored.`,
    `Green at ${CODE_GOOD_PCT_THRESHOLD}% or above.`,
  ].join(" ");
}

/** Below this scored-coverage percentage, a no-data share is "material" and
 *  the chip should say so — otherwise a chip built from 4 scored samples out
 *  of 400 renders a confident, misleading green 100%. 90 is deliberately
 *  looser than CODE_GOOD_PCT_THRESHOLD: coverage and conformance answer
 *  different questions, and a chip that is mostly scored (>=90%) stays
 *  uncluttered rather than showing a coverage caveat on every single chip. */
export const CODE_COVERAGE_THRESHOLD = 90;

export interface ExtruderSegment {
  startMs: number;
  endMs: number;
  verdict: TawVerdict;
  sample: ExtruderSample;
}

/**
 * One drawable segment per sample, reaching back over the interval it closes
 * and clamped to the window. Samples outside the window are skipped, but the
 * predecessor cursor still advances through them so the first in-window sample
 * measures its gap against the real previous reading.
 */
export function buildExtruderSegments(
  samples: ExtruderSample[],
  startMs: number,
  endMs: number,
): ExtruderSegment[] {
  const out: ExtruderSegment[] = [];
  let prevMs: number | null = null;

  for (const sample of samples) {
    const tMs = sample[0];
    if (!Number.isFinite(tMs)) continue;

    const gapMs = prevMs === null ? null : tMs - prevMs;
    prevMs = tMs;

    if (tMs < startMs || tMs >= endMs) continue;

    const widthMs = gapMs !== null && gapMs > 0 && gapMs <= MAX_GAP_MS ? gapMs : SLIVER_MS;
    out.push({
      startMs: Math.max(startMs, tMs - widthMs),
      endMs: Math.min(endMs, tMs),
      verdict: classifyTaw(sample[1], sample[2]),
      sample,
    });
  }
  return out;
}

/** A stretch of lane the timeline leaves black. */
export interface ExtruderGap {
  startMs: number;
  endMs: number;
  durationMs: number;
}

/** Seams shorter than this are adjacency artefacts between neighbouring
 *  segments, not stops. Listing them would bury the real downtime in noise. */
export const MIN_GAP_MS = 1000;

/**
 * Every stretch of the window the lane paints black, with its duration.
 *
 * Computed as the complement of the PAINTED segments — good and noGood only.
 * `noData` is deliberately treated as a gap even though a segment covers it:
 * VERDICT_COLOR.noData is null, so an unscored sample leaves the lane dark and
 * the operator sees black. Reporting only sample-less stops would under-count
 * the black actually on screen, which is the whole question being asked.
 *
 * Leading and trailing dark time count too: on a live day the lane is black
 * from the last sample to the window end, and that is real unreported time.
 */
export function buildExtruderGaps(
  segments: ExtruderSegment[],
  startMs: number,
  endMs: number,
  asOfMs = Number.POSITIVE_INFINITY,
): ExtruderGap[] {
  // Never count the future as missing time. On a live shift the lane is black
  // from the newest sample to the right-hand edge, and on the day in question
  // that was over five hours of a shift that had not happened yet — reported
  // as downtime it would dwarf the real 14-minute stop and read as a crisis.
  const horizon = Math.min(endMs, asOfMs);
  if (horizon <= startMs) return [];

  const painted = segments
    .filter((seg) => seg.verdict !== "noData")
    .map((seg) => ({ startMs: Math.max(seg.startMs, startMs), endMs: Math.min(seg.endMs, horizon) }))
    .filter((seg) => seg.endMs > seg.startMs)
    .sort((a, b) => a.startMs - b.startMs);

  const out: ExtruderGap[] = [];
  const push = (from: number, to: number) => {
    const durationMs = to - from;
    if (durationMs >= MIN_GAP_MS) out.push({ startMs: from, endMs: to, durationMs });
  };

  // Sweep a cursor across the window; anything the cursor has to jump over is
  // a gap. Overlapping segments just advance it, so they cannot invent one.
  let cursor = startMs;
  for (const seg of painted) {
    if (seg.startMs > cursor) push(cursor, seg.startMs);
    cursor = Math.max(cursor, seg.endMs);
  }
  push(cursor, horizon);
  return out;
}

export interface GapSummary {
  count: number;
  totalMs: number;
  longestMs: number;
}

/** Zeroes rather than nulls for an all-covered lane: "0m dark" is a real,
 *  reportable answer, not a missing measurement. */
export function summarizeGaps(gaps: ExtruderGap[]): GapSummary {
  let totalMs = 0;
  let longestMs = 0;
  for (const gap of gaps) {
    totalMs += gap.durationMs;
    if (gap.durationMs > longestMs) longestMs = gap.durationMs;
  }
  return { count: gaps.length, totalMs, longestMs };
}

/** "3h 14m" — the hours-and-minutes form the downtime question is asked in.
 *  A stop under a minute renders "<1m", never "0m": rounding a real stop to
 *  zero would read as "nothing was lost". Only a true zero is "0m". */
export function formatDurationLong(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "0m";
  const totalMinutes = Math.floor(durationMs / 60000);
  if (totalMinutes === 0) return "<1m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

/** Half-open [startMs, endMs): a sample at exactly 15:00:00 belongs to S2. */
export function filterSamplesToWindow(
  samples: ExtruderSample[],
  startMs: number,
  endMs: number,
): ExtruderSample[] {
  return samples.filter((s) => Number.isFinite(s[0]) && s[0] >= startMs && s[0] < endMs);
}

/** Runs trimmed to the window; runs entirely outside it are dropped. */
export function clampRunsToWindow(
  runs: ExtruderRun[],
  startMs: number,
  endMs: number,
): ExtruderRun[] {
  const out: ExtruderRun[] = [];
  for (const run of runs) {
    // `endMs <= startMs` (not `<`): a run that ends exactly at the window edge
    // contributes nothing and would otherwise survive as a zero-width run,
    // producing a phantom code chip and a changeover on the boundary.
    if (run.endMs <= startMs || run.startMs >= endMs) continue;
    out.push({
      ...run,
      startMs: Math.max(run.startMs, startMs),
      endMs: Math.min(run.endMs, endMs),
    });
  }
  return out;
}

export interface ExtruderChangeover {
  atMs: number;
  fromRecipe: string | null;
  toRecipe: string | null;
}

/** One changeover per consecutive recipe change — the established extruder
 *  convention. Same recipe back-to-back yields none; A,B,A yields two. */
export function deriveChangeovers(runs: ExtruderRun[]): ExtruderChangeover[] {
  const out: ExtruderChangeover[] = [];
  for (let i = 1; i < runs.length; i += 1) {
    const prev = runs[i - 1]!;
    const curr = runs[i]!;
    if (prev.recipeName === curr.recipeName) continue;
    out.push({ atMs: curr.startMs, fromRecipe: prev.recipeName, toRecipe: curr.recipeName });
  }
  return out;
}

export interface CodeEntry {
  recipeName: string | null;
  startMs: number;
  endMs: number;
  durationMs: number;
  samples: number;
  good: number;
  /** Samples with a verdict — i.e. not noData. The denominator behind
   *  goodPct, and the numerator behind codeCoveragePct. Surfaced so the UI
   *  can show how much of a chip's samples were actually scored, rather than
   *  leaving a low-coverage chip's confident-looking percentage unexplained. */
  scored: number;
  goodPct: number | null;
}

/** Share of an entry's samples that carried a verdict, as a percentage —
 *  null only when the entry has no samples at all (avoids a divide-by-zero,
 *  distinct from 0% coverage when samples exist but none were scored). */
export function codeCoveragePct(entry: CodeEntry): number | null {
  return entry.samples > 0 ? (entry.scored / entry.samples) * 100 : null;
}

/** True when a code entry's scored coverage is low enough that showing the
 *  bare good-% alone would overstate confidence. Strictly below
 *  CODE_COVERAGE_THRESHOLD; a null coverage (no samples at all) is not
 *  material — there is no percentage to caveat in the first place. */
export function isCoverageMaterial(entry: CodeEntry): boolean {
  const coverage = codeCoveragePct(entry);
  return coverage !== null && coverage < CODE_COVERAGE_THRESHOLD;
}

/** "All codes run that day": consecutive runs of one recipe merged into a
 *  single entry, each scored over the samples inside its span. */
export function summarizeCodes(runs: ExtruderRun[], samples: ExtruderSample[]): CodeEntry[] {
  const merged: { recipeName: string | null; startMs: number; endMs: number }[] = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && last.recipeName === run.recipeName) {
      last.endMs = Math.max(last.endMs, run.endMs);
    } else {
      merged.push({ recipeName: run.recipeName, startMs: run.startMs, endMs: run.endMs });
    }
  }

  const totals = merged.map(() => ({ total: 0, good: 0, scored: 0 }));

  // Single-assignment: each sample belongs to at most one entry, resolved the
  // same way resolveRunAt resolves a run — binary search for the last entry
  // whose startMs <= t, then confirm t <= that entry's endMs. Two entries can
  // share a boundary timestamp (m.endMs is Math.max(...) across merged runs,
  // not necessarily any sample's own timestamp), so a naive inclusive range
  // on both ends would double-count a sample sitting exactly on that
  // boundary. This assigns it to exactly one — the entry it starts in,
  // mirroring resolveRunAt's start-inclusive convention — or to none if it
  // falls in a hole.
  for (const sample of samples) {
    const tMs = sample[0];
    let lo = 0;
    let hi = merged.length - 1;
    let bestIdx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (tMs < merged[mid]!.startMs) {
        hi = mid - 1;
      } else {
        bestIdx = mid;
        lo = mid + 1;
      }
    }
    if (bestIdx === -1 || tMs > merged[bestIdx]!.endMs) continue;

    const bucket = totals[bestIdx]!;
    bucket.total += 1;
    const verdict = classifyTaw(sample[1], sample[2]);
    if (verdict === "noData") continue;
    bucket.scored += 1;
    if (verdict === "good") bucket.good += 1;
  }

  return merged.map((m, i) => {
    const { total, good, scored } = totals[i]!;
    return {
      recipeName: m.recipeName,
      startMs: m.startMs,
      endMs: m.endMs,
      durationMs: Math.max(0, m.endMs - m.startMs),
      samples: total,
      good,
      scored,
      goodPct: scored > 0 ? (good / scored) * 100 : null,
    };
  });
}

export interface LineSummary {
  total: number;
  good: number;
  noGood: number;
  noData: number;
  /** good + noGood — the denominator behind goodPct, surfaced directly so
   *  the lane header can show "X% at spec (scored/total scored)" instead of
   *  a bare percentage that hides how many samples were actually judged. */
  scored: number;
  goodPct: number | null;
  meanAct: number | null;
  meanSpec: number | null;
}

/** goodPct excludes no-data samples from its denominator: a day the machine
 *  never declared a spec should not read as 0% conformance. */
export function summarizeLine(samples: ExtruderSample[]): LineSummary {
  let good = 0;
  let noGood = 0;
  let noData = 0;
  let actSum = 0;
  let actN = 0;
  let specSum = 0;
  let specN = 0;

  for (const sample of samples) {
    const verdict = classifyTaw(sample[1], sample[2]);
    if (verdict === "good") good += 1;
    else if (verdict === "noGood") noGood += 1;
    else noData += 1;

    const act = sample[1];
    if (act !== null && Number.isFinite(act)) { actSum += act; actN += 1; }
    const spec = sample[2];
    if (spec !== null && Number.isFinite(spec)) { specSum += spec; specN += 1; }
  }

  const scored = good + noGood;
  return {
    total: samples.length,
    good,
    noGood,
    noData,
    scored,
    goodPct: scored > 0 ? (good / scored) * 100 : null,
    meanAct: actN > 0 ? actSum / actN : null,
    meanSpec: specN > 0 ? specSum / specN : null,
  };
}

/** The run containing tMs, or null if tMs falls in a hole between runs.
 *  Binary search — the tooltip calls this on every mouse move. */
export function resolveRunAt(runs: ExtruderRun[], tMs: number): ExtruderRun | null {
  let lo = 0;
  let hi = runs.length - 1;
  let best: ExtruderRun | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const run = runs[mid]!;
    if (tMs < run.startMs) {
      hi = mid - 1;
    } else {
      best = run;               // last run whose start is at or before tMs
      lo = mid + 1;
    }
  }
  return best !== null && tMs <= best.endMs ? best : null;
}

export function formatDurationShort(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "0m";
  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h${minutes}m`;
}
