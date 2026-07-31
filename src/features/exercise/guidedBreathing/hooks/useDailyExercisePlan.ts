import { useEffect, useMemo, useRef } from 'react';
import { useDailyPlanExercisesQuery } from '../../../../queries/dailyPlan/useDailyPlanExercisesQuery';
import { useUpdateDailyPlanExercisesMutation } from '../../../../queries/dailyPlan/useUpdateDailyPlanExercisesMutation';
import {
  buildSevenDayExercisePlan,
  isValidDailyPlanLocalDate,
  resolveDailyExerciseTechniqueId,
  shouldRepairLegacyDailyPlan,
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
  const shouldUseLegacyFallback =
    planQuery.isError ||
    (planQuery.isSuccess &&
      readResult != null &&
      shouldRepairLegacyDailyPlan(readResult));
  const primaryTechniqueResolved = primaryTechniqueId !== undefined;
  const onboardingDateResolved = onboardingCompletedAt !== undefined;
  const storedPlanLookupSettled = planQuery.isSuccess || planQuery.isError;

  const fallbackPlan = useMemo(() => {
    if (
      userId == null ||
      primaryTechniqueId === undefined ||
      onboardingCompletedAt === undefined ||
      !shouldUseLegacyFallback ||
      savedPlan != null
    ) {
      return null;
    }

    return buildSevenDayExercisePlan({
      userId,
      primaryTechniqueId,
      startsOn: resolvePlanStartDate(onboardingCompletedAt, todayLocalDate),
    });
  }, [
    onboardingCompletedAt,
    primaryTechniqueId,
    savedPlan,
    shouldUseLegacyFallback,
    todayLocalDate,
    userId,
  ]);

  const plan = primaryTechniqueResolved ? savedPlan ?? fallbackPlan : null;
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
      !shouldRepairLegacyDailyPlan(readResult) ||
      fallbackPlan == null
    ) {
      return;
    }

    const persistenceKey = `${userId}:${JSON.stringify(fallbackPlan)}`;
    if (attemptedPersistenceKeysRef.current.has(persistenceKey)) return;

    attemptedPersistenceKeysRef.current.add(persistenceKey);
    persistPlan(fallbackPlan);
  }, [
    fallbackPlan,
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
        (shouldUseLegacyFallback && !onboardingDateResolved)),
  };
}
