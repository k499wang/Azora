/**
 * Hardcoded demo data for App Store screenshots. Throwaway branch only —
 * services short-circuit to these fixtures instead of hitting Supabase.
 */
import type {
  BreathHoldSummary,
  DailyActivitySummary,
  HeartRatePoint,
  HeartRateIbiPoint,
  TodayHeartRateSummary,
} from '../services/tracking/types';
import type { HomeHrvStats } from '../services/tracking/homeStatsCore';
import type { HomeStats } from '../services/tracking/homeStatsService';
import type { ProfileSummary } from '../services/profile/profileSummaryService';
import type { UserProfile } from '../services/profile/profileService';
import type { HeartRateStats, HrSourcePick } from '../services/tracking/heartRateStatsCore';
import type { StressHistoryEntry } from '../lib/heartRate/stress';
import type { StreakSummary } from '../services/streaks/streakService';
import type { CaptureResult, IbiSample } from '../lib/heartRate/types';
import { getCaptureModeConfig, type HeartRateCaptureMode } from '../lib/heartRate/captureModes';

const TODAY = new Date();

function dateNDaysAgo(n: number): Date {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
  d.setDate(d.getDate() - n);
  return d;
}

function localDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isoAt(d: Date, hour: number, minute: number): string {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute, 0);
  return dt.toISOString();
}

const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'America/Los_Angeles';

// Days (as "days ago") that count toward the streak/calendar — a clean run
// through today plus a scattering of earlier active days this month.
const STREAK_DAYS_AGO = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 17, 18, 21, 24, 27];

export const MOCK_STREAK: StreakSummary = {
  currentStreak: 12,
  longestStreak: 21,
  lastQualifiedDate: localDateKey(TODAY),
};

export const MOCK_DAILY_ACTIVITY: DailyActivitySummary[] = Array.from({ length: 28 }, (_, i) => {
  const date = dateNDaysAgo(i);
  const active = STREAK_DAYS_AGO.includes(i);
  return {
    activityDate: localDateKey(date),
    timezone: TIMEZONE,
    dailyBreathHoldCompleted: active,
    breathHoldCount: active ? 1 + (i % 2) : 0,
    bestHoldSeconds: active ? 80 + ((i * 7) % 60) : null,
    breathingSessionCount: active ? 1 : 0,
    breathingSeconds: active ? 240 + (i % 3) * 60 : 0,
    heartRateCaptureCount: active ? 1 : 0,
    qualifiesForStreak: active,
  };
});

export const MOCK_COMPLETED_DAYS_AGO = STREAK_DAYS_AGO;

export const MOCK_TODAY_BREATH_HOLD: BreathHoldSummary = {
  sessionId: 'mock-breath-hold-today',
  startedAt: isoAt(TODAY, 8, 12),
  endedAt: isoAt(TODAY, 8, 14),
  localDate: localDateKey(TODAY),
  timezone: TIMEZONE,
  holdSeconds: 105,
  avgBpm: 64,
  minBpm: 56,
  maxBpm: 78,
};

export const MOCK_TODAY_HEART_RATE: TodayHeartRateSummary = {
  sessionId: 'mock-hr-today',
  startedAt: isoAt(TODAY, 7, 45),
  endedAt: isoAt(TODAY, 7, 46, ),
  localDate: localDateKey(TODAY),
  timezone: TIMEZONE,
  durationSeconds: 90,
  avgBpm: 61,
  minBpm: 52,
  maxBpm: 84,
  rmssd: 58,
  sdnn: 64,
  pnn50: 31,
  hrDrop: 14,
  beatCount: 92,
  stress: 21,
  mode: 'full',
};

export const MOCK_RECENT_HEART_RATE: TodayHeartRateSummary[] = Array.from({ length: 8 }, (_, i) => {
  const date = dateNDaysAgo(i);
  return {
    sessionId: `mock-hr-${i}`,
    startedAt: isoAt(date, 7, 40 + (i % 5)),
    endedAt: isoAt(date, 7, 41 + (i % 5)),
    localDate: localDateKey(date),
    timezone: TIMEZONE,
    durationSeconds: 90,
    avgBpm: 60 + (i % 6),
    minBpm: 50 + (i % 4),
    maxBpm: 80 + (i % 8),
    rmssd: 50 + (i % 12),
    sdnn: 55 + (i % 10),
    pnn50: 24 + (i % 10),
    hrDrop: 10 + (i % 6),
    beatCount: 88 + i,
    stress: 18 + (i % 15),
    mode: 'full',
  };
});

export const MOCK_STRESS_HISTORY: StressHistoryEntry[] = MOCK_RECENT_HEART_RATE.map((s) => ({
  stress: s.stress,
  localDate: s.localDate,
}));

export const MOCK_HRV_STATS: HomeHrvStats = {
  rmssd: 58,
  sdnn: 64,
  pnn50: 31,
  hrDrop: 14,
  stress: 21,
  beatCount: 92,
  avgRmssd: 54,
  avgSdnn: 60,
  maxRmssd: 71,
  maxSdnn: 79,
};

export const MOCK_BPM_SERIES: HeartRatePoint[] = Array.from({ length: 30 }, (_, i) => {
  const t = i / 29;
  const bpm = Math.round(78 - t * 20 + Math.sin(i * 0.9) * 2);
  return { offsetMs: i * 3500, bpm, signalQuality: 0.85 + Math.random() * 0.1 };
});

function buildMockIbiSeries(count: number): HeartRateIbiPoint[] {
  const points: HeartRateIbiPoint[] = [];
  let value = 820;
  let offsetMs = 0;
  for (let i = 0; i < count; i++) {
    const meanPull = (820 - value) * 0.12;
    const swing = Math.sin(i * 0.7) * 35;
    const noise = (Math.random() - 0.5) * 100;
    value = Math.max(640, Math.min(1080, value + meanPull + swing + noise));
    points.push({ offsetMs, ibiMs: Math.round(value), signalQuality: 0.82 + Math.random() * 0.15 });
    offsetMs += Math.round(value);
  }
  return points;
}

export const MOCK_IBI_SERIES: HeartRateIbiPoint[] = buildMockIbiSeries(70);

export const MOCK_HOME_STATS: HomeStats = {
  streak: MOCK_STREAK,
  todayBreathHold: MOCK_TODAY_BREATH_HOLD,
  todayHeartRate: MOCK_TODAY_HEART_RATE,
  stressHistory: MOCK_STRESS_HISTORY,
  dailyActivity: MOCK_DAILY_ACTIVITY,
  completedDaysAgo: MOCK_COMPLETED_DAYS_AGO,
  hrv: MOCK_HRV_STATS,
  partialErrors: {
    streak: false,
    todayBreathHold: false,
    todayHeartRate: false,
    stressHistory: false,
    dailyActivity: false,
  },
};

export const MOCK_PROFILE: UserProfile = {
  userId: 'mock-user',
  displayName: 'Alex',
  avatarUrl: null,
  timezone: TIMEZONE,
  onboardingGoal: 'calm',
  onboardingCompletedAt: isoAt(dateNDaysAgo(60), 9, 0),
  age: 29,
  gender: 'prefer_not',
  dailyMinutes: 5,
  defaultTechniqueId: 'box_breathing',
};

const COMPLETED_DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => i)
  .filter((i) => STREAK_DAYS_AGO.includes(i))
  .map((i) => dateNDaysAgo(i).getDate());

export const MOCK_PROFILE_SUMMARY: ProfileSummary = {
  profile: {
    displayName: 'Alex',
    avatarUrl: null,
    timezone: TIMEZONE,
  },
  longestHoldSeconds: 148,
  breathHoldCount: 62,
  activeDays: 34,
  currentStreak: 12,
  longestStreak: 21,
  completedDays: COMPLETED_DAYS_OF_MONTH,
  completedDaysAgo: MOCK_COMPLETED_DAYS_AGO,
  breathHoldTrend: Array.from({ length: 14 }, (_, i) => {
    const date = dateNDaysAgo(13 - i);
    return {
      label: String(date.getDate()),
      value: 70 + i * 3 + Math.round(Math.sin(i) * 4),
    };
  }),
  partialErrors: {
    profile: false,
    longestHold: false,
    breathHoldCount: false,
    activeDays: false,
    streak: false,
    completedDays: false,
    breathHoldTrend: false,
  },
};

const MOCK_HR_SOURCE: HrSourcePick = {
  kind: 'today_full',
  session: MOCK_TODAY_HEART_RATE,
  ageDays: 0,
};

function buildMockCaptureIbiSamples(durationMs: number, baselineMs: number): IbiSample[] {
  const samples: IbiSample[] = [];
  let value = baselineMs;
  let offsetMs = 0;
  while (offsetMs < durationMs) {
    const meanPull = (baselineMs - value) * 0.12;
    const swing = Math.sin(offsetMs / 4000) * 30;
    const noise = (Math.random() - 0.5) * 80;
    value = Math.max(650, Math.min(1100, value + meanPull + swing + noise));
    samples.push({
      offsetMs,
      ibiMs: Math.round(value),
      signalQuality: 0.82 + Math.random() * 0.15,
    });
    offsetMs += Math.round(value);
  }
  return samples;
}

export function buildMockCaptureResult(mode: HeartRateCaptureMode): CaptureResult {
  const config = getCaptureModeConfig(mode);
  const baselineMs = 940;
  const ibiSamples = buildMockCaptureIbiSamples(config.durationMs, baselineMs);
  const bpmSamples = ibiSamples.map((sample) => ({
    offsetMs: sample.offsetMs,
    bpm: Math.round(60000 / sample.ibiMs),
  }));
  const avgBpm = Math.round(
    bpmSamples.reduce((sum, sample) => sum + sample.bpm, 0) / Math.max(1, bpmSamples.length),
  );

  return {
    reading: {
      bpm: avgBpm,
      confidence: 0.94,
      sampleCount: ibiSamples.length,
      durationMs: config.durationMs,
      recordedAt: new Date().toISOString(),
      source: 'camera-flash',
      ...(config.computeHrv
        ? {
            rmssd: 56,
            sdnn: 62,
            stress: 22,
            pnn50: 29,
            hrDrop: 13,
            beatCount: ibiSamples.length,
          }
        : {}),
    },
    error: null,
    ibiSamples,
    bpmSamples,
    mode,
  };
}

function buildMockSessionDetail(
  summary: TodayHeartRateSummary,
): TodayHeartRateSummary & { bpmSeries: HeartRatePoint[]; ibiSeries: HeartRateIbiPoint[] } {
  const ibiSeries = buildMockIbiSeries(Math.round(summary.durationSeconds / 1.2));
  const bpmSeries: HeartRatePoint[] = ibiSeries.map((sample) => ({
    offsetMs: sample.offsetMs,
    bpm: Math.round(60000 / sample.ibiMs),
    signalQuality: sample.signalQuality,
  }));
  return { ...summary, bpmSeries, ibiSeries };
}

const MOCK_SESSION_DETAILS_BY_ID = new Map(
  [MOCK_TODAY_HEART_RATE, ...MOCK_RECENT_HEART_RATE].map((summary) => [
    summary.sessionId,
    buildMockSessionDetail(summary),
  ]),
);

export function getMockHeartRateSessionDetail(sessionId: string) {
  return (
    MOCK_SESSION_DETAILS_BY_ID.get(sessionId) ??
    buildMockSessionDetail(MOCK_TODAY_HEART_RATE)
  );
}

/** Fallback BPM samples for the breathing-exercise results screen when the
 * live (mocked) capture ran too short to collect a real-looking series. */
export function buildMockExerciseBpmSamples(
  durationSec: number,
): Array<{ offsetMs: number; bpm: number }> {
  const samples: Array<{ offsetMs: number; bpm: number }> = [];
  const durationMs = Math.max(10_000, durationSec * 1000);
  let bpm = 72;
  for (let offsetMs = 0; offsetMs <= durationMs; offsetMs += 1000) {
    const meanPull = (66 - bpm) * 0.08;
    const noise = (Math.random() - 0.5) * 2.5;
    bpm = Math.max(52, Math.min(84, bpm + meanPull + noise));
    samples.push({ offsetMs, bpm: Math.round(bpm) });
  }
  return samples;
}

export const MOCK_HEART_RATE_STATS: HeartRateStats = {
  hrvSource: MOCK_HR_SOURCE,
  recent: MOCK_RECENT_HEART_RATE,
  stressHistory: MOCK_STRESS_HISTORY,
  bpmSeries: MOCK_BPM_SERIES,
  ibiSeries: MOCK_IBI_SERIES,
  hrv: MOCK_HRV_STATS,
  partialErrors: {
    recent: false,
    stressHistory: false,
    bpmSeries: false,
    ibiSeries: false,
  },
};
