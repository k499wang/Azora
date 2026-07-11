import type { StreakSummary } from '../streaks/streakService';
import type {
  BreathHoldSummary,
  DailyActivitySummary,
  TodayHeartRateSummary,
} from './types';
import type { HomeHrvStats } from './homeStatsCore';

export type { HomeHrvStats };

/**
 * Home screen view of the user's stats. The recently-logged list and IBI
 * series moved to the dedicated Heart tab; this payload no longer fetches
 * them. HRV/stressHistory stay because InsightsFlashCard derives its text
 * from RMSSD/SDNN/hrDrop/avg.
 */
export interface HomeStats {
  streak: StreakSummary | null;
  todayBreathHold: BreathHoldSummary | null;
  todayHeartRate: TodayHeartRateSummary | null;
  stressHistory: import('../../lib/heartRate/stress').StressHistoryEntry[];
  dailyActivity: DailyActivitySummary[];
  completedDaysAgo: number[];
  hrv: HomeHrvStats;
  partialErrors: HomeStatsPartialErrors;
}

export interface HomeStatsPartialErrors {
  streak: boolean;
  todayBreathHold: boolean;
  todayHeartRate: boolean;
  stressHistory: boolean;
  dailyActivity: boolean;
}

export async function getHomeStats(
  userId: string,
  localDate: string,
): Promise<HomeStats> {
  void userId;
  void localDate;
  const { MOCK_HOME_STATS } = await import('../../dev/mockScreenshotData');
  return MOCK_HOME_STATS;
}
