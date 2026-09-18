import { useTodayLocalDate } from './useTodayLocalDate';
import { useDailiesForcedComplete } from './devDailiesOverride';
import { useTodayProgramDay } from './useTodayProgramDay';
import { useDailyExercisePlan } from '../features/exercise/guidedBreathing/hooks/useDailyExercisePlan';
import { useRecommendedTechnique } from '../features/exercise/guidedBreathing/hooks/useRecommendedTechnique';
import {
  getTechnique,
  type BreathingTechnique,
} from '../features/exercise/guidedBreathing/techniques';
import { resolveExerciseTitle } from '../features/exercise/guidedBreathing/exerciseTitles';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { useCompletedBreathingTechniqueIdsQuery } from '../queries/tracking/useCompletedBreathingTechniqueIdsQuery';
import { useMoodCheckInQuery } from '../queries/mood/useMoodCheckInQuery';

/**
 * One thing today asks of the user, whatever asked for it.
 *
 * A day used to be a fixed pair, which is why the count was a constant. The
 * plan authors its own days now — one exercise in week one and three by the
 * last — so the day is a list and its length is part of the day.
 */
export interface DailyUnit {
  /** Unique within the day: the plan's activity id, or the legacy slot. */
  id: string;
  /** What the row is called, in the words Home uses. */
  title: string;
  /** Null for anything a breathing session cannot prove, like the check-in. */
  techniqueId: string | null;
  completed: boolean;
}

/** The id the daily check-in carries wherever the day is counted. */
export const MOOD_CHECK_IN_UNIT_ID = 'mood';

export interface DailiesCompletion {
  todayLocalDate: string;
  /** Everything today asks for, in the order the day runs. */
  units: readonly DailyUnit[];
  dailiesDone: number;
  dailiesTotal: number;
  guidedTechnique: BreathingTechnique | null;
  guidedTechniqueLoading: boolean;
  handPickedTechnique: BreathingTechnique | null;
  handPickedTechniqueLoading: boolean;
  guidedCompleted: boolean;
  handPickedCompleted: boolean;
  allCompleted: boolean;
  isLoading: boolean;
  /**
   * True while the completion data is being refetched over data we already
   * have. `isLoading` cannot answer this — it only covers a first load — so a
   * screen opened right after finishing a session sees the *previous* counts
   * and reports itself ready. Anything that snapshots completion has to wait
   * for this to clear.
   */
  isSettling: boolean;
}

/**
 * Whether today's dailies are done, and what they are.
 *
 * Home renders these; the room's earn rule turns on `allCompleted`; the
 * post-session screens ask whether the session they just finished was the last
 * one. Resolving it in one place keeps those answers from drifting.
 *
 * The plan answers when there is one. It used to be asked only for the rows,
 * while the reward still counted the recommended technique and the old seven
 * day rotation — so a user could finish everything their plan asked for and
 * watch the day stay unfinished, because nothing counting it knew the plan
 * existed.
 *
 * `allCompleted` stays false until everything has settled — a reward that
 * appears and then retracts is worse than one that arrives a beat late.
 */
export function useDailiesCompletion(userId: string | null): DailiesCompletion {
  const todayLocalDate = useTodayLocalDate();
  // Dev lab only, and `useDailiesForcedComplete` returns false in release
  // builds. Applied to the units rather than to `allCompleted`, so every
  // surface that counts them agrees with the one that gates the reward.
  const forced = useDailiesForcedComplete();
  const profileQuery = useProfileQuery(userId);
  const recommended = useRecommendedTechnique(userId);
  const program = useTodayProgramDay(userId);
  const moodQuery = useMoodCheckInQuery(userId, todayLocalDate);
  const plan = useDailyExercisePlan({
    userId,
    primaryTechniqueId: recommended.isLoading
      ? undefined
      : recommended.technique?.id ?? null,
    onboardingCompletedAt:
      profileQuery.isSuccess && !profileQuery.isPlaceholderData
        ? profileQuery.data?.onboardingCompletedAt ?? null
        : undefined,
    todayLocalDate,
  });
  const completedTechniqueIdsQuery = useCompletedBreathingTechniqueIdsQuery(
    userId,
    todayLocalDate,
  );

  const guidedTechnique = recommended.technique;
  const handPickedTechnique = getTechnique(plan.techniqueId);
  const completedTechniqueIds = completedTechniqueIdsQuery.data ?? [];

  const guidedCompleted =
    forced ||
    (guidedTechnique != null &&
      completedTechniqueIds.includes(guidedTechnique.id));
  const handPickedCompleted =
    forced ||
    (handPickedTechnique != null &&
      completedTechniqueIds.includes(handPickedTechnique.id));

  // A plan whose day this build cannot draw a single activity of is no more use
  // to the reward than to Home, so both fall back to the same pair of rows.
  const programActivities = program.day?.activities ?? [];
  const units: DailyUnit[] =
    programActivities.length > 0
      ? programActivities.map((activity) => ({
          id: activity.activityId,
          title: resolveExerciseTitle(activity.technique),
          techniqueId: activity.technique.id,
          completed: forced || activity.completed,
        }))
      : [
          {
            id: 'guided',
            title: resolveExerciseTitle(guidedTechnique),
            techniqueId: guidedTechnique?.id ?? null,
            completed: guidedCompleted,
          },
          {
            id: 'handPicked',
            title: resolveExerciseTitle(handPickedTechnique),
            techniqueId: handPickedTechnique?.id ?? null,
            completed: handPickedCompleted,
          },
        ];

  /**
   * The check-in is a to-do on the plan, every day, so it counts like one.
   *
   * Omit it only when the backend explicitly cannot hold one. A failed read
   * leaves the check-in required and incomplete. A build can ship ahead of its
   * migration, and a unit nothing could ever complete would hand those users a
   * day that never finishes and a room that never unlocks.
   */
  const mood = moodQuery.data ?? null;
  if (mood?.available !== false) {
    units.push({
      id: MOOD_CHECK_IN_UNIT_ID,
      title: 'Check in',
      techniqueId: null,
      completed: forced || mood?.checkIn != null,
    });
  }

  const dailiesDone = units.filter((unit) => unit.completed).length;

  const isLoading =
    userId != null &&
    (program.isLoading ||
      moodQuery.isPending ||
      recommended.isLoading ||
      plan.isLoading ||
      completedTechniqueIdsQuery.isPending);

  return {
    todayLocalDate,
    units,
    dailiesDone,
    dailiesTotal: units.length,
    guidedTechnique,
    guidedTechniqueLoading: recommended.isLoading,
    handPickedTechnique,
    handPickedTechniqueLoading: plan.isLoading,
    guidedCompleted,
    handPickedCompleted,
    isSettling: completedTechniqueIdsQuery.isFetching || moodQuery.isFetching,
    allCompleted:
      !isLoading &&
      userId != null &&
      units.length > 0 &&
      dailiesDone === units.length,
    isLoading,
  };
}
