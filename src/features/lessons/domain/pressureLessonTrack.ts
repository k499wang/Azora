import type { OnboardingIntent } from '../../../components/onboarding/types';

export type PressureLessonTrack = 'stress' | 'overthinking' | 'anger';

export const PRESSURE_TRACK_PURPOSE: Record<PressureLessonTrack, string> = {
  stress: 'Practise a pause when demands pile up, then choose one manageable next step.',
  overthinking: 'Practise returning to the present when a worry repeats, then choose an available action.',
  anger: 'Practise pausing when irritation rises, then choose what to say or do.',
};

/** Choose once when starting a plan; saved lesson IDs own the running plan. */
export function pressureLessonTrackForIntent(
  intent: OnboardingIntent | null | undefined,
): PressureLessonTrack {
  if (intent === 'calm_fast') return 'overthinking';
  if (intent === 'emotional_balance') return 'anger';
  return 'stress';
}
