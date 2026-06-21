import type { DailyActivitySummary } from '../services/tracking/types';

export interface HoldStats {
  lastHoldSeconds: number | null;
  bestHoldSeconds: number | null;
  avgHoldSeconds: number | null;
}

export function deriveHoldStats(
  dailyActivity: DailyActivitySummary[] | undefined,
  todayLocalDate: string,
): HoldStats {
  if (!dailyActivity || dailyActivity.length === 0) {
    return { lastHoldSeconds: null, bestHoldSeconds: null, avgHoldSeconds: null };
  }

  const sorted = [...dailyActivity].sort((a, b) =>
    a.activityDate < b.activityDate ? 1 : a.activityDate > b.activityDate ? -1 : 0,
  );

  const lastEntry = sorted.find(
    (row) => row.activityDate !== todayLocalDate && row.bestHoldSeconds != null,
  );

  let max: number | null = null;
  let sum = 0;
  let count = 0;
  for (const row of sorted) {
    if (row.bestHoldSeconds == null) continue;
    if (max == null || row.bestHoldSeconds > max) max = row.bestHoldSeconds;
    if (row.activityDate !== todayLocalDate && count < 7) {
      sum += row.bestHoldSeconds;
      count += 1;
    }
  }

  return {
    lastHoldSeconds: lastEntry?.bestHoldSeconds ?? null,
    bestHoldSeconds: max,
    avgHoldSeconds: count > 0 ? sum / count : null,
  };
}
