import { useTodayLocalDate } from './useTodayLocalDate';
import { useDailyExercisePlan } from '../features/exercise/guidedBreathing/hooks/useDailyExercisePlan';
import { useRecommendedTechnique } from '../features/exercise/guidedBreathing/hooks/useRecommendedTechnique';
import {
  getTechnique,
  type BreathingTechnique,
} from '../features/exercise/guidedBreathing/techniques';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { useCompletedBreathingTechniqueIdsQuery } from '../queries/tracking/useCompletedBreathingTechniqueIdsQuery';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';

/** guided, hand-picked, breath hold */
export const DAILIES_PER_DAY = 3;

export interface DailiesCompletion {
  todayLocalDate: string;
  guidedTechnique: BreathingTechnique | null;
  guidedTechniqueLoading: boolean;
  handPickedTechnique: BreathingTechnique | null;
  handPickedTechniqueLoading: boolean;
  guidedCompleted: boolean;
  handPickedCompleted: boolean;
  breathHoldCompleted: boolean;
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
 * Whether today's three dailies are done, plus the two techniques they point
 * at. Home renders these; the room's earn rule turns on `allCompleted`; the
 * post-session screens ask whether the session they just finished was the third
 * one. Resolving it in one place keeps those three answers from drifting.
 *
 * `allCompleted` stays false until everything has settled — a reward that
 * appears and then retracts is worse than one that arrives a beat late.
 */
export function useDailiesCompletion(userId: string | null): DailiesCompletion {
  const todayLocalDate = useTodayLocalDate();
  const profileQuery = useProfileQuery(userId);
  const recommended = useRecommendedTechnique(userId);
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
  const homeStatsQuery = useHomeStatsQuery(userId, todayLocalDate);

  const guidedTechnique = recommended.technique;
  const handPickedTechnique = getTechnique(plan.techniqueId);
  const completedTechniqueIds = completedTechniqueIdsQuery.data ?? [];
  const todayActivity = homeStatsQuery.data?.dailyActivity.find(
    (activity) => activity.activityDate === todayLocalDate,
  );

  const guidedCompleted =
    guidedTechnique != null && completedTechniqueIds.includes(guidedTechnique.id);
  const handPickedCompleted =
    handPickedTechnique != null &&
    completedTechniqueIds.includes(handPickedTechnique.id);
  const breathHoldCompleted = todayActivity?.dailyBreathHoldCompleted ?? false;

  const isLoading =
    userId != null &&
    (recommended.isLoading ||
      plan.isLoading ||
      completedTechniqueIdsQuery.isPending ||
      homeStatsQuery.isPending);

  return {
    todayLocalDate,
    guidedTechnique,
    guidedTechniqueLoading: recommended.isLoading,
    handPickedTechnique,
    handPickedTechniqueLoading: plan.isLoading,
    guidedCompleted,
    handPickedCompleted,
    breathHoldCompleted,
    isSettling:
      completedTechniqueIdsQuery.isFetching || homeStatsQuery.isFetching,
    allCompleted:
      !isLoading &&
      userId != null &&
      guidedCompleted &&
      handPickedCompleted &&
      breathHoldCompleted,
    isLoading,
  };
}
