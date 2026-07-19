export interface DailyActiveClock {
  start: (nowMs: number) => void;
  pause: (nowMs: number) => void;
  resume: (nowMs: number) => void;
  reset: () => void;
  getElapsedMs: (nowMs: number) => number;
}

function validTimestamp(timestampMs: number): boolean {
  return Number.isFinite(timestampMs);
}

/** Tracks active exercise time while excluding every paused interval. */
export function createDailyActiveClock(): DailyActiveClock {
  let accumulatedMs = 0;
  let runningSinceMs: number | null = null;
  let started = false;

  const getElapsedMs = (nowMs: number): number => {
    if (!started || runningSinceMs == null || !validTimestamp(nowMs)) {
      return accumulatedMs;
    }

    return accumulatedMs + Math.max(0, nowMs - runningSinceMs);
  };

  return {
    start(nowMs) {
      accumulatedMs = 0;
      started = validTimestamp(nowMs);
      runningSinceMs = started ? nowMs : null;
    },
    pause(nowMs) {
      if (!started || runningSinceMs == null || !validTimestamp(nowMs)) return;
      accumulatedMs = getElapsedMs(nowMs);
      runningSinceMs = null;
    },
    resume(nowMs) {
      if (!started || runningSinceMs != null || !validTimestamp(nowMs)) return;
      runningSinceMs = nowMs;
    },
    reset() {
      accumulatedMs = 0;
      runningSinceMs = null;
      started = false;
    },
    getElapsedMs,
  };
}
