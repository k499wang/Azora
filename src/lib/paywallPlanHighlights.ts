import type { OnboardingIntent } from '../components/onboarding/types';

/** The short goal noun used in the personalized first-step headline. */
const INTENT_PLAN_NOUN: Record<OnboardingIntent, string> = {
  stress_relief: 'calm',
  calm_fast: 'calm',
  yoga: 'calm',
  daily_habit: 'calm',
  other: 'calm',
  emotional_balance: 'balance',
  self_acceptance: 'balance',
  self_care: 'balance',
  spiritual: 'balance',
  sleep: 'sleep',
  focus: 'focus',
  energy: 'energy',
  heart_health: 'heart health',
};

/**
 * The goal, named in the user's terms, for a headline built from their answers.
 * Falls back to the neutral `other` noun when onboarding produced no intent.
 */
export function planNounForIntent(intent?: OnboardingIntent): string {
  return INTENT_PLAN_NOUN[intent ?? 'other'];
}

/** A compact benefit label for the routine the user just configured. */
export function personalizedRoutineLabel(
  intent: OnboardingIntent | undefined,
  durationMinutes: number,
): string {
  const duration = Math.max(1, Math.round(durationMinutes));
  const goal = planNounForIntent(intent).replaceAll(' ', '-');
  return `${duration}-minute ${goal} routine`;
}
