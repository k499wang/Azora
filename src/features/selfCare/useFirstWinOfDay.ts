import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useTodayProgramDay } from '../../hooks/useTodayProgramDay';
import { useMoodCheckInQuery } from '../../queries/mood/useMoodCheckInQuery';
import { useSelfCareGoalsQuery } from '../../queries/selfCare/useSelfCareGoalsQuery';
import { lessonActivityId } from '../lessons/domain/lessonActivity';
import { lessonForDay } from '../lessons/domain/lessonCatalogue';
import { useFirstWinOfDayStore } from './firstWinOfDayStore';

/**
 * Whether the win about to be recorded is today's first.
 *
 * `claim` answers true once per day, and only when every source has loaded and
 * none of them has a win yet — an unknown day never earns the popup. Call it
 * before the write, and `release` if the write fails. `withdraw` is for a
 * popup shown ahead of its write: a streak the server did not record is not
 * one to announce.
 */
export function useFirstWinOfDay(userId: string | null) {
  const todayLocalDate = useTodayLocalDate();
  const goals = useSelfCareGoalsQuery(userId, todayLocalDate);
  const mood = useMoodCheckInQuery(userId, todayLocalDate);
  const program = useTodayProgramDay(userId);
  const day = program.day;
  const lesson =
    day == null ? null : lessonForDay(day.enrollment.planId, day.programDay);

  const known = goals.isSuccess && mood.isSuccess && !program.isLoading;
  const wonToday =
    goals.data?.some((goal) => goal.completedToday) === true ||
    mood.data?.checkIn != null ||
    (lesson != null &&
      day?.completedActivityIds.includes(lessonActivityId(lesson.id)) === true);
  const dayKey = `${userId}:${todayLocalDate}`;

  return {
    claim: () => {
      const store = useFirstWinOfDayStore.getState();
      if (userId == null) return false;
      if (!store.forced && (!known || wonToday)) return false;
      return store.claim(dayKey);
    },
    release: () => useFirstWinOfDayStore.getState().release(dayKey),
    withdraw: () => {
      const store = useFirstWinOfDayStore.getState();
      store.release(dayKey);
      store.dismiss();
    },
  };
}
