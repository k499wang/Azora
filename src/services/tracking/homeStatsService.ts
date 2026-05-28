import { getStreakSummary, type StreakSummary } from '../streaks/streakService';
import {
  getBreathHoldSummaryForDate,
  getDailyActivityRange,
} from './breathHoldService';
import {
  getHeartRateSummaryForDate,
  getRecentHeartRateSummaries,
  getTodayHeartRateIbiSeries,
} from './heartRateService';
import { buildStressHistory } from './homeStatsCore';
import type {
  BreathHoldSummary,
  DailyActivitySummary,
  HeartRateIbiPoint,
  TodayHeartRateSummary,
} from './types';
import type { StressHistoryEntry } from '../../lib/heartRate/stress';

type HrvHistoryEntry = { rmssd: number | null; sdnn: number | null };

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
  heartRateIbiSeries: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_HRV_AGGREGATE_POINTS = 4;

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

  return {
    avg: sum / count,
    max,
  };
}

// HRV-type stats come only from full (90s) heart-rate captures — never from
// breath holds or quick captures. BPM-type stats are sourced separately on the
// Home screen and may use any heart-rate capture.
function buildHrvStats(
  todayFull: TodayHeartRateSummary | null,
  fullHistory: TodayHeartRateSummary[],
): HomeHrvStats {
  const rmssdAgg = aggregateField(fullHistory, 'rmssd');
  const sdnnAgg = aggregateField(fullHistory, 'sdnn');

  return {
    rmssd: todayFull?.rmssd ?? null,
    sdnn: todayFull?.sdnn ?? null,
    pnn50: todayFull?.pnn50 ?? null,
    hrDrop: todayFull?.hrDrop ?? null,
    stress: todayFull?.stress ?? null,
    beatCount: todayFull?.beatCount ?? null,
    avgRmssd: rmssdAgg.avg,
    avgSdnn: sdnnAgg.avg,
    maxRmssd: rmssdAgg.max,
    maxSdnn: sdnnAgg.max,
  };
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
    heartRateIbiSeriesResult,
  ] = await Promise.allSettled([
    getStreakSummary(userId),
    getBreathHoldSummaryForDate(userId, localDate),
    getHeartRateSummaryForDate(userId, localDate),
    getRecentHeartRateSummaries(userId, 3),
    getRecentHeartRateSummaries(userId, 15),
    getDailyActivityRange(userId, 28),
    getTodayHeartRateIbiSeries(userId),
  ]);

  const streak = getSettledValue(streakResult, null);
  const todayBreathHold = getSettledValue(selectedBreathHoldResult, null);
  const todayHeartRate = getSettledValue(selectedHeartRateResult, null);
  const recentHeartRates = getSettledValue(recentHeartRatesResult, []);
  const heartRateHistory = getSettledValue(
    stressHistoryResult,
    [] as TodayHeartRateSummary[],
  );
  const fullHeartRateHistory = heartRateHistory.filter(
    (session) => session.mode === 'full',
  );
  const todayFullHeartRate =
    fullHeartRateHistory.find((session) => session.localDate === localDate) ??
    null;
  const stressHistory = buildStressHistory(fullHeartRateHistory);
  const dailyActivity = getSettledValue(dailyActivityResult, []);
  const ibiSeries = getSettledValue(heartRateIbiSeriesResult, []);
  const partialErrors: HomeStatsPartialErrors = {
    streak: streakResult.status === 'rejected',
    todayBreathHold: selectedBreathHoldResult.status === 'rejected',
    todayHeartRate: selectedHeartRateResult.status === 'rejected',
    recentHeartRates: recentHeartRatesResult.status === 'rejected',
    stressHistory: stressHistoryResult.status === 'rejected',
    dailyActivity: dailyActivityResult.status === 'rejected',
    heartRateIbiSeries: heartRateIbiSeriesResult.status === 'rejected',
  };

  return {
    streak,
    todayBreathHold,
    todayHeartRate,
    recentHeartRates,
    stressHistory,
    dailyActivity,
    completedDaysAgo: getCompletedDaysAgo(dailyActivity),
    ibiSeries,
    hrv: buildHrvStats(todayFullHeartRate, fullHeartRateHistory),
    partialErrors,
  };
}
