import {
  lessonForDay,
  lessonRowTitle,
} from '../../features/lessons/domain/lessonCatalogue';
import { lessonActivityId } from '../../features/lessons/domain/lessonActivity';
import { useTodayProgramDay } from '../useTodayProgramDay';
import type { DayUnitSource } from './dayUnit';

/**
 * Today's lesson, on the days that have one.
 *
 * One a day, every day of the plan, so this returns a unit for anybody with an
 * enrollment and nothing for anybody without one. It still returns nothing past
 * the last day of a plan, which is the case the empty list is really for.
 *
 * It reads nothing of its own. Which plan and which day come from the
 * enrollment Home already has, the lesson itself is a lookup in a list shipped
 * with the build, and whether it was read is in the day's completions — the
 * same list the exercises are counted from, because a lesson read is a
 * completion like any other and is stored as one.
 */
export function useLessonDayUnit(
  userId: string | null,
  forced: boolean,
): DayUnitSource {
  const program = useTodayProgramDay(userId);
  const day = program.day;
  const lesson =
    day == null ? null : lessonForDay(day.enrollment.planId, day.programDay);

  return {
    units:
      lesson == null
        ? []
        : [
            {
              kind: 'lesson',
              id: lessonActivityId(lesson.id),
              // What kind of tip is inside, which is what decides whether it
              // is worth opening today. The lesson's own title is the claim,
              // and it belongs to the lesson's first page.
              title: lessonRowTitle(lesson.id),
              techniqueId: null,
              completed:
                forced ||
                day?.completedActivityIds.includes(lessonActivityId(lesson.id)) ===
                  true,
            },
          ],
    // A day whose lesson is still loading has an unknown length, the same as one
    // whose exercises are. Without a plan there is never a lesson, so there is
    // nothing here to wait for either.
    isLoading: program.isLoading,
    isSettling: false,
  };
}
