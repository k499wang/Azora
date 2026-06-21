import {
  getHeartRateIbiSeriesForSession,
  getRecentHeartRateSummaries,
} from './heartRateService';
import { getHeartRateStatsCore } from './heartRateStatsCore';

export type {
  HeartRateStats,
  HeartRateStatsPartialErrors,
  HrSourcePick,
} from './heartRateStatsCore';
export { pickHrSource } from './heartRateStatsCore';

/** Load the data required by the dedicated Heart tab. */
export function getHeartRateStats(userId: string, todayLocalDate: string) {
  return getHeartRateStatsCore(userId, todayLocalDate, {
    getRecentHeartRateSummaries,
    getHeartRateIbiSeriesForSession,
  });
}
