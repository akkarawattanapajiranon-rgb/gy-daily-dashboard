// The wire contract between the extruder endpoint and the panel.
//
// This is the ONE file both sides must agree on. It is duplicated verbatim on
// the server (server/buildTimeline.ts re-exports these) rather than imported
// across a package boundary, so the panel can be dropped into a frontend that
// does not share a tsconfig path with the API.

/** [tMs, act, spec, efficiency] — a tuple, not an object: a production day is
 *  ~8,640 rows PER LINE and named keys would roughly triple the payload for no
 *  benefit. tMs is a true epoch-ms instant; the server has already resolved
 *  the machine's Bangkok wall clock into it. */
export type ExtruderSample = [
  tMs: number,
  act: number | null,
  spec: number | null,
  eff: number | null,
];

export interface ExtruderRun {
  runNum: number;
  recipeName: string | null;
  recipeId: number | null;
  startMs: number;
  endMs: number;
}

export interface ExtruderLine {
  line: string;
  /** Ascending by tMs. */
  samples: ExtruderSample[];
  /** Ascending by startMs, non-overlapping. */
  runs: ExtruderRun[];
  /** The sample cap was hit and the OLDEST samples were dropped. */
  truncated: boolean;
  /** Null when this line's Oracle instance answered. A string here means the
   *  lane rendered from stale/absent data — it must still appear, as an
   *  explicit empty lane naming the fault, never vanish. */
  error: string | null;
}

export interface ExtruderTimelineResponse {
  success: true;
  /** Served from the in-process day store without touching Oracle. */
  cached: boolean;
  /** Production date, YYYY-MM-DD. */
  date: string;
  /** Epoch ms of the newest sample the store holds, across all lines. The
   *  panel shows this as "data as of" — a poll that returns the same value
   *  twice means the feed is stalled, which a spinner alone would hide. */
  asOfMs: number | null;
  window: { start: string; end: string; timezone: "Asia/Bangkok" };
  lines: ExtruderLine[];
}
