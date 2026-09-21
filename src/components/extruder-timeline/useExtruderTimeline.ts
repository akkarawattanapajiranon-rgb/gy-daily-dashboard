"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExtruderTimelineResponse } from "./types";

/**
 * Fetch + poll the extruder timeline endpoint.
 *
 * This hook is the whole of "realtime" on the client: there is no socket and
 * no subscription, just a poll. The server already holds the day in memory and
 * only asks Oracle for the delta since its last read, so a poll is cheap and
 * an extra viewer costs nothing beyond the response body.
 *
 * Three things here are not optional:
 *
 *  1. `seq` — a monotonically increasing request id. Polling plus a date change
 *     means overlapping in-flight requests, and without this a slow response
 *     for YESTERDAY can land after a fast one for today and repaint the lanes
 *     with the wrong day. Only the newest request is allowed to set state.
 *
 *  2. A failed poll does NOT clear `data`. The lanes keep showing the last good
 *     read with a stale badge, because a blank screen is a worse answer than a
 *     slightly old one on a wall display nobody is standing next to.
 *
 *  3. Polling pauses while the tab is hidden and fires once immediately on
 *     return. A kiosk left open for a week would otherwise burn a request every
 *     15s against a page no one can see, and — worse — come back showing
 *     whatever was on screen when it was hidden until the next tick.
 */
export interface UseExtruderTimeline {
  data: ExtruderTimelineResponse | null;
  /** A request is in flight. Distinct from `data === null`: a poll refreshing
   *  a populated panel must not blank it or show a loading card. */
  loading: boolean;
  /** The last error, cleared by the next success. `data` may be non-null
   *  alongside it — that is the stale-but-showing state. */
  error: string | null;
  /** Epoch ms of the last SUCCESSFUL read, for the "updated Xs ago" line. */
  lastOkMs: number | null;
  refresh: () => void;
}

export function useExtruderTimeline(
  date: string,
  {
    endpoint = "/api/extruder-timeline",
    pollMs = 15_000,
    enabled = true,
  }: { endpoint?: string; pollMs?: number; enabled?: boolean } = {},
): UseExtruderTimeline {
  const [data, setData] = useState<ExtruderTimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOkMs, setLastOkMs] = useState<number | null>(null);
  const seq = useRef(0);

  const load = useCallback(async (target: string, forceRefresh = false) => {
    const s = ++seq.current;
    setLoading(true);
    try {
      let json: ExtruderTimelineResponse | null = null;
      let fetchError: Error | null = null;

      const isLocalhost = typeof window !== "undefined" && 
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

      const todayStr = bangkokProductionDate();
      const isPastDate = target < todayStr;

      // 1. For past dates: load pre-built JSON immediately (0 latency, 5ms instant load)
      if (isPastDate && !forceRefresh) {
        try {
          const staticRes = await fetch(`/data/extruder/${encodeURIComponent(target)}.json`, {
            cache: "no-store",
            headers: { accept: "application/json" }
          });
          const contentType = staticRes.headers.get("content-type");
          if (staticRes.ok && (!contentType || contentType.includes("application/json"))) {
            const staticData = await staticRes.json();
            if (staticData && (staticData.success !== false || staticData.lines)) {
              json = staticData as ExtruderTimelineResponse;
            }
          }
        } catch (e) {
          // Fall through to API
        }
      }

      // 2. Query live Express API / Vercel API if needed (for today or if static not found)
      if (!json) {
        try {
          const queryParams = new URLSearchParams({ date: target });
          if (forceRefresh) queryParams.set("refresh", "true");
          const controller = new AbortController();
          const timeoutMs = isLocalhost ? 10000 : 6000;
          const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
          const res = await fetch(`${endpoint}?${queryParams.toString()}`, {
            cache: "no-store",
            headers: { accept: "application/json" },
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          const contentType = res.headers.get("content-type");
          if (res.ok && contentType && contentType.includes("application/json")) {
            const resData = await res.json();
            if (resData && (resData.success !== false || resData.lines)) {
              json = resData as ExtruderTimelineResponse;
            }
          } else {
            fetchError = new Error(`HTTP ${res.status}`);
          }
        } catch (e) {
          fetchError = e instanceof Error ? e : new Error("API network error");
        }
      }

      // 3. Last fallback: try static JSON with cache buster if API failed
      if (!json) {
        try {
          const cacheBuster = forceRefresh ? `?_t=${Date.now()}` : "";
          const staticRes = await fetch(`/data/extruder/${encodeURIComponent(target)}.json${cacheBuster}`, {
            cache: "no-store",
            headers: { accept: "application/json" }
          });
          const contentType = staticRes.headers.get("content-type");
          if (staticRes.ok && (!contentType || contentType.includes("application/json"))) {
            const staticData = await staticRes.json();
            if (staticData && (staticData.success !== false || staticData.lines)) {
              json = staticData as ExtruderTimelineResponse;
            }
          }
        } catch (staticErr) {
          console.warn("[Extruder] Static fallback fetch failed:", staticErr);
        }
      }

      if (!json) {
        throw new Error(`ไม่พบข้อมูล Extruder Timeline สำหรับวันที่ ${target} (หรือกำลังประมวลผล)`);
      }

      if (s !== seq.current) return;          // a newer request already won
      setData(json);
      setError(null);
      setLastOkMs(Date.now());
    } catch (err) {
      // Deliberately NOT setData(null) — see the header.
      const errMsg = err instanceof Error ? err.message : "request failed";
      if (s === seq.current) {
        // Clean up internal abort text for display
        const cleanMsg = errMsg.includes("aborted") 
          ? `กำลังโหลดหรือเชื่อมต่อฐานข้อมูลสำหรับวันที่ ${target}` 
          : errMsg;
        setError(cleanMsg);
      }
    } finally {
      if (s === seq.current) setLoading(false);
    }
  }, [endpoint]);

  // A date change is a different question, not a refresh: drop the previous
  // day's lanes rather than leaving them on screen under the new date label.
  useEffect(() => { setData(null); setError(null); }, [date]);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => { void load(date); };
    const start = () => {
      if (timer !== null) return;
      timer = setInterval(tick, pollMs);
    };
    const stop = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") { stop(); return; }
      tick();     // catch up immediately, before waiting a full interval
      start();
    };

    tick();
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [date, pollMs, enabled, load]);

  return { data, loading, error, lastOkMs, refresh: useCallback(() => void load(date, true), [date, load]) };
}
