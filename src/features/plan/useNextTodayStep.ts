import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../../app/navigation';
import {
  exerciseJourneyId,
  LESSON_JOURNEY_ID,
  MOOD_JOURNEY_ID,
  nextTodayJourneyId,
  TODO_STEP_JOURNEY_ID,
  type TodayJourneyId,
} from '../../components/home/journey/todayJourneyOrder';
import { lessonActivityId } from '../lessons/domain/lessonActivity';
import type { PathDayCompletion } from './domain/planPath';
import { useTodoStepAction } from './useTodoStepAction';
import { useRoomClaim } from '../room/useRoomClaim';
import { useStartDaily } from '../../hooks/useStartDaily';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useTodayProgramDay } from '../../hooks/useTodayProgramDay';
import { useMoodCheckInQuery } from '../../queries/mood/useMoodCheckInQuery';
import { todayJourneyOrderNow } from '../../services/preferences/todayJourneyOrder';

const NO_DAILIES = { guidedTechnique: null, handPickedTechnique: null };
const START_ACTION = 'plan_start_session';

interface Input {
  userId: string | null;
  /** today's items open the paywall instead, as they do on Home */
  gated: boolean;
  onGated: () => void;
  sourceScreen: string;
}

/**
 * What "Start my plan" opens next: the check-in, today's lesson, the next
 * exercise, or the to-do step, whichever comes first in the order Home shows
 * the day that is not done yet. The same completion data drives the plan
 * detail rows.
 * `startNext` is null once all of it is done, and while any of it is still loading — a
 * day read before its completions arrive looks unfinished, and the bar would
 * flash up on a day that is already over.
 */
export function useNextTodayStep({
  userId,
  gated,
  onGated,
  sourceScreen,
}: Input): { startNext: (() => void) | null; completion: PathDayCompletion | undefined } {
  const navigation = useNavigation<RootStackNavigationProp>();
  const todayLocalDate = useTodayLocalDate();
  const program = useTodayProgramDay(userId);
  const mood = useMoodCheckInQuery(userId, todayLocalDate);
  const { startProgramActivity } = useStartDaily(sourceScreen, NO_DAILIES);
  const roomClaim = useRoomClaim(userId);
  const todoStep = useTodoStepAction(userId, program, roomClaim);

  const day = program.day;
  const lesson = day?.lesson ?? null;
  const lessonCompleted = lesson != null &&
    day?.completedActivityIds.includes(lessonActivityId(lesson.id)) === true;
  const completion: PathDayCompletion | undefined = day == null ? undefined : {
    day: day.programDay,
    completedActivityIds: day.completedActivityIds,
    checkInCompleted: mood.data?.checkIn != null,
    lessonCompleted,
  };
  const result = (startNext: (() => void) | null) => ({ startNext, completion });

  if (program.isLoading || mood.isPending || todoStep.isLoading || day == null) {
    return result(null);
  }

  const exercises = day.activities;
  const rows: { id: TodayJourneyId; done: boolean }[] = [
    ...(mood.data?.available === true
      ? [{ id: MOOD_JOURNEY_ID, done: mood.data.checkIn != null }]
      : []),
    ...(lesson == null ? [] : [{ id: LESSON_JOURNEY_ID, done: lessonCompleted }]),
    ...exercises.map((activity) => ({
      id: exerciseJourneyId(activity.slot),
      done: activity.completed,
    })),
    ...(day.todoStep.required
      ? [{ id: TODO_STEP_JOURNEY_ID, done: day.todoStep.claimed }]
      : []),
  ];
  const nextId = nextTodayJourneyId(rows, todayJourneyOrderNow(userId));
  if (nextId == null) return result(null);
  if (gated) return result(onGated);
  if (nextId === MOOD_JOURNEY_ID) return result(() => navigation.navigate('MoodCheckIn'));
  if (nextId === LESSON_JOURNEY_ID) return result(() => navigation.navigate('Lesson'));
  if (nextId === TODO_STEP_JOURNEY_ID) return result(todoStep.run);

  const exercise = exercises.find((activity) => exerciseJourneyId(activity.slot) === nextId);
  if (exercise == null) return result(null);
  return result(() => startProgramActivity(exercise.activityId, START_ACTION));
}
