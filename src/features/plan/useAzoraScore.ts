import { useMemo } from 'react';
import { useDailyActivityRangeQuery } from '../../queries/tracking/useDailyActivityRangeQuery';
import { useProgramEnrollmentQuery } from '../../queries/program/useProgramEnrollmentQuery';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import {
  AZORA_SCORE_WINDOW_DAYS,
  azoraScore,
  type AzoraScore,
} from './domain/azoraScore';

/**
 * This week's score, from the days the user actually did something.
 *
 * `daily_activity` is the source rather than the plan's own completions: it is
 * already written on every day anything happened, and it is what the streak
 * counts. A day the plan was kept and a day the streak was kept must be the
 * same day, or the plan screen and Home start disagreeing about the week.
 *
 * A window slightly longer than the score needs is read, because the rows are
 * only written on days with activity — the last seven *rows* can reach back a
 * month, and the query is keyed by row count, not by date.
 */
export function useAzoraScore(userId: string | null): {
  score: AzoraScore | null;
  isLoading: boolean;
} {
  const todayLocalDate = useTodayLocalDate();
  const activity = useDailyActivityRangeQuery(userId, AZORA_SCORE_WINDOW_DAYS);
  const enrollment = useProgramEnrollmentQuery(userId);

  const keptDates = useMemo(
    () =>
      (activity.data ?? [])
        .filter((day) => day.qualifiesForStreak)
        .map((day) => day.activityDate),
    [activity.data],
  );

  const score = useMemo(
    () =>
      azoraScore({
        todayLocalDate,
        keptDates,
        startedOn: enrollment.data?.enrolledOn ?? null,
      }),
    [todayLocalDate, keptDates, enrollment.data?.enrolledOn],
  );

  return {
    score,
    isLoading:
      userId != null && (activity.isPending || enrollment.isPending),
  };
}
