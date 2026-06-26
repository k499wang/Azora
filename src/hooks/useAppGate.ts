import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  useOnboardingStatusQuery,
} from '../queries/profile/useOnboardingStatusQuery';
import {
  useCompleteOnboardingMutation,
} from '../queries/profile/useCompleteOnboardingMutation';
import {
  useSaveOnboardingProfileMutation,
} from '../queries/profile/useSaveOnboardingProfileMutation';
import {
  useSavedOnboardingProfileQuery,
} from '../queries/profile/useSavedOnboardingProfileQuery';
import { useUserEntitlementQuery } from '../queries/subscriptions/useUserEntitlementQuery';
import { computeAppGate, type AppGate } from './appGateCore';

export type { AppGate };
export { computeAppGate };

export function useAppGate(): AppGate {
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const onboardingStatusQuery = useOnboardingStatusQuery(userId);
  const savedOnboardingProfileQuery = useSavedOnboardingProfileQuery(
    userId,
    onboardingStatusQuery.data === false,
  );
  const saveOnboardingProfileMutation = useSaveOnboardingProfileMutation(userId);
  const completeOnboardingMutation = useCompleteOnboardingMutation(userId);
  const completeOnboarding = completeOnboardingMutation.mutateAsync;
  const isCompletingOnboarding = completeOnboardingMutation.isPending;
  const entitlementQuery = useUserEntitlementQuery(userId);
  const autoCompleteAttemptedRef = useRef<string | null>(null);
  const [autoCompleteFailedForUserId, setAutoCompleteFailedForUserId] =
    useState<string | null>(null);
  const [isAutoCompletingOnboarding, setIsAutoCompletingOnboarding] =
    useState(false);
  const shouldStartAutoCompleteOnboarding =
    onboardingStatusQuery.data === false &&
    savedOnboardingProfileQuery.data != null &&
    entitlementQuery.data?.isPro === true &&
    !isCompletingOnboarding &&
    userId != null &&
    autoCompleteAttemptedRef.current !== userId &&
    autoCompleteFailedForUserId !== userId;
  const shouldWaitForAutoCompleteOnboarding =
    shouldStartAutoCompleteOnboarding || isAutoCompletingOnboarding;

  useEffect(() => {
    if (onboardingStatusQuery.isError || savedOnboardingProfileQuery.isError) {
      console.warn('[appGate] Onboarding query failed, signing out corrupted session');
      void useAuthStore.getState().signOut();
    }
  }, [onboardingStatusQuery.isError, savedOnboardingProfileQuery.isError]);

  useEffect(() => {
    if (!shouldStartAutoCompleteOnboarding || userId == null) {
      return;
    }

    autoCompleteAttemptedRef.current = userId;
    setIsAutoCompletingOnboarding(true);
    void completeOnboarding()
      .catch(() => {
        setAutoCompleteFailedForUserId(userId);
      })
      .finally(() => {
        setIsAutoCompletingOnboarding(false);
      });
  }, [
    completeOnboarding,
    shouldStartAutoCompleteOnboarding,
    userId,
  ]);

  return computeAppGate(
    authStatus,
    user,
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    isCompletingOnboarding,
    shouldWaitForAutoCompleteOnboarding,
    autoCompleteFailedForUserId,
    async (input) => {
      await saveOnboardingProfileMutation.mutateAsync(input);
    },
    () => completeOnboarding(),
    saveOnboardingProfileMutation.isPending,
  );
}
