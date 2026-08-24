import { replaceEqualDeep } from '@tanstack/react-query';
import type { HomeStats } from '../../services/tracking/homeStatsService';

/** Keep the last good aggregate slice when one parallel Home request fails. */
export function mergeHomeStatsPartialResult(
  previous: HomeStats | undefined,
  incoming: HomeStats,
): HomeStats {
  if (previous == null) return incoming;

  const merged: HomeStats = {
    ...incoming,
    streak: incoming.partialErrors.streak ? previous.streak : incoming.streak,
    todayBreathHold: incoming.partialErrors.todayBreathHold
      ? previous.todayBreathHold
      : incoming.todayBreathHold,
    todayHeartRate: incoming.partialErrors.todayHeartRate
      ? previous.todayHeartRate
      : incoming.todayHeartRate,
    stressHistory: incoming.partialErrors.stressHistory
      ? previous.stressHistory
      : incoming.stressHistory,
    dailyActivity: incoming.partialErrors.dailyActivity
      ? previous.dailyActivity
      : incoming.dailyActivity,
    completedDaysAgo: incoming.partialErrors.dailyActivity
      ? previous.completedDaysAgo
      : incoming.completedDaysAgo,
    hrv: incoming.partialErrors.stressHistory ? previous.hrv : incoming.hrv,
  };

  return replaceEqualDeep(previous, merged);
}
