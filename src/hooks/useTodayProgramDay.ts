import {
  PROGRAM_ACTIVITIES,
} from '../features/program/domain/programCatalogue';
import type { ProgramActivityDefinition } from '../features/program/domain/programActivity';
import type { AttentionScriptId } from '../features/attention/domain/attentionScripts';
import {
  programDayForDate,
  programDayLesson,
  programDayOnDate,
  type ProgramEnrollmentV3,
} from '../features/program/domain/programEnrollment';
import type { Lesson } from '../features/lessons/domain/lessonCatalogue';
import {
  PLAN_TODO_ACTIVITY_ID,
  programDayAsksForTodo,
} from '../features/program/domain/programTodoStep';
import { programSlotAt } from '../features/program/domain/programSchedule';
import {
  getTechnique,
  type BreathingTechnique,
} from '../features/exercise/guidedBreathing/techniques';
import { useTodayLocalDate } from './useTodayLocalDate';
import { useProgramEnrollmentQuery } from '../queries/program/useProgramEnrollmentQuery';
import { useProgramDayCompletionsQuery } from '../queries/program/useProgramDayCompletionsQuery';
import type { DailyPlanActionId } from '../services/dailyPlan/dailyPlanScheduleCore';

interface TodayProgramActivityBase {
  activityId: string;
  /** Which hour of the user's day this one takes. */
  slot: DailyPlanActionId;
  minutes: number;
  /** Why the day looks like this, authored per stretch of days. */
  why: string;
  completed: boolean;
}

export interface TodayBreathingActivity extends TodayProgramActivityBase {
  modality: 'breathing';
  technique: BreathingTechnique;
}

export interface TodayAttentionActivity extends TodayProgramActivityBase {
  modality: 'attention';
  scriptId: AttentionScriptId;
  title: string;
}

export type TodayProgramActivity = TodayBreathingActivity | TodayAttentionActivity;

type TodayActivityContent =
  | Pick<TodayBreathingActivity, 'modality' | 'technique' | 'minutes'>
  | Pick<TodayAttentionActivity, 'modality' | 'scriptId' | 'title' | 'minutes'>;

/**
 * What this build can draw of an activity, or null.
 *
 * An activity this build cannot draw is left out rather than drawn blank. The
 * snapshot outlives the build that wrote it.
 */
function todayActivityContent(
  activity: ProgramActivityDefinition,
): TodayActivityContent | null {
  const { delivery } = activity;
  switch (delivery.modality) {
    case 'breathing': {
      const technique = getTechnique(delivery.techniqueId);
      return technique == null
        ? null
        : { modality: 'breathing', technique, minutes: delivery.minutes };
    }
    case 'attention':
      return {
        modality: 'attention',
        scriptId: delivery.scriptId,
        title: activity.title,
        minutes: delivery.minutes,
      };
    // The day's lesson and check-in are their own rows, not plan activities.
    case 'reflection':
    case 'lesson':
      return null;
  }
}

export interface TodayProgramDay {
  enrollment: ProgramEnrollmentV3;
  programDay: number;
  activities: readonly TodayProgramActivity[];
  /**
   * How many activities the snapshot holds for today, drawable or not. Zero is
   * a day with no Reset, not a day this build failed to read.
   */
  resolvedActivityCount: number;
  /** The lesson today's snapshot asks for. See `programDayLesson`. */
  lesson: Lesson | null;
  /** Everything today asked for is behind them. */
  allCompleted: boolean;
  /** The "Do a to-do" step. Feeds `todoStepState`; see `programDayAsksForTodo`. */
  todoStep: { required: boolean; claimed: boolean };
  /**
   * Every completion recorded against this day, exercises and otherwise.
   *
   * The day's completions are one list on the server, and not everything in it
   * is an exercise — a lesson read lands here too, under its own prefix. Rows
   * this build cannot draw stay in it rather than being filtered out, so
   * something that knows what it is looking for can find it without a second
   * read of the same table.
   */
  completedActivityIds: readonly string[];
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
    const content = todayActivityContent(activity);
    if (content == null) return;

    activities.push({
      ...content,
      activityId: resolved.activityId,
      slot,
      why: today.why,
      completed: completed.includes(resolved.activityId),
    });
  });

  return {
    day: {
      enrollment,
      programDay: today.day,
      activities,
      resolvedActivityCount: today.activities.length,
      lesson: programDayLesson(enrollment, today.day),
      allCompleted:
        (activities.length > 0 || today.activities.length === 0) &&
        activities.every((activity) => activity.completed),
      completedActivityIds: completed,
      todoStep: {
        required: programDayAsksForTodo(enrollment, today.day),
        claimed: completed.includes(PLAN_TODO_ACTIVITY_ID),
      },
    },
    isLoading,
  };
}
