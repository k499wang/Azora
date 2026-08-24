import { replaceEqualDeep } from '@tanstack/react-query';
import type { ProfileSummary } from '../../services/profile/profileSummaryService';

/** Keep the last good aggregate slice when one profile summary request fails. */
export function mergeProfileSummaryPartialResult(
  previous: ProfileSummary | undefined,
  incoming: ProfileSummary,
): ProfileSummary {
  if (previous == null) return incoming;

  const merged: ProfileSummary = {
    ...incoming,
    profile: incoming.partialErrors.profile
      ? previous.profile
      : incoming.profile,
    longestHoldSeconds: incoming.partialErrors.longestHold
      ? previous.longestHoldSeconds
      : incoming.longestHoldSeconds,
    breathHoldCount: incoming.partialErrors.breathHoldCount
      ? previous.breathHoldCount
      : incoming.breathHoldCount,
    totalSessions: incoming.partialErrors.lifetimeTotals
      ? previous.totalSessions
      : incoming.totalSessions,
    totalBreaths: incoming.partialErrors.lifetimeTotals
      ? previous.totalBreaths
      : incoming.totalBreaths,
    totalHoldSeconds: incoming.partialErrors.lifetimeTotals
      ? previous.totalHoldSeconds
      : incoming.totalHoldSeconds,
    activeDays: incoming.partialErrors.activeDays
      ? previous.activeDays
      : incoming.activeDays,
    currentStreak: incoming.partialErrors.streak
      ? previous.currentStreak
      : incoming.currentStreak,
    longestStreak: incoming.partialErrors.streak
      ? previous.longestStreak
      : incoming.longestStreak,
    completedDays: incoming.partialErrors.completedDays
      ? previous.completedDays
      : incoming.completedDays,
    completedDaysAgo: incoming.partialErrors.completedDays
      ? previous.completedDaysAgo
      : incoming.completedDaysAgo,
    breathHoldTrend: incoming.partialErrors.breathHoldTrend
      ? previous.breathHoldTrend
      : incoming.breathHoldTrend,
  };

  return replaceEqualDeep(previous, merged);
}
