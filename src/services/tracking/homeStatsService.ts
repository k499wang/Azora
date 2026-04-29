import { getStreakSummary, type StreakSummary } from '../streaks/streakService';
import {
  getDailyActivityRange,
  getTodayBreathHoldIbiSeries,
  getTodayBreathHoldSummary,
} from './breathHoldService';
import { getTodayHeartRateSummary } from './heartRateService';
import type {
  BreathHoldSummary,
  DailyActivitySummary,
  HeartRateIbiPoint,
  TodayHeartRateSummary,
} from './types';

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
  dailyActivity: DailyActivitySummary[];
  completedDaysAgo: number[];
  ibiSeries: HeartRateIbiPoint[];
  hrv: HomeHrvStats;
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

function buildHrvStats(
  breathHold: BreathHoldSummary | null,
  heartRate: TodayHeartRateSummary | null,
): HomeHrvStats {
  const summary = breathHold ?? heartRate;
  const rmssd = summary?.rmssd ?? null;
  const avgBpm = summary?.avgBpm ?? null;
  const stress =
    rmssd != null && avgBpm != null
      ? deriveStressFromStoredSummary(rmssd, avgBpm)
      : null;

  return {
    rmssd,
    sdnn: summary?.sdnn ?? null,
    pnn50: summary?.pnn50 ?? null,
    hrDrop: summary?.hrDrop ?? null,
    stress,
    beatCount: summary?.beatCount ?? null,
  };
}

function deriveStressFromStoredSummary(rmssd: number, avgBpm: number): number {
  const rmssdScore = Math.max(0, 100 - (rmssd / 60) * 100);
  const hrScore = Math.max(0, ((avgBpm - 50) / 30) * 100);
  return Math.max(0, Math.min(100, Math.round(rmssdScore * 0.7 + hrScore * 0.3)));
}

export async function getHomeStats(userId: string): Promise<HomeStats> {
  const [
    streak,
    todayBreathHold,
    todayHeartRate,
    dailyActivity,
    breathHoldIbiSeries,
  ] = await Promise.all([
    getStreakSummary(userId),
    getTodayBreathHoldSummary(userId),
    getTodayHeartRateSummary(userId),
    getDailyActivityRange(userId, 28),
    getTodayBreathHoldIbiSeries(userId),
  ]);

  return {
    streak,
    todayBreathHold,
    todayHeartRate,
    dailyActivity,
    completedDaysAgo: getCompletedDaysAgo(dailyActivity),
    ibiSeries: breathHoldIbiSeries,
    hrv: buildHrvStats(todayBreathHold, todayHeartRate),
  };
}
