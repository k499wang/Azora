import {
  PROGRAM_ACTIVITIES,
} from '../features/program/domain/programCatalogue';
import {
  programDayForDate,
  programDayOnDate,
  type ProgramEnrollmentV3,
} from '../features/program/domain/programEnrollment';
import { programSlotAt } from '../features/program/domain/programSchedule';
import {
  getTechnique,
  type BreathingTechnique,
} from '../features/exercise/guidedBreathing/techniques';
import { useTodayLocalDate } from './useTodayLocalDate';
import { useProgramEnrollmentQuery } from '../queries/program/useProgramEnrollmentQuery';
import { useProgramDayCompletionsQuery } from '../queries/program/useProgramDayCompletionsQuery';
import type { DailyPlanActionId } from '../services/dailyPlan/dailyPlanScheduleCore';

export interface TodayProgramActivity {
  activityId: string;
  /** Which hour of the user's day this one takes. */
  slot: DailyPlanActionId;
  technique: BreathingTechnique;
  minutes: number;
  /** Why the day looks like this, authored per stretch of days. */
  why: string;
  completed: boolean;
}

export interface TodayProgramDay {
  enrollment: ProgramEnrollmentV3;
  programDay: number;
  activities: readonly TodayProgramActivity[];
  /** Everything today asked for is behind them. */
  allCompleted: boolean;
}

export interface TodayProgramDayState {
  /** Null when this user has no plan, which is an ordinary state. */
  day: TodayProgramDay | null;
  isLoading: boolean;
}

/**
 * Today's day of the plan, ready to draw.
 *
 * A day holds one exercise in the first week and three by the last, so this
 * returns a list rather than a fixed pair. Each one takes the hour of its
 * position — first the main session hour, then midday, then the wind-down — so
 * Home can place them among the to-dos exactly the way it always has.
 *
 * Null means no plan: an account from before plans existed, or a backend
 * without the tables. Home falls back to what it drew before rather than
 * showing an empty list.
 */
export function useTodayProgramDay(userId: string | null): TodayProgramDayState {
  const todayLocalDate = useTodayLocalDate();
  const enrollmentQuery = useProgramEnrollmentQuery(userId);
  const enrollment = enrollmentQuery.data ?? null;
  // The day on screen, which is the day just finished until midnight rather
  // than the day the plan will resume on. See `programDayForDate`.
  const shownDay =
    enrollment == null
      ? null
      : programDayForDate(enrollment, todayLocalDate);
  const completionsQuery = useProgramDayCompletionsQuery(
    userId,
    enrollment?.enrollmentId ?? null,
    shownDay,
  );

  const isLoading =
    userId != null &&
    (enrollmentQuery.isPending ||
      (enrollment != null && completionsQuery.isPending));

  if (enrollment == null) return { day: null, isLoading };

  const today = programDayOnDate(enrollment, todayLocalDate);
  if (today == null) return { day: null, isLoading };

  const completed = completionsQuery.data ?? [];
  const activities: TodayProgramActivity[] = [];

  today.activities.forEach((resolved, position) => {
    const activity = PROGRAM_ACTIVITIES.get(resolved.activityId);
    const slot = programSlotAt(position);
    if (activity == null || slot == null) return;
    if (activity.delivery.modality !== 'breathing') return;

    const technique = getTechnique(activity.delivery.techniqueId);
    // An activity this build cannot draw is left out rather than drawn blank.
    // The snapshot outlives the build that wrote it.
    if (technique == null) return;

    activities.push({
      activityId: resolved.activityId,
      slot,
      technique,
      minutes: activity.delivery.minutes,
      why: today.why,
      completed: completed.includes(resolved.activityId),
    });
  });

  return {
    day: {
      enrollment,
      programDay: today.day,
      activities,
      allCompleted:
        activities.length > 0 &&
        activities.every((activity) => activity.completed),
    },
    isLoading,
  };
}
