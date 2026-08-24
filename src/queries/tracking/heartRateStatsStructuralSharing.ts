import { replaceEqualDeep } from '@tanstack/react-query';
import type { HeartRateStats } from '../../services/tracking/heartRateStatsCore';

function sourceSessionId(stats: HeartRateStats): string | null {
  return stats.hrvSource.session?.sessionId ?? null;
}

/** Keep valid Heart-tab slices when one parallel aggregate request fails. */
export function mergeHeartRateStatsPartialResult(
  previous: HeartRateStats | undefined,
  incoming: HeartRateStats,
): HeartRateStats {
  if (previous == null) return incoming;

  const sourceFailed = incoming.partialErrors.stressHistory;
  const sameSource = sourceSessionId(previous) === sourceSessionId(incoming);
  const canReuseSourceSeries = sourceFailed || sameSource;
  const bpmUnavailable =
    incoming.partialErrors.bpmSeries &&
    incoming.partialErrors.ibiSeries;

  const merged: HeartRateStats = {
    ...incoming,
    recent: incoming.partialErrors.recent ? previous.recent : incoming.recent,
    hrvSource: sourceFailed ? previous.hrvSource : incoming.hrvSource,
    stressHistory: sourceFailed
      ? previous.stressHistory
      : incoming.stressHistory,
    hrv: sourceFailed ? previous.hrv : incoming.hrv,
    bpmSeries:
      canReuseSourceSeries && (sourceFailed || bpmUnavailable)
        ? previous.bpmSeries
        : incoming.bpmSeries,
    ibiSeries:
      canReuseSourceSeries &&
      (sourceFailed || incoming.partialErrors.ibiSeries)
        ? previous.ibiSeries
        : incoming.ibiSeries,
  };

  return replaceEqualDeep(previous, merged);
}
