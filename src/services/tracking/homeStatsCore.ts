import type { StressHistoryEntry } from '../../lib/heartRate/stress';
import type { TodayHeartRateSummary } from './types';

type StressHistorySourceEntry = { stress: number | null; localDate: string };

export function buildStressHistory(
  heartRateHistory: StressHistorySourceEntry[],
): StressHistoryEntry[] {
  return heartRateHistory.map((s) => ({
    stress: s.stress ?? null,
    localDate: s.localDate,
  }));
}
/**
 * Aggregated HRV stats. RMSSD/SDNN avg and max are computed across the user's
 * "full" heart-rate capture history (90s recordings); the absolute RMSSD/SDNN
 * values come from the most recent full capture. Sources: homeStatsService +
 * heartRateStatsService.
 */
export interface HomeHrvStats {
  rmssd: number | null;
  sdnn: number | null;
  pnn50: number | null;
  hrDrop: number | null;
  stress: number | null;
  beatCount: number | null;
  avgRmssd: number | null;
  avgSdnn: number | null;
  maxRmssd: number | null;
  maxSdnn: number | null;
}

type HrvHistoryEntry = { rmssd: number | null; sdnn: number | null };

const MIN_HRV_AGGREGATE_POINTS = 4;

function aggregateField(
  history: HrvHistoryEntry[],
  field: 'rmssd' | 'sdnn',
): { avg: number | null; max: number | null } {
  let sum = 0;
  let count = 0;
  let max = -Infinity;
  for (const entry of history) {
    const v = entry[field];
    if (v != null && Number.isFinite(v)) {
      sum += v;
      count += 1;
      if (v > max) max = v;
    }
  }
  if (count < MIN_HRV_AGGREGATE_POINTS) {
    return { avg: null, max: null };
  }
  return { avg: sum / count, max };
}

/**
 * Build aggregated HRV stats. Only "full" 90s heart-rate captures contribute —
 * breath holds and quick captures never feed HRV.
 */
export function buildHrvStats(
  latest: TodayHeartRateSummary | null,
  fullHistory: TodayHeartRateSummary[],
): HomeHrvStats {
  const rmssdAgg = aggregateField(fullHistory, 'rmssd');
  const sdnnAgg = aggregateField(fullHistory, 'sdnn');
  return {
    rmssd: latest?.rmssd ?? null,
    sdnn: latest?.sdnn ?? null,
    pnn50: latest?.pnn50 ?? null,
    hrDrop: latest?.hrDrop ?? null,
    stress: latest?.stress ?? null,
    beatCount: latest?.beatCount ?? null,
    avgRmssd: rmssdAgg.avg,
    avgSdnn: sdnnAgg.avg,
    maxRmssd: rmssdAgg.max,
    maxSdnn: sdnnAgg.max,
  };
}
