export type BreathingSessionStartDecision =
  | { type: 'not_ready'; reason: 'preference_loading' | 'access_loading' }
  | { type: 'start_heart_rate_placement' }
  | {
      type: 'start_without_heart_rate';
      disableHeartRatePreference: boolean;
    };

interface ResolveBreathingSessionStartInput {
  heartRatePreferenceLoaded: boolean;
  heartRateMonitoringEnabled: boolean;
  heartRateAccessLoading: boolean;
  heartRateAccessAllowed: boolean;
}

export function resolveBreathingSessionStart({
  heartRatePreferenceLoaded,
  heartRateMonitoringEnabled,
  heartRateAccessLoading,
  heartRateAccessAllowed,
}: ResolveBreathingSessionStartInput): BreathingSessionStartDecision {
  if (!heartRatePreferenceLoaded) {
    return { type: 'not_ready', reason: 'preference_loading' };
  }
  if (!heartRateMonitoringEnabled) {
    return {
      type: 'start_without_heart_rate',
      disableHeartRatePreference: false,
    };
  }
  if (heartRateAccessLoading) {
    return { type: 'not_ready', reason: 'access_loading' };
  }
  if (heartRateAccessAllowed) {
    return { type: 'start_heart_rate_placement' };
  }
  return {
    type: 'start_without_heart_rate',
    disableHeartRatePreference: true,
  };
}
