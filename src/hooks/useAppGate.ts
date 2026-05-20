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
import type {
  CompleteOnboardingInput,
  SavedOnboardingProfile,
} from '../services/profile/onboardingStatusService';

type BootingGate = { status: 'booting' };
type SignedOutGate = { status: 'signed_out' };
type NeedsOnboardingGate = {
  status: 'needs_onboarding';
  savedOnboardingProfile: SavedOnboardingProfile | null;
  saveOnboardingProfile: (input: CompleteOnboardingInput) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  isSavingOnboardingProfile: boolean;
  isCompletingOnboarding: boolean;
};
type ReadyGate = { status: 'ready' };

export type AppGate =
  | BootingGate
  | SignedOutGate
  | NeedsOnboardingGate
  | ReadyGate;

interface OnboardingStatusQueryLike {
  isPending: boolean;
  isError: boolean;
  data: boolean | undefined;
}

interface SavedOnboardingProfileQueryLike {
  isPending: boolean;
  isError: boolean;
  data: SavedOnboardingProfile | null | undefined;
}

interface EntitlementQueryLike {
  isPending: boolean;
  data?: { isPro: boolean } | null | undefined;
}

export function computeAppGate(
  authStatus: 'booting' | 'signed_out' | 'signed_in',
  user: { id: string } | null,
  onboardingStatusQuery: OnboardingStatusQueryLike,
  savedOnboardingProfileQuery: SavedOnboardingProfileQueryLike,
  entitlementQuery: EntitlementQueryLike,
  isCompletingOnboarding: boolean,
  autoCompleteFailedForUserId: string | null,
  saveOnboardingProfile: (input: CompleteOnboardingInput) => Promise<void>,
  completeOnboarding: () => Promise<void>,
  isSavingOnboardingProfile: boolean,
): AppGate {
  if (authStatus === 'booting') {
    return { status: 'booting' };
  }

  if (authStatus === 'signed_out' || user == null) {
    return { status: 'signed_out' };
  }

  if (onboardingStatusQuery.isPending) {
    return { status: 'booting' };
  }

  if (onboardingStatusQuery.isError || savedOnboardingProfileQuery.isError) {
    return { status: 'signed_out' };
  }

  if (onboardingStatusQuery.data !== true) {
    if (savedOnboardingProfileQuery.isPending) {
      return { status: 'booting' };
    }

    if (
      savedOnboardingProfileQuery.data != null &&
      (entitlementQuery.isPending ||
        (entitlementQuery.data?.isPro === true &&
          autoCompleteFailedForUserId !== user.id) ||
        isCompletingOnboarding)
    ) {
      return { status: 'booting' };
    }

    return {
      status: 'needs_onboarding',
      savedOnboardingProfile: savedOnboardingProfileQuery.data ?? null,
      saveOnboardingProfile,
      completeOnboarding,
      isSavingOnboardingProfile,
      isCompletingOnboarding,
    };
  }

  return { status: 'ready' };
}

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

  useEffect(() => {
    if (onboardingStatusQuery.isError || savedOnboardingProfileQuery.isError) {
      console.warn('[appGate] Onboarding query failed, signing out corrupted session');
      void useAuthStore.getState().signOut();
    }
  }, [onboardingStatusQuery.isError, savedOnboardingProfileQuery.isError]);

  useEffect(() => {
    if (
      onboardingStatusQuery.data === false &&
      savedOnboardingProfileQuery.data != null &&
      entitlementQuery.data?.isPro === true &&
      !isCompletingOnboarding &&
      userId != null &&
      autoCompleteAttemptedRef.current !== userId &&
      autoCompleteFailedForUserId !== userId
    ) {
      autoCompleteAttemptedRef.current = userId;
      void completeOnboarding().catch(() => {
        setAutoCompleteFailedForUserId(userId);
      });
    }
  }, [
    autoCompleteFailedForUserId,
    completeOnboarding,
    entitlementQuery.data?.isPro,
    isCompletingOnboarding,
    onboardingStatusQuery.data,
    savedOnboardingProfileQuery.data,
    userId,
  ]);

  return computeAppGate(
    authStatus,
    user,
    onboardingStatusQuery,
    savedOnboardingProfileQuery,
    entitlementQuery,
    isCompletingOnboarding,
    autoCompleteFailedForUserId,
    async (input) => {
      await saveOnboardingProfileMutation.mutateAsync(input);
    },
    () => completeOnboarding(),
    saveOnboardingProfileMutation.isPending,
  );
}
