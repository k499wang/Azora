import { lessonActivityId } from '../lessons/domain/lessonActivity';
import type { PathDayCompletion } from './domain/planPath';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useTodayProgramDay } from '../../hooks/useTodayProgramDay';
import { useMoodCheckInQuery } from '../../queries/mood/useMoodCheckInQuery';

/** What today's plan day has done so far, for the plan detail rows. */
export function usePathDayCompletion(userId: string | null): PathDayCompletion | undefined {
  const todayLocalDate = useTodayLocalDate();
  const program = useTodayProgramDay(userId);
  const mood = useMoodCheckInQuery(userId, todayLocalDate);

  const day = program.day;
  if (day == null) return undefined;

  const lesson = day.lesson ?? null;
  return {
    day: day.programDay,
    completedActivityIds: day.completedActivityIds,
    checkInCompleted: mood.data?.checkIn != null,
    lessonCompleted: lesson != null &&
      day.completedActivityIds.includes(lessonActivityId(lesson.id)),
  };
}
