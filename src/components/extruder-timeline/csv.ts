// CSV export for the extruder panel — a trimmed, self-contained version of the
// OEE app's shared csvExport + timelineCsv pair.
//
// Excel is the plant's second UI. Two rules below exist only for it and both
// look like superstition until you open a file without them:
//   * the UTF-8 BOM, without which Excel renders Thai text as mojibake;
//   * the leading apostrophe on values starting = + - @, without which Excel
//     interprets a cell as a FORMULA (CSV injection, and mangled data).
import { classifyTaw, resolveRunAt } from "./extruderTimelineModel";
import { formatBangkokDateTime } from "./bangkok";
import type { ExtruderRun, ExtruderSample } from "./types";
import type { ExtruderGap } from "./extruderTimelineModel";

export type CsvCell = string | number | boolean | null | undefined;
export interface CsvTable { headers: string[]; rows: CsvCell[][] }

const CSV_BOM = "﻿";

export function csvCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Formula injection guard — see the file header.
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  // CRLF, not LF: Excel on Windows is the consumer.
  return CSV_BOM + [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}

/** "extruder-timeline_2026-09-04_NIGHT.csv" — null parts are dropped, so a
 *  filename never carries a stray "null" or a double underscore. */
export function csvFilename(parts: (string | null | undefined)[]): string {
  return `${parts.filter(Boolean).join("_")}.csv`;
}

export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const TIMELINE_HEADERS = [
  "line", "timestamp", "run", "recipe", "taw act", "taw spec", "delta", "efficiency %", "verdict",
];
const IDLE_HEADERS = ["line", "start", "end", "duration s", "duration min"];

export interface ExtruderCsvLane {
  line: string;
  samples: ExtruderSample[];
  runs: ExtruderRun[];
}

export function extruderTimelineCsv(lanes: ExtruderCsvLane[]): CsvTable {
  const rows: CsvCell[][] = [];
  for (const lane of lanes) {
    for (const sample of lane.samples) {
      const [tMs, act, spec, eff] = sample;
      // Runs are clamped to the shift window, so a sample can legitimately
      // fall in a hole between them; it still exports, with blank run fields.
      const run = resolveRunAt(lane.runs, tMs);
      rows.push([
        lane.line,
        formatBangkokDateTime(tMs),
        run ? run.runNum : null,
        run ? run.recipeName : null,
        act,
        spec,
        act !== null && spec !== null ? act - spec : null,
        // Stored as a RATIO (act/spec), not a percentage — scaled here so the
        // column matches its "%" header and the tooltip.
        eff !== null ? eff * 100 : null,
        classifyTaw(act, spec),
      ]);
    }
  }
  return { headers: TIMELINE_HEADERS, rows };
}

export function extruderIdleCsv(lanes: { line: string; gaps: ExtruderGap[] }[]): CsvTable {
  const rows: CsvCell[][] = [];
  for (const lane of lanes) {
    for (const gap of lane.gaps) {
      rows.push([
        lane.line,
        formatBangkokDateTime(gap.startMs),
        formatBangkokDateTime(gap.endMs),
        Math.round(gap.durationMs / 1000),
        Math.round(gap.durationMs / 60000),
      ]);
    }
  }
  return { headers: IDLE_HEADERS, rows };
}
