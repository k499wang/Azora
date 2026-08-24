import {
  isTechniqueId,
  type TechniqueId,
} from '../../features/exercise/guidedBreathing/techniqueCatalog';
import type { HomeStats } from '../../services/tracking/homeStatsService';

export function projectCompletedTechniqueId(
  current: TechniqueId[] | undefined,
  techniqueId: string,
): TechniqueId[] | undefined {
  if (current == null || !isTechniqueId(techniqueId)) return current;
  if (current.includes(techniqueId)) return current;

  return [...current, techniqueId];
}

interface BreathHoldHomeProjection {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  localDate: string;
  timezone: string;
  holdSeconds: number;
  avgBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
}

function canonicalHoldSeconds(value: number): number {
  return Math.max(0, Math.round(value));
}

function canonicalBpm(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  return rounded >= 20 && rounded <= 240 ? rounded : null;
}

/**
 * Project only fields made certain by a successful breath-hold RPC.
 * Counters on an existing activity row are deliberately preserved: a
 * concurrent post-write fetch may already include the new session, and a
 * blind increment would double-count it.
 */
export function projectBreathHoldHomeStats(
  current: HomeStats | undefined,
  completion: BreathHoldHomeProjection,
): HomeStats | undefined {
  if (current == null) return current;

  const holdSeconds = canonicalHoldSeconds(completion.holdSeconds);
  const activityIndex = current.dailyActivity.findIndex(
    (activity) => activity.activityDate === completion.localDate,
  );
  const dailyActivity = [...current.dailyActivity];

  if (activityIndex >= 0) {
    const activity = dailyActivity[activityIndex];
    dailyActivity[activityIndex] = {
      ...activity,
      timezone: completion.timezone,
      dailyBreathHoldCompleted: true,
      bestHoldSeconds: Math.max(activity.bestHoldSeconds ?? 0, holdSeconds),
      qualifiesForStreak: true,
    };
  } else {
    dailyActivity.unshift({
      activityDate: completion.localDate,
      timezone: completion.timezone,
      dailyBreathHoldCompleted: true,
      breathHoldCount: 1,
      bestHoldSeconds: holdSeconds,
      breathingSessionCount: 0,
      breathingSeconds: 0,
      heartRateCaptureCount: 0,
      qualifiesForStreak: true,
    });
  }

  const currentStartedAtMs = Date.parse(
    current.todayBreathHold?.startedAt ?? '',
  );
  const completionStartedAtMs = Date.parse(completion.startedAt);
  const completionIsLatest =
    current.todayBreathHold == null ||
    !Number.isFinite(currentStartedAtMs) ||
    !Number.isFinite(completionStartedAtMs) ||
    completionStartedAtMs >= currentStartedAtMs;
  const todayBreathHold = completionIsLatest
    ? {
        sessionId: completion.sessionId,
        startedAt: completion.startedAt,
        endedAt: completion.endedAt,
        localDate: completion.localDate,
        timezone: completion.timezone,
        holdSeconds,
        avgBpm: canonicalBpm(completion.avgBpm),
        minBpm: canonicalBpm(completion.minBpm),
        maxBpm: canonicalBpm(completion.maxBpm),
      }
    : current.todayBreathHold;

  return {
    ...current,
    todayBreathHold,
    dailyActivity,
    partialErrors: {
      ...current.partialErrors,
      todayBreathHold: false,
      dailyActivity: false,
    },
  };
}
