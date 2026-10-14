import type {
  CompleteOnboardingInput,
  SavedOnboardingProfile,
} from '../services/profile/onboardingStatusService';

type BootingGate = { status: 'booting' };
type SignedOutGate = { status: 'signed_out' };
type ConnectionErrorGate = {
  status: 'connection_error';
  retry: () => Promise<void>;
};
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
  | ConnectionErrorGate
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
  shouldWaitForAutoCompleteOnboarding: boolean,
  autoCompleteFailedForUserId: string | null,
  saveOnboardingProfile: (input: CompleteOnboardingInput) => Promise<void>,
  completeOnboarding: () => Promise<void>,
  isSavingOnboardingProfile: boolean,
  retryConnection: () => Promise<void>,
): AppGate {
  if (authStatus === 'booting') {
    return { status: 'booting' };
  }

  if (authStatus === 'signed_out' || user == null) {
    return { status: 'signed_out' };
  }

  if (onboardingStatusQuery.data === undefined) {
    return onboardingStatusQuery.isError
      ? { status: 'connection_error', retry: retryConnection }
      : { status: 'booting' };
  }

  if (onboardingStatusQuery.data === true) {
    return { status: 'ready' };
  }

  if (savedOnboardingProfileQuery.data === undefined) {
    return savedOnboardingProfileQuery.isError
      ? { status: 'connection_error', retry: retryConnection }
      : { status: 'booting' };
  }

  if (
    savedOnboardingProfileQuery.data != null &&
    ((entitlementQuery.isPending && !isCompletingOnboarding) ||
      (shouldWaitForAutoCompleteOnboarding &&
        autoCompleteFailedForUserId !== user.id))
  ) {
    return { status: 'booting' };
  }

  return {
    status: 'needs_onboarding',
    savedOnboardingProfile: savedOnboardingProfileQuery.data,
    saveOnboardingProfile,
    completeOnboarding,
    isSavingOnboardingProfile,
    isCompletingOnboarding,
  };
}
