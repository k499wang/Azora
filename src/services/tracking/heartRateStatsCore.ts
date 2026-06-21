import { buildHrvStats, buildStressHistory } from './homeStatsCore';
import type { HomeHrvStats } from './homeStatsCore';
import type {
  HeartRateIbiPoint,
  TodayHeartRateSummary,
} from './types';
import type { StressHistoryEntry } from '../../lib/heartRate/stress';

export type HrSourcePick =
  | { kind: 'today_full'; session: TodayHeartRateSummary; ageDays: 0 }
  | { kind: 'recent_full'; session: TodayHeartRateSummary; ageDays: number }
  | { kind: 'no_recent_full'; session: null; ageDays: number };

export interface HeartRateStats {
  hrvSource: HrSourcePick;
  recent: TodayHeartRateSummary[];
  stressHistory: StressHistoryEntry[];
  ibiSeries: HeartRateIbiPoint[];
  hrv: HomeHrvStats;
  partialErrors: HeartRateStatsPartialErrors;
}

export interface HeartRateStatsPartialErrors {
  recent: boolean;
  stressHistory: boolean;
  ibiSeries: boolean;
}

export interface HeartRateStatsDependencies {
  getRecentHeartRateSummaries: (
    userId: string,
    limit: number,
  ) => Promise<TodayHeartRateSummary[]>;
  getHeartRateIbiSeriesForSession: (
    userId: string,
    sessionId: string,
  ) => Promise<HeartRateIbiPoint[]>;
}

const HRV_FALLBACK_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function getSettledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

function localDateUtcMs(localDate: string): number {
  const [year, month, day] = localDate.split('-').map(Number);
  return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
}

/** Select the full capture that consistently drives every Heart-tab chart. */
export function pickHrSource(
  fullHistory: TodayHeartRateSummary[],
  todayLocalDate: string,
  nowMs: number = Date.now(),
): HrSourcePick {
  const todayFull = fullHistory.find(
    (session) => session.localDate === todayLocalDate,
  );
  if (todayFull) {
    return { kind: 'today_full', session: todayFull, ageDays: 0 };
  }

  const todayMs = localDateUtcMs(todayLocalDate);
  const cutoffMs = todayMs - HRV_FALLBACK_DAYS * DAY_MS;
  const recentFull = fullHistory.find((session) => {
    const startedMs = Date.parse(session.startedAt);
    const sessionDateMs = localDateUtcMs(session.localDate);
    return (
      Number.isFinite(startedMs) &&
      startedMs <= nowMs &&
      sessionDateMs >= cutoffMs &&
      sessionDateMs < todayMs
    );
  });

  if (recentFull) {
    const sessionDateMs = localDateUtcMs(recentFull.localDate);
    return {
      kind: 'recent_full',
      session: recentFull,
      ageDays: Math.max(1, Math.round((todayMs - sessionDateMs) / DAY_MS)),
    };
  }

  return {
    kind: 'no_recent_full',
    session: null,
    ageDays: HRV_FALLBACK_DAYS,
  };
}

export async function getHeartRateStatsCore(
  userId: string,
  todayLocalDate: string,
  dependencies: HeartRateStatsDependencies,
): Promise<HeartRateStats> {
  const [recentResult, historyResult] = await Promise.allSettled([
    dependencies.getRecentHeartRateSummaries(userId, 3),
    dependencies.getRecentHeartRateSummaries(userId, 15),
  ]);

  const recent = getSettledValue(recentResult, []);
  const history = getSettledValue(
    historyResult,
    [] as TodayHeartRateSummary[],
  );
  const fullHistory = history.filter((session) => session.mode === 'full');
  const hrvSource = pickHrSource(fullHistory, todayLocalDate);
  const canonicalSession = hrvSource.session;
  const stressHistory = buildStressHistory(fullHistory);
  const hrv = buildHrvStats(canonicalSession, fullHistory);

  const [ibiResult] = await Promise.allSettled([
    canonicalSession == null
      ? Promise.resolve([] as HeartRateIbiPoint[])
      : dependencies.getHeartRateIbiSeriesForSession(
          userId,
          canonicalSession.sessionId,
        ),
  ]);

  return {
    hrvSource,
    recent,
    stressHistory,
    ibiSeries: getSettledValue(ibiResult, []),
    hrv,
    partialErrors: {
      recent: recentResult.status === 'rejected',
      stressHistory: historyResult.status === 'rejected',
      ibiSeries: ibiResult.status === 'rejected',
    },
  };
}
