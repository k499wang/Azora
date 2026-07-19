import type { HeartRateLiveBpmProfile } from './heartRateManager';

export type LivePulseProfileId =
  | 'continuousMonitoring'
  | 'guidedBreathing'
  | 'dailyBreathHold';

type LivePulsePresentationFilter = 'standard' | 'breathExercise';
type LivePulseStartupPolicy = 'filteredValue' | 'qualifiedManagerSnapshot';
type LivePulsePublicationPolicy = 'interval' | 'freshManagerSnapshot';

export interface LivePulseProfile {
  readonly managerBpmProfile: HeartRateLiveBpmProfile;
  readonly presentationFilter: LivePulsePresentationFilter;
  readonly startupPolicy: LivePulseStartupPolicy;
  readonly publicationPolicy: LivePulsePublicationPolicy;
}

export const LIVE_PULSE_PROFILES = {
  continuousMonitoring: {
    managerBpmProfile: 'stable',
    presentationFilter: 'standard',
    startupPolicy: 'filteredValue',
    publicationPolicy: 'interval',
  },
  guidedBreathing: {
    managerBpmProfile: 'responsive',
    presentationFilter: 'breathExercise',
    startupPolicy: 'qualifiedManagerSnapshot',
    publicationPolicy: 'freshManagerSnapshot',
  },
  dailyBreathHold: {
    managerBpmProfile: 'responsive',
    presentationFilter: 'breathExercise',
    startupPolicy: 'qualifiedManagerSnapshot',
    publicationPolicy: 'freshManagerSnapshot',
  },
} as const satisfies Record<LivePulseProfileId, LivePulseProfile>;

export function getLivePulseProfile(id: LivePulseProfileId): LivePulseProfile {
  return LIVE_PULSE_PROFILES[id];
}
