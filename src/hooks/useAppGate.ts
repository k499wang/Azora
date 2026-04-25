import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useCompleteOnboardingMutation } from '../queries/profile/useCompleteOnboardingMutation';
import { useOnboardingStatusQuery } from '../queries/profile/useOnboardingStatusQuery';

type BootingGate = {
  status: 'booting';
};

type SignedOutGate = {
  status: 'signed_out';
};

type NeedsOnboardingGate = {
  status: 'needs_onboarding';
  completeOnboarding: () => Promise<void>;
};

type ReadyGate = {
  status: 'ready';
};

export type AppGate =
  | BootingGate
  | SignedOutGate
  | NeedsOnboardingGate
  | ReadyGate;

export function useAppGate(): AppGate {
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  const onboardingQuery = useOnboardingStatusQuery(user?.id ?? null);
  const completeOnboardingMutation = useCompleteOnboardingMutation(user?.id ?? null);

  const completeOnboarding = useCallback(async () => {
    await completeOnboardingMutation.mutateAsync();
  }, [completeOnboardingMutation]);

  if (authStatus === 'booting') {
    return { status: 'booting' };
  }

  if (authStatus === 'signed_out' || user == null) {
    return { status: 'signed_out' };
  }

  if (onboardingQuery.isLoading) {
    return { status: 'booting' };
  }

  if (onboardingQuery.data !== true) {
    return {
      status: 'needs_onboarding',
      completeOnboarding,
    };
  }

  return { status: 'ready' };
}
