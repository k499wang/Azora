import { getBreathHoldSummaryForDate } from '../tracking/breathHoldService';
import { getBreathingSessionsForDate } from '../tracking/breathingService';
import { getHeartRateSummariesForDate } from '../tracking/heartRateService';
import { getDecorationsEarnedOnDate } from '../room/roomService';
import type {
  BreathHoldSummary,
  BreathingSessionSummary,
  TodayHeartRateSummary,
} from '../tracking/types';
import type { RoomDecorationRow } from '../room/roomService';

/**
 * One day of the user's record, as History renders it.
 *
 * The assigned dailies are *not* part of this: `daily_plan_exercises` holds a
 * single current value, so a past day can only report what was finished, never
 * what was asked for. History shows the plan for today and the record for
 * every other day.
 */
export interface DayHistory {
  localDate: string;
  breathHold: BreathHoldSummary | null;
  heartRateSessions: TodayHeartRateSummary[];
  breathingSessions: BreathingSessionSummary[];
  earnedDecorations: RoomDecorationRow[];
  partialErrors: DayHistoryPartialErrors;
}

export interface DayHistoryPartialErrors {
  breathHold: boolean;
  heartRateSessions: boolean;
  breathingSessions: boolean;
  earnedDecorations: boolean;
}

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export async function getDayHistory(
  userId: string,
  localDate: string,
): Promise<DayHistory> {
  const [
    breathHoldResult,
    heartRateResult,
    breathingSessionsResult,
    decorationsResult,
  ] = await Promise.allSettled([
    getBreathHoldSummaryForDate(userId, localDate),
    getHeartRateSummariesForDate(userId, localDate),
    getBreathingSessionsForDate(userId, localDate),
    getDecorationsEarnedOnDate(userId, localDate),
  ]);

  return {
    localDate,
    breathHold: settled(breathHoldResult, null),
    heartRateSessions: settled(heartRateResult, []),
    breathingSessions: settled(breathingSessionsResult, []),
    earnedDecorations: settled(decorationsResult, []),
    partialErrors: {
      breathHold: breathHoldResult.status === 'rejected',
      heartRateSessions: heartRateResult.status === 'rejected',
      breathingSessions: breathingSessionsResult.status === 'rejected',
      earnedDecorations: decorationsResult.status === 'rejected',
    },
  };
}
