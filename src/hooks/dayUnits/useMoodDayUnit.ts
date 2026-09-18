import { useMoodCheckInQuery } from '../../queries/mood/useMoodCheckInQuery';
import type { DayUnitSource } from './dayUnit';

/** The id the daily check-in carries wherever the day is counted. */
export const MOOD_CHECK_IN_UNIT_ID = 'mood';

/**
 * The check-in's row, which the plan asks for every day.
 *
 * It is a to-do on the plan, so it counts like one. The only day it is absent
 * is one where the backend explicitly cannot hold a check-in: a failed read
 * leaves it required and incomplete, because a build can ship ahead of its
 * migration, and a row nothing could ever complete would hand those users a day
 * that never finishes and a room that never unlocks.
 */
export function useMoodDayUnit(
  userId: string | null,
  todayLocalDate: string,
  forced: boolean,
): DayUnitSource {
  const moodQuery = useMoodCheckInQuery(userId, todayLocalDate);
  const mood = moodQuery.data ?? null;

  return {
    units:
      mood?.available === false
        ? []
        : [
            {
              kind: 'mood',
              id: MOOD_CHECK_IN_UNIT_ID,
              title: 'Mood Check-In',
              techniqueId: null,
              completed: forced || mood?.checkIn != null,
            },
          ],
    isLoading: userId != null && moodQuery.isPending,
    isSettling: moodQuery.isFetching,
  };
}
