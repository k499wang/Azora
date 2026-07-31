import { useEffect, useMemo, useRef } from 'react';
import { useDailyPlanExercisesQuery } from '../../../../queries/dailyPlan/useDailyPlanExercisesQuery';
import { useUpdateDailyPlanExercisesMutation } from '../../../../queries/dailyPlan/useUpdateDailyPlanExercisesMutation';
import { useSavedOnboardingProfileQuery } from '../../../../queries/profile/useSavedOnboardingProfileQuery';
import {
  buildRebuiltSevenDayExercisePlan,
  isValidDailyPlanLocalDate,
  resolveDailyExerciseTechniqueId,
  shouldRebuildDailyPlanAsV2,
  type DailyPlanExercises,
  type DailyPlanTechniqueId,
} from '../domain/dailyExercisePlan';

interface UseDailyExercisePlanInput {
  userId: string | null;
  primaryTechniqueId: string | null | undefined;
  onboardingCompletedAt: string | null | undefined;
  todayLocalDate: string;
}

interface DailyExercisePlanResolution {
  plan: DailyPlanExercises | null;
  techniqueId: DailyPlanTechniqueId | null;
  isLoading: boolean;
}

function formatDeviceLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolvePlanStartDate(
  onboardingCompletedAt: string | null | undefined,
  todayLocalDate: string,
): string {
  if (isValidDailyPlanLocalDate(onboardingCompletedAt)) {
    return onboardingCompletedAt;
  }

  if (typeof onboardingCompletedAt === 'string') {
    const completedAt = new Date(onboardingCompletedAt);
    if (!Number.isNaN(completedAt.getTime())) {
      return formatDeviceLocalDate(completedAt);
    }
  }

  return todayLocalDate;
}

export function useDailyExercisePlan({
  userId,
  primaryTechniqueId,
  onboardingCompletedAt,
  todayLocalDate,
}: UseDailyExercisePlanInput): DailyExercisePlanResolution {
  const planQuery = useDailyPlanExercisesQuery(userId);
  const { mutate: persistPlan } = useUpdateDailyPlanExercisesMutation(userId);
  const attemptedPersistenceKeysRef = useRef(new Set<string>());
  const readResult = planQuery.data;
  const savedPlan = readResult?.status === 'available'
    ? readResult.plan
    : null;
  const needsRebuild =
    planQuery.isError ||
    (planQuery.isSuccess &&
      readResult != null &&
      shouldRebuildDailyPlanAsV2(readResult));
  // Only a rebuild needs the onboarding answers, so the assessment is not
  // fetched for the accounts that already store their growth area.
  const assessmentQuery = useSavedOnboardingProfileQuery(userId, needsRebuild);
  const assessmentSettled = assessmentQuery.isSuccess || assessmentQuery.isError;
  const primaryTechniqueResolved = primaryTechniqueId !== undefined;
  const onboardingDateResolved = onboardingCompletedAt !== undefined;
  const storedPlanLookupSettled = planQuery.isSuccess || planQuery.isError;

  const rebuiltPlan = useMemo(() => {
    if (
      userId == null ||
      primaryTechniqueId === undefined ||
      onboardingCompletedAt === undefined ||
      !needsRebuild ||
      !assessmentSettled
    ) {
      return null;
    }

    // A stored V1 plan keeps its own start date so upgrading its pool does not
    // restart the seven-day rotation on whatever day the upgrade lands.
    const startsOn = savedPlan != null
      ? savedPlan.startsOn
      : resolvePlanStartDate(onboardingCompletedAt, todayLocalDate);

    return buildRebuiltSevenDayExercisePlan({
      assessment: assessmentQuery.data,
      primaryTechniqueId,
      startsOn,
    });
  }, [
    assessmentQuery.data,
    assessmentSettled,
    needsRebuild,
    onboardingCompletedAt,
    primaryTechniqueId,
    savedPlan,
    todayLocalDate,
    userId,
  ]);

  const plan = primaryTechniqueResolved ? rebuiltPlan ?? savedPlan : null;
  const techniqueId = useMemo(
    () =>
      plan == null
        ? null
        : resolveDailyExerciseTechniqueId(
            plan,
            todayLocalDate,
            primaryTechniqueId,
          ),
    [plan, primaryTechniqueId, todayLocalDate],
  );

  useEffect(() => {
    // `undefined` means Profile is still loading. Wait so an older account's
    // persisted fallback starts on its actual local onboarding date.
    if (
      userId == null ||
      onboardingCompletedAt === undefined ||
      !planQuery.isSuccess ||
      readResult == null ||
      !shouldRebuildDailyPlanAsV2(readResult) ||
      rebuiltPlan == null
    ) {
      return;
    }

    const persistenceKey = `${userId}:${JSON.stringify(rebuiltPlan)}`;
    if (attemptedPersistenceKeysRef.current.has(persistenceKey)) return;

    attemptedPersistenceKeysRef.current.add(persistenceKey);
    persistPlan(rebuiltPlan);
  }, [
    rebuiltPlan,
    onboardingCompletedAt,
    planQuery.isSuccess,
    persistPlan,
    readResult,
    userId,
  ]);

  return {
    plan,
    techniqueId,
    isLoading:
      userId != null &&
      (!primaryTechniqueResolved ||
        !storedPlanLookupSettled ||
        (needsRebuild &&
          savedPlan == null &&
          (!onboardingDateResolved || !assessmentSettled))),
  };
}
