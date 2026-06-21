import { getStreakSummary, type StreakSummary } from '../streaks/streakService';
import {
  getBreathHoldSummaryForDate,
  getDailyActivityRange,
} from './breathHoldService';
import {
  getHeartRateSummaryForDate,
  getRecentHeartRateSummaries,
} from './heartRateService';
import { buildHrvStats, buildStressHistory } from './homeStatsCore';
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

const DAY_MS = 24 * 60 * 60 * 1000;

function toLocalDateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseActivityDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getCompletedDaysAgo(activity: DailyActivitySummary[]): number[] {
  const today = toLocalDateOnly(new Date());

  return activity
    .filter((row) => row.qualifiesForStreak)
    .map((row) => {
      const date = parseActivityDate(row.activityDate);
      return Math.round((today.getTime() - date.getTime()) / DAY_MS);
    })
    .filter((daysAgo) => daysAgo >= 0 && daysAgo < 28);
}

function getSettledValue<T>(
  result: PromiseSettledResult<T>,
  fallback: T,
): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export async function getHomeStats(
  userId: string,
  localDate: string,
): Promise<HomeStats> {
  const [
    streakResult,
    selectedBreathHoldResult,
    selectedHeartRateResult,
    stressHistorySourceResult,
    dailyActivityResult,
  ] = await Promise.allSettled([
    getStreakSummary(userId),
    getBreathHoldSummaryForDate(userId, localDate),
    getHeartRateSummaryForDate(userId, localDate),
    getRecentHeartRateHistoryForHrv(userId),
    getDailyActivityRange(userId, 28),
  ]);

  const streak = getSettledValue(streakResult, null);
  const todayBreathHold = getSettledValue(selectedBreathHoldResult, null);
  const todayHeartRate = getSettledValue(selectedHeartRateResult, null);
  const heartRateHistory = getSettledValue(
    stressHistorySourceResult,
    [] as TodayHeartRateSummary[],
  );
  const fullHeartRateHistory = heartRateHistory.filter(
    (session) => session.mode === 'full',
  );
  const todayFullHeartRate =
    fullHeartRateHistory.find(
      (session) => session.localDate === localDate,
    ) ?? null;
  const stressHistory = buildStressHistory(fullHeartRateHistory);
  const dailyActivity = getSettledValue(dailyActivityResult, []);
  const hrv = buildHrvStats(todayFullHeartRate, fullHeartRateHistory);

  const partialErrors: HomeStatsPartialErrors = {
    streak: streakResult.status === 'rejected',
    todayBreathHold: selectedBreathHoldResult.status === 'rejected',
    todayHeartRate: selectedHeartRateResult.status === 'rejected',
    stressHistory: stressHistorySourceResult.status === 'rejected',
    dailyActivity: dailyActivityResult.status === 'rejected',
  };

  return {
    streak,
    todayBreathHold,
    todayHeartRate,
    stressHistory,
    dailyActivity,
    completedDaysAgo: getCompletedDaysAgo(dailyActivity),
    hrv,
    partialErrors,
  };
}

/**
 * Internal helper. Loads the last 15 heart-rate captures so
 * buildStressHistory + buildHrvStats have what they need.
 */
async function getRecentHeartRateHistoryForHrv(
  userId: string,
): Promise<TodayHeartRateSummary[]> {
  return getRecentHeartRateSummaries(userId, 15);
}
