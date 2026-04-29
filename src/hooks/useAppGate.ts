import { useAuthStore } from '../stores/authStore';
import {
  useOnboardingStatusQuery,
} from '../queries/profile/useOnboardingStatusQuery';
import {
  useCompleteOnboardingMutation,
} from '../queries/profile/useCompleteOnboardingMutation';
import type { CompleteOnboardingInput } from '../services/profile/onboardingStatusService';

type BootingGate = { status: 'booting' };
type SignedOutGate = { status: 'signed_out' };
type NeedsOnboardingGate = {
  status: 'needs_onboarding';
  completeOnboarding: (input?: CompleteOnboardingInput) => Promise<void>;
  isCompletingOnboarding: boolean;
};
type ReadyGate = { status: 'ready' };

export type AppGate =
  | BootingGate
  | SignedOutGate
  | NeedsOnboardingGate
  | ReadyGate;

export function useAppGate(): AppGate {
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const onboardingStatusQuery = useOnboardingStatusQuery(userId);
  const completeOnboardingMutation = useCompleteOnboardingMutation(userId);

  if (authStatus === 'booting') {
    return { status: 'booting' };
  }

  if (authStatus === 'signed_out' || user == null) {
    return { status: 'signed_out' };
  }

  if (onboardingStatusQuery.isPending) {
    return { status: 'booting' };
  }

  if (onboardingStatusQuery.data !== true) {
    return {
      status: 'needs_onboarding',
      completeOnboarding: (input) => completeOnboardingMutation.mutateAsync(input),
      isCompletingOnboarding: completeOnboardingMutation.isPending,
    };
  }

  return { status: 'ready' };
}
