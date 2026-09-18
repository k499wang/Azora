import { useProfileQuery } from '../../queries/profile/useProfileQuery';
import { useCompletedBreathingTechniqueIdsQuery } from '../../queries/tracking/useCompletedBreathingTechniqueIdsQuery';
import { useDailyExercisePlan } from '../../features/exercise/guidedBreathing/hooks/useDailyExercisePlan';
import { useRecommendedTechnique } from '../../features/exercise/guidedBreathing/hooks/useRecommendedTechnique';
import {
  getTechnique,
  type BreathingTechnique,
} from '../../features/exercise/guidedBreathing/techniques';
import { resolveExerciseTitle } from '../../features/exercise/guidedBreathing/exerciseTitles';
import { useTodayProgramDay } from '../useTodayProgramDay';
import type { DayUnit, DayUnitSource } from './dayUnit';

/**
 * The exercises today asks for.
 *
 * The plan answers when there is one: one activity in its first week, three by
 * its last, each already carrying whether it was done. The pair below is the
 * fallback for a user with no enrollment, or with one whose day this build
 * cannot draw a single activity of — Home and the reward fall back together, so
 * they cannot disagree about what the day was.
 */
export interface ExerciseDayUnits extends DayUnitSource {
  guidedTechnique: BreathingTechnique | null;
  guidedTechniqueLoading: boolean;
  handPickedTechnique: BreathingTechnique | null;
  handPickedTechniqueLoading: boolean;
  guidedCompleted: boolean;
  handPickedCompleted: boolean;
}

export function useExerciseDayUnits(
  userId: string | null,
  todayLocalDate: string,
  forced: boolean,
): ExerciseDayUnits {
  const profileQuery = useProfileQuery(userId);
  const recommended = useRecommendedTechnique(userId);
  const program = useTodayProgramDay(userId);
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

  const programActivities = program.day?.activities ?? [];
  const units: DayUnit[] =
    programActivities.length > 0
      ? programActivities.map((activity) => ({
          kind: 'exercise',
          id: activity.activityId,
          title: resolveExerciseTitle(activity.technique),
          techniqueId: activity.technique.id,
          completed: forced || activity.completed,
        }))
      : [
          {
            kind: 'exercise',
            id: 'guided',
            title: resolveExerciseTitle(guidedTechnique),
            techniqueId: guidedTechnique?.id ?? null,
            completed: guidedCompleted,
          },
          {
            kind: 'exercise',
            id: 'handPicked',
            title: resolveExerciseTitle(handPickedTechnique),
            techniqueId: handPickedTechnique?.id ?? null,
            completed: handPickedCompleted,
          },
        ];

  return {
    units,
    isLoading:
      userId != null &&
      (program.isLoading ||
        recommended.isLoading ||
        plan.isLoading ||
        completedTechniqueIdsQuery.isPending),
    isSettling: completedTechniqueIdsQuery.isFetching,
    guidedTechnique,
    guidedTechniqueLoading: recommended.isLoading,
    handPickedTechnique,
    handPickedTechniqueLoading: plan.isLoading,
    guidedCompleted,
    handPickedCompleted,
  };
}
