import { getStreakSummary, type StreakSummary } from '../streaks/streakService';
import {
  getBreathHoldIbiSeries,
  getBreathHoldSummaryForDate,
  getDailyActivityRange,
} from './breathHoldService';
import {
  getHeartRateSummaryForDate,
  getRecentHeartRateSummaries,
} from './heartRateService';
import type {
  BreathHoldSummary,
  DailyActivitySummary,
  HeartRateIbiPoint,
  TodayHeartRateSummary,
} from './types';
import type { StressHistoryEntry } from '../../lib/heartRate/stress';

export interface HomeHrvStats {
  rmssd: number | null;
  sdnn: number | null;
  pnn50: number | null;
  hrDrop: number | null;
  stress: number | null;
  beatCount: number | null;
}

export interface HomeStats {
  streak: StreakSummary | null;
  todayBreathHold: BreathHoldSummary | null;
  todayHeartRate: TodayHeartRateSummary | null;
  recentHeartRates: TodayHeartRateSummary[];
  stressHistory: StressHistoryEntry[];
  dailyActivity: DailyActivitySummary[];
  completedDaysAgo: number[];
  ibiSeries: HeartRateIbiPoint[];
  hrv: HomeHrvStats;
  partialErrors: HomeStatsPartialErrors;
}

export interface HomeStatsPartialErrors {
  streak: boolean;
  todayBreathHold: boolean;
  todayHeartRate: boolean;
  recentHeartRates: boolean;
  stressHistory: boolean;
  dailyActivity: boolean;
  breathHoldIbiSeries: boolean;
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

function buildHrvStats(breathHold: BreathHoldSummary | null): HomeHrvStats {
  if (breathHold == null) {
    return {
      rmssd: null,
      sdnn: null,
      pnn50: null,
      hrDrop: null,
      stress: null,
      beatCount: null,
    };
  }

  return {
    rmssd: breathHold.rmssd ?? null,
    sdnn: breathHold.sdnn ?? null,
    pnn50: breathHold.pnn50 ?? null,
    hrDrop: breathHold.hrDrop ?? null,
    stress:
      breathHold.stress ??
      deriveStressFromStoredSummary(breathHold.rmssd, breathHold.avgBpm),
    beatCount: breathHold.beatCount ?? null,
  };
}

function deriveStressFromStoredSummary(
  rmssd: number | null,
  avgBpm: number | null,
): number | null {
  if (rmssd == null || avgBpm == null) return null;

  const rmssdScore = Math.max(0, 100 - (rmssd / 60) * 100);
  const hrScore = Math.max(0, ((avgBpm - 50) / 30) * 100);
  return Math.max(0, Math.min(100, Math.round(rmssdScore * 0.7 + hrScore * 0.3)));
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
    recentHeartRatesResult,
    stressHistoryResult,
    dailyActivityResult,
  ] = await Promise.allSettled([
    getStreakSummary(userId),
    getBreathHoldSummaryForDate(userId, localDate),
    getHeartRateSummaryForDate(userId, localDate),
    getRecentHeartRateSummaries(userId, 3),
    getRecentHeartRateSummaries(userId, 30),
    getDailyActivityRange(userId, 28),
  ]);

  const streak = getSettledValue(streakResult, null);
  const todayBreathHold = getSettledValue(selectedBreathHoldResult, null);
  const todayHeartRate = getSettledValue(selectedHeartRateResult, null);
  const recentHeartRates = getSettledValue(recentHeartRatesResult, []);
  const stressHistorySource = getSettledValue(
    stressHistoryResult,
    [] as TodayHeartRateSummary[],
  );
  const stressHistory: StressHistoryEntry[] = stressHistorySource.map((s) => ({
    stress: s.stress ?? null,
    localDate: s.localDate,
  }));
  const dailyActivity = getSettledValue(dailyActivityResult, []);
  const [breathHoldIbiSeriesResult] = await Promise.allSettled([
    getBreathHoldIbiSeries(userId, todayBreathHold?.sessionId ?? null),
  ]);
  const breathHoldIbiSeries = getSettledValue(breathHoldIbiSeriesResult, []);
  const partialErrors: HomeStatsPartialErrors = {
    streak: streakResult.status === 'rejected',
    todayBreathHold: selectedBreathHoldResult.status === 'rejected',
    todayHeartRate: selectedHeartRateResult.status === 'rejected',
    recentHeartRates: recentHeartRatesResult.status === 'rejected',
    stressHistory: stressHistoryResult.status === 'rejected',
    dailyActivity: dailyActivityResult.status === 'rejected',
    breathHoldIbiSeries: breathHoldIbiSeriesResult.status === 'rejected',
  };

  return {
    streak,
    todayBreathHold,
    todayHeartRate,
    recentHeartRates,
    stressHistory,
    dailyActivity,
    completedDaysAgo: getCompletedDaysAgo(dailyActivity),
    ibiSeries: breathHoldIbiSeries,
    hrv: buildHrvStats(todayBreathHold),
    partialErrors,
  };
}
