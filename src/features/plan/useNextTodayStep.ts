import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../../app/navigation';
import {
  exerciseJourneyId,
  LESSON_JOURNEY_ID,
  MOOD_JOURNEY_ID,
  nextTodayJourneyId,
  type TodayJourneyId,
} from '../../components/home/journey/todayJourneyOrder';
import { useLessonDayUnit } from '../../hooks/dayUnits/useLessonDayUnit';
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
 * What "Start my plan" opens next: the check-in, today's lesson, or the next
 * exercise, whichever comes first in the order Home shows the day that is not
 * done yet. Null once all of it is, and while any of it is still loading — a
 * day read before its completions arrive looks unfinished, and the bar would
 * flash up on a day that is already over.
 */
export function useNextTodayStep({
  userId,
  gated,
  onGated,
  sourceScreen,
}: Input): (() => void) | null {
  const navigation = useNavigation<RootStackNavigationProp>();
  const todayLocalDate = useTodayLocalDate();
  const program = useTodayProgramDay(userId);
  const lesson = useLessonDayUnit(userId, false).units[0] ?? null;
  const mood = useMoodCheckInQuery(userId, todayLocalDate);
  const { startProgramActivity } = useStartDaily(sourceScreen, NO_DAILIES);

  if (program.isLoading || mood.isPending || program.day == null) return null;

  const exercises = program.day.activities;
  const rows: { id: TodayJourneyId; done: boolean }[] = [
    ...(mood.data?.available === true
      ? [{ id: MOOD_JOURNEY_ID, done: mood.data.checkIn != null }]
      : []),
    ...(lesson == null ? [] : [{ id: LESSON_JOURNEY_ID, done: lesson.completed }]),
    ...exercises.map((activity) => ({
      id: exerciseJourneyId(activity.slot),
      done: activity.completed,
    })),
  ];
  const nextId = nextTodayJourneyId(rows, todayJourneyOrderNow(userId));
  if (nextId == null) return null;
  if (gated) return onGated;
  if (nextId === MOOD_JOURNEY_ID) return () => navigation.navigate('MoodCheckIn');
  if (nextId === LESSON_JOURNEY_ID) return () => navigation.navigate('Lesson');

  const exercise = exercises.find((activity) => exerciseJourneyId(activity.slot) === nextId);
  if (exercise == null) return null;
  return () => startProgramActivity(exercise.activityId, START_ACTION);
}
