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
