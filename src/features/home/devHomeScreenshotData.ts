import { getTechnique } from '../exercise/guidedBreathing/techniques';
import { DAYS, type Picks } from '../room/RoomScene';
import type { PyramidRoom } from '../room/PyramidCanvas';
import { ROOM_SHELLS, ROOM_STYLES } from '../room/roomShells';
import type { RoomClaim } from '../room/useRoomClaim';
import { formatLocalDate } from '../../lib/calendar/weekCalendarDays';
import { ROOM_SLOTS, roomProgress } from '../../lib/room/roomProgress';
import type { DailiesCompletion } from '../../hooks/useDailiesCompletion';
import type { RoomDecorationRow } from '../../services/room/roomService';
import type { HeartRateStats } from '../../services/tracking/heartRateStatsCore';
import type { HomeStats } from '../../services/tracking/homeStatsService';
import type {
  DailyActivitySummary,
  HeartRateIbiPoint,
  TodayHeartRateSummary,
} from '../../services/tracking/types';
import type { ProfileSummary } from '../../services/profile/profileSummaryService';

const SCREENSHOT_DECORATION_COUNT = 4;
const PROFILE_TREND_VALUES = [36, 42, 39, 48, 52, 49, 58, 61, 65, 63, 72, 78];
const PROFILE_HOLD_VALUES = [78, 72, 68, 64, 61, 58, 55, 51];
const STRESS_HISTORY_VALUES = [38, 35, 31, 29, 27, 26, 24];

const NO_HEART_RATE_ERRORS = {
  recent: false,
  stressHistory: false,
  bpmSeries: false,
  ibiSeries: false,
} as const;

const NO_PROFILE_ERRORS = {
  profile: false,
  longestHold: false,
  breathHoldCount: false,
  lifetimeTotals: false,
  activeDays: false,
  streak: false,
  completedDays: false,
  breathHoldTrend: false,
} as const;

const NO_HOME_STATS_ERRORS = {
  streak: false,
  todayBreathHold: false,
  todayHeartRate: false,
  stressHistory: false,
  dailyActivity: false,
} as const;

export interface DevHomeScreenshotData {
  roomClaim: RoomClaim;
  streakDays: number;
}

export interface DevHeartScreenshotData {
  stats: HeartRateStats;
  age: number;
}

export interface DevProfileScreenshotData {
  profileSummary: ProfileSummary;
  homeStats: HomeStats;
}

function isDevScreenshotDataEnabled(): boolean {
  if (
    !__DEV__ ||
    process.env.EXPO_PUBLIC_HOME_SCREENSHOT_DATA !== 'true'
  ) {
    return false;
  }

  return true;
}

function getLocalDate(today: Date, daysAgo = 0): Date {
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - daysAgo,
    12,
  );
}

function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function getSessionTimestamp(
  date: Date,
  hour: number,
  minute: number,
): string {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
  ).toISOString();
}

function getEndedAt(startedAt: string, durationSeconds: number): string {
  return new Date(Date.parse(startedAt) + durationSeconds * 1_000).toISOString();
}

function buildHeartRateSummary({
  date,
  timezone,
  daysAgo,
  mode,
  durationSeconds,
  avgBpm,
  minBpm,
  maxBpm,
  rmssd,
  sdnn,
  pnn50,
  hrDrop,
  beatCount,
  stress,
}: {
  date: Date;
  timezone: string;
  daysAgo: number;
  mode: TodayHeartRateSummary['mode'];
  durationSeconds: number;
  avgBpm: number;
  minBpm: number;
  maxBpm: number;
  rmssd: number | null;
  sdnn: number | null;
  pnn50: number | null;
  hrDrop: number;
  beatCount: number;
  stress: number;
}): TodayHeartRateSummary {
  const startedAt = getSessionTimestamp(date, 9 + daysAgo, 24);

  return {
    sessionId: `dev-heart-${formatLocalDate(date)}-${mode}`,
    startedAt,
    endedAt: getEndedAt(startedAt, durationSeconds),
    localDate: formatLocalDate(date),
    timezone,
    durationSeconds,
    avgBpm,
    minBpm,
    maxBpm,
    rmssd,
    sdnn,
    pnn50,
    hrDrop,
    beatCount,
    stress,
    mode,
  };
}

function buildIbiSeries(): HeartRateIbiPoint[] {
  let elapsedMs = 0;

  return Array.from({ length: 104 }, (_, index) => {
    const ibiMs = Math.round(
      880 + Math.sin(index * 0.32) * 36 + Math.sin(index * 0.09) * 18,
    );
    elapsedMs += ibiMs;

    return {
      offsetMs: elapsedMs,
      ibiMs,
      signalQuality: 0.98,
    };
  });
}

function buildHeartRateStats(today: Date, timezone: string): HeartRateStats {
  const todayFull = buildHeartRateSummary({
    date: getLocalDate(today),
    timezone,
    daysAgo: 0,
    mode: 'full',
    durationSeconds: 90,
    avgBpm: 68,
    minBpm: 60,
    maxBpm: 78,
    rmssd: 54,
    sdnn: 47,
    pnn50: 27,
    hrDrop: 18,
    beatCount: 104,
    stress: 24,
  });
  const yesterdayQuick = buildHeartRateSummary({
    date: getLocalDate(today, 1),
    timezone,
    daysAgo: 1,
    mode: 'quick',
    durationSeconds: 20,
    avgBpm: 72,
    minBpm: 67,
    maxBpm: 79,
    rmssd: null,
    sdnn: null,
    pnn50: null,
    hrDrop: 8,
    beatCount: 24,
    stress: 42,
  });
  const priorFull = buildHeartRateSummary({
    date: getLocalDate(today, 2),
    timezone,
    daysAgo: 2,
    mode: 'full',
    durationSeconds: 90,
    avgBpm: 65,
    minBpm: 57,
    maxBpm: 72,
    rmssd: 49,
    sdnn: 44,
    pnn50: 24,
    hrDrop: 15,
    beatCount: 101,
    stress: 31,
  });

  return {
    hrvSource: { kind: 'today_full', session: todayFull, ageDays: 0 },
    recent: [todayFull, yesterdayQuick, priorFull],
    stressHistory: STRESS_HISTORY_VALUES.map((stress, index) => ({
      stress,
      localDate: formatLocalDate(
        getLocalDate(today, STRESS_HISTORY_VALUES.length - index - 1),
      ),
    })),
    bpmSeries: Array.from({ length: 31 }, (_, index) => ({
      offsetMs: index * 3_000,
      bpm:
        Math.round(
          (77 - (16 * index) / 30 + Math.sin(index * 0.65) * 1.4) * 10,
        ) / 10,
      signalQuality: 0.98,
    })),
    ibiSeries: buildIbiSeries(),
    hrv: {
      rmssd: 54,
      sdnn: 47,
      pnn50: 27,
      hrDrop: 18,
      stress: 24,
      beatCount: 104,
      avgRmssd: 46,
      avgSdnn: 41,
      maxRmssd: 61,
      maxSdnn: 54,
    },
    partialErrors: NO_HEART_RATE_ERRORS,
  };
}

function buildDailyActivity(
  today: Date,
  timezone: string,
): DailyActivitySummary[] {
  return PROFILE_HOLD_VALUES.map((bestHoldSeconds, daysAgo) => ({
    activityDate: formatLocalDate(getLocalDate(today, daysAgo)),
    timezone,
    dailyBreathHoldCompleted: true,
    breathHoldCount: 1,
    bestHoldSeconds,
    breathingSessionCount: daysAgo % 3 === 0 ? 3 : 2,
    breathingSeconds: daysAgo % 3 === 0 ? 540 : 360,
    heartRateCaptureCount: daysAgo % 2 === 0 ? 1 : 0,
    qualifiesForStreak: true,
  }));
}

function buildDecorations(today: Date): RoomDecorationRow[] {
  return ROOM_SLOTS.slice(0, SCREENSHOT_DECORATION_COUNT).map(
    (slot, index) => {
      const optionId = DAYS.find((day) => day.key === slot)?.options[0]?.id;

      if (optionId == null) {
        throw new Error(`Missing screenshot decoration for ${slot}.`);
      }

      const earnedDate = new Date(today);
      earnedDate.setDate(
        today.getDate() - (SCREENSHOT_DECORATION_COUNT - index),
      );

      return {
        slot,
        optionId,
        earnedLocalDate: formatLocalDate(earnedDate),
      };
    },
  );
}

/**
 * Deliberately explicit local-only states for marketing screenshots. Requiring
 * both guards keeps an accidentally configured build from showing them.
 */
export function getDevHomeScreenshotData(): DevHomeScreenshotData | null {
  if (!isDevScreenshotDataEnabled()) return null;

  const today = new Date();
  const todayLocalDate = formatLocalDate(today);
  const decorations = buildDecorations(today);
  const dailies: DailiesCompletion = {
    todayLocalDate,
    guidedTechnique: getTechnique('box'),
    guidedTechniqueLoading: false,
    handPickedTechnique: getTechnique('resonance'),
    handPickedTechniqueLoading: false,
    guidedCompleted: true,
    handPickedCompleted: true,
    breathHoldCompleted: false,
    allCompleted: false,
    isLoading: false,
    isSettling: false,
  };

  return {
    roomClaim: {
      room: {
        id: 'dev-home-screenshot-floor-12',
        floor: 12,
        shell: 'mint',
        frameHue: 'teal',
        decorations,
      },
      progress: roomProgress({
        decorations,
        lastEarnedLocalDate:
          decorations[decorations.length - 1]?.earnedLocalDate ?? null,
        todayLocalDate,
        dailiesComplete: dailies.allCompleted,
      }),
      dailies,
      isLoading: false,
    },
    streakDays: 12,
  };
}

export function getDevHeartScreenshotData(): DevHeartScreenshotData | null {
  if (!isDevScreenshotDataEnabled()) return null;

  const today = new Date();

  return {
    stats: buildHeartRateStats(today, getLocalTimezone()),
    age: 32,
  };
}

export function getDevProfileScreenshotData(): DevProfileScreenshotData | null {
  if (!isDevScreenshotDataEnabled()) return null;

  const today = new Date();
  const timezone = getLocalTimezone();
  const todayLocalDate = formatLocalDate(today);
  const heartRateStats = buildHeartRateStats(today, timezone);
  const dailyActivity = buildDailyActivity(today, timezone);
  const completedDayCount = Math.min(12, today.getDate());
  const completedDaysAgo = Array.from(
    { length: completedDayCount },
    (_, daysAgo) => daysAgo,
  );
  const completedDays = completedDaysAgo
    .map((daysAgo) => getLocalDate(today, daysAgo).getDate())
    .sort((a, b) => a - b);
  const todayHeartRate = heartRateStats.hrvSource.session;
  const todayHoldStartedAt = getSessionTimestamp(today, 8, 15);

  return {
    profileSummary: {
      profile: {
        displayName: 'Alex',
        avatarUrl: null,
        timezone,
      },
      longestHoldSeconds: 78,
      breathHoldCount: 31,
      totalSessions: 86,
      totalBreaths: 184,
      totalHoldSeconds: 3_780,
      activeDays: 24,
      currentStreak: 12,
      longestStreak: 18,
      completedDays,
      completedDaysAgo,
      breathHoldTrend: PROFILE_TREND_VALUES.map((value, index) => ({
        label: String(
          getLocalDate(today, (PROFILE_TREND_VALUES.length - index - 1) * 2)
            .getDate(),
        ),
        value,
      })),
      partialErrors: NO_PROFILE_ERRORS,
    },
    homeStats: {
      streak: {
        currentStreak: 12,
        longestStreak: 18,
        lastQualifiedDate: todayLocalDate,
      },
      todayBreathHold: {
        sessionId: `dev-hold-${todayLocalDate}`,
        startedAt: todayHoldStartedAt,
        endedAt: getEndedAt(todayHoldStartedAt, 78),
        localDate: todayLocalDate,
        timezone,
        holdSeconds: 78,
        avgBpm: 66,
        minBpm: 58,
        maxBpm: 74,
      },
      todayHeartRate,
      stressHistory: heartRateStats.stressHistory,
      dailyActivity,
      completedDaysAgo: PROFILE_HOLD_VALUES.map((_, daysAgo) => daysAgo),
      hrv: heartRateStats.hrv,
      partialErrors: NO_HOME_STATS_ERRORS,
    },
  };
}

export function getDevHotelScreenshotData(): PyramidRoom[] | null {
  if (!isDevScreenshotDataEnabled()) return null;

  return Array.from({ length: 12 }, (_, index) => {
    const floor = index + 1;

    if (floor === 12) {
      return {
        key: 'dev-hotel-floor-12',
        floor,
        shell: ROOM_SHELLS.mint,
        picks: Object.fromEntries(
          DAYS.slice(0, SCREENSHOT_DECORATION_COUNT).map((day) => [
            day.key,
            day.options[0].id,
          ]),
        ) as Picks,
        frameHue: 'teal',
      };
    }

    const style = ROOM_STYLES[index % ROOM_STYLES.length];

    return {
      key: `dev-hotel-floor-${floor}`,
      floor,
      shell: ROOM_SHELLS[style.shell],
      picks: Object.fromEntries(
        DAYS.map((day, dayIndex) => [
          day.key,
          day.options[(index + dayIndex) % day.options.length].id,
        ]),
      ) as Picks,
      frameHue: style.frameHue,
    };
  });
}
