import React, { useEffect, useState, useMemo } from 'react';

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const BANGKOK = '+07:00';
function atHour(date, hour) {
  return Date.parse(`${date}T${String(hour).padStart(2,'0')}:00:00${BANGKOK}`);
}
function shiftBoundsAll(date) {
  const next = new Date(Date.parse(`${date}T00:00:00Z`) + 86400000);
  const p = n => String(n).padStart(2, '0');
  const nextStr = `${next.getUTCFullYear()}-${p(next.getUTCMonth()+1)}-${p(next.getUTCDate())}`;
  return { startMs: atHour(date, 7), endMs: atHour(nextStr, 7) };
}
function formatBKK(ms) {
  const d = new Date(ms + BANGKOK_OFFSET_MS);
  return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
}
function formatDur(ms) {
  if (!ms || ms <= 0) return '0m';
  const m = Math.floor(ms / 60000);
  if (m === 0) return '<1m';
  const h = Math.floor(m / 60), mm = m % 60;
  if (h === 0) return `${mm}m`;
  return mm === 0 ? `${h}h` : `${h}h ${mm}m`;
}

const MAX_GAP_MS = 60000, MIN_GAP_MS = 1000, SLIVER_MS = 1000;

function buildSegments(samples, startMs, endMs) {
  const out = []; let prevMs = null;
  for (const s of samples) {
    const tMs = s[0];
    if (!Number.isFinite(tMs)) continue;
    const gapMs = prevMs === null ? null : tMs - prevMs;
    prevMs = tMs;
    if (tMs < startMs || tMs >= endMs) continue;
    const act = s[1], spec = s[2];
    let verdict = 'noData';
    if (act != null && spec != null && Number.isFinite(act) && Number.isFinite(spec) && spec > 0)
      verdict = act >= spec * 0.995 ? 'good' : 'noGood';
    const widthMs = gapMs !== null && gapMs > 0 && gapMs <= MAX_GAP_MS ? gapMs : SLIVER_MS;
    out.push({ startMs: Math.max(startMs, tMs - widthMs), endMs: Math.min(endMs, tMs), verdict });
  }
  return out;
}

function buildGaps(segments, startMs, endMs, asOfMs) {
  const horizon = Math.min(endMs, asOfMs ?? endMs);
  if (horizon <= startMs) return [];
  const painted = segments
    .filter(s => s.verdict !== 'noData')
    .map(s => ({ startMs: Math.max(s.startMs, startMs), endMs: Math.min(s.endMs, horizon) }))
    .filter(s => s.endMs > s.startMs)
    .sort((a, b) => a.startMs - b.startMs);
  const out = []; let cursor = startMs;
  for (const seg of painted) {
    if (seg.startMs > cursor) {
      const d = seg.startMs - cursor;
      if (d >= MIN_GAP_MS) out.push({ startMs: cursor, endMs: seg.startMs, durationMs: d });
    }
    cursor = Math.max(cursor, seg.endMs);
  }
  const tail = horizon - cursor;
  if (tail >= MIN_GAP_MS) out.push({ startMs: cursor, endMs: horizon, durationMs: tail });
  return out;
}

export default function ExtruderIdleSection({ date, lineName, accentColor = 'indigo' }) {
  const [rawLines, setRawLines] = useState(null);
  const [asOfMs, setAsOfMs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setLoading(true); setRawLines(null); setError(null);
    fetch(`/api/extruder-timeline?date=${date}`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(json => {
        if (cancelled) return;
        setRawLines(json.lines || []);
        setAsOfMs(json.asOfMs ?? null);
        setLoading(false);
      })
      .catch(e => { if (cancelled) return; setError(e.message); setLoading(false); });
    return () => { cancelled = true; };
  }, [date]);

  const { gaps, totalIdleMs, elapsedMs } = useMemo(() => {
    if (!rawLines) return { gaps: [], totalIdleMs: 0, elapsedMs: 0 };
    const lane = rawLines.find(l => l.line && l.line.toUpperCase() === lineName.toUpperCase());
    if (!lane || !lane.samples || !lane.samples.length) return { gaps: [], totalIdleMs: 0, elapsedMs: 0 };
    const { startMs, endMs } = shiftBoundsAll(date);
    const horizon = Math.min(endMs, asOfMs != null ? asOfMs : endMs);
    const elapsed = Math.max(0, horizon - startMs);
    const segs = buildSegments(lane.samples, startMs, endMs);
    const g = buildGaps(segs, startMs, endMs, asOfMs);
    return { gaps: g, totalIdleMs: g.reduce((s, x) => s + x.durationMs, 0), elapsedMs: elapsed };
  }, [rawLines, asOfMs, date, lineName]);

  const sorted = useMemo(() => [...gaps].sort((a, b) => b.durationMs - a.durationMs), [gaps]);
  const idlePct = elapsedMs > 0 ? Math.round((totalIdleMs / elapsedMs) * 100) : null;
  const runMs = Math.max(0, elapsedMs - totalIdleMs);
  const borderCls = accentColor === 'emerald'
    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
    : 'bg-indigo-50 border-indigo-100 text-indigo-800';

  if (loading) return React.createElement('div', { className: 'mt-3 rounded-lg border p-3 text-xs text-slate-500 flex items-center gap-2 ' + borderCls },
    React.createElement('div', { className: 'animate-spin rounded-full h-3 w-3 border-b-2 border-current' }),
    'กำลังโหลด Extruder data...');
  if (error) return React.createElement('div', { className: 'mt-3 rounded-lg border p-3 text-xs text-red-500 ' + borderCls }, '⚠ ' + error);
  if (!rawLines) return null;
  const lane2 = rawLines.find(l => l.line && l.line.toUpperCase() === lineName.toUpperCase());
  if (!lane2 || !lane2.samples || !lane2.samples.length)
    return React.createElement('div', { className: 'mt-3 rounded-lg border p-3 text-xs text-slate-400 ' + borderCls }, '⏸ ไม่มีข้อมูล sensor ' + lineName);

  return (
    <div className={'mt-3 rounded-lg border p-3 space-y-2 ' + borderCls}>
      {/* Summary row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <span className="inline-block h-3 w-3 rounded-sm bg-zinc-900 border border-zinc-600" />
          ⏸ No Data / Stopped Periods
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="text-slate-500">Elapsed: <span className="font-semibold text-slate-700">{formatDur(elapsedMs)}</span></span>
          <span className="text-green-700 font-semibold">▶ Running: {formatDur(runMs)}</span>
          <span className="text-zinc-800 font-bold">
            ⏸ Idle: {formatDur(totalIdleMs)}
            {idlePct !== null && <span className="ml-1 text-slate-400 font-normal">({idlePct}%)</span>}
          </span>
          <span className="text-slate-400">{sorted.length} stop{sorted.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      {/* Stop chips */}
      {sorted.length === 0 ? (
        <div className="text-[11px] text-green-700 font-semibold">✅ ไม่มีช่วง No Data — เครื่องรันต่อเนื่อง</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {sorted.map(gap => (
            <span key={gap.startMs}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 text-[11px] text-zinc-100"
              title={formatBKK(gap.startMs) + ' – ' + formatBKK(gap.endMs)}>
              <span className="inline-block h-2 w-2 rounded-sm bg-zinc-600" />
              <span className="font-mono">{formatBKK(gap.startMs)}&ndash;{formatBKK(gap.endMs)}</span>
              <span className="font-bold text-amber-400">{formatDur(gap.durationMs)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
