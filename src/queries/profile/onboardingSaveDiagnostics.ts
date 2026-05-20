import { buildNetworkFailureDiagnostics } from '../../services/debug/networkFailureDiagnostics';

type OnboardingSaveRequestType =
  | 'profiles.upsert'
  | 'onboarding-profile-mutation'
  | 'onboarding-seal-flow';

interface OnboardingSaveDiagnosticsInput {
  userId: string | null;
  elapsedMs: number;
  requestType: OnboardingSaveRequestType;
  retryAttempt: number;
  error: unknown;
}

export async function buildOnboardingSaveFailureDiagnostics({
  userId,
  elapsedMs,
  requestType,
  retryAttempt,
  error,
}: OnboardingSaveDiagnosticsInput) {
  return buildNetworkFailureDiagnostics({
    userId,
    elapsedMs,
    requestType,
    retryAttempt,
    error,
  });
}
