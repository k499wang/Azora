import type { Mood } from '../../../data/moods';
import type { OnboardingIntent } from '../../../components/onboarding/types';
import type { TechniqueId } from './techniqueCatalog';

export type { OnboardingIntent };

/**
 * Every "which exercise should we suggest here?" mapping in the app, in one
 * place. Each map is an exhaustive `Record` over its trigger ids, so adding a
 * new onboarding goal or mood chip fails to compile until it has an
 * exercise, and a mistyped exercise id is a type error rather than a
 * silent fall back to the first technique in the library.
 *
 * Stress- and HRV-driven suggestions are not here — those are ordered rules
 * rather than a lookup, and live in `src/lib/insights/recommendations.ts`.
 */

/** Used whenever no better signal is available about what to suggest. */
export const FALLBACK_TECHNIQUE_ID: TechniqueId = 'box';

/**
 * Sets `profiles.default_technique_id` at the end of onboarding and seeds the
 * user's day-one plan. Treat changes here as a product experiment rather than
 * a refactor — this is the first exercise a new user ever sees.
 */
export const INTENT_TECHNIQUE: Record<OnboardingIntent, TechniqueId> = {
  stress_relief: 'relaxing',
  calm_fast: 'relaxing',
  sleep: '478',
  focus: 'box',
  energy: 'box',
  self_acceptance: 'resonance',
  emotional_balance: 'extended-exhale',
  self_care: 'relaxing',
  spiritual: 'resonance',
  yoga: 'resonance',
  heart_health: 'resonance',
  cleaning: 'box',
  daily_habit: 'box',
  other: 'box',
};

/**
 * Mood chips on the home screen, and the tiles on Explore.
 *
 * A technique may answer more than one feeling — `box` steadies a foggy head
 * and a scattered one alike. Where it does, the two moods are kept on
 * different Explore shelves so the same photo never sits twice in one row.
 */
export const MOOD_TECHNIQUE: Record<Mood['id'], TechniqueId> = {
  stressed: 'extended-exhale',
  anxious: '478',
  overwhelmed: 'relaxing',
  overthinking: 'triangle',
  angry: 'sitali',
  restless: 'belly',
  panicky: 'coherent-6',
  tense: 'deep-box',
  lowMood: 'resonance',
  lowEnergy: 'wimhof',
  sleepless: 'sleep-descent',
  foggy: 'box',
  burntOut: 'extended-exhale',
  heavyHeart: 'relaxing',
  focus: 'box',
  morning: 'morning-charge',
  windDown: 'night-settle',
  midday: 'wimhof',
  preWorkout: 'bhastrika',
  bigMoment: 'triangle',
};

export function isOnboardingIntent(value: string): value is OnboardingIntent {
  return Object.prototype.hasOwnProperty.call(INTENT_TECHNIQUE, value);
}

/** Null when the intent is unrecognized, so callers can pick their own fallback. */
export function techniqueForIntent(
  intent: string | null | undefined,
): TechniqueId | null {
  if (intent == null || !isOnboardingIntent(intent)) return null;
  return INTENT_TECHNIQUE[intent];
}
