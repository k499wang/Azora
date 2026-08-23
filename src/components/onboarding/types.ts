import type { IconName } from '../common/icons/Icon';

export type OnboardingStep =
  | 'mochiIntro'
  | 'mochiMoved'
  | 'mochiNoTime'
  | 'mochiFresh'
  | 'personalizeIntro'
  | 'mochiPlace'
  | 'mochiFloor'
  | 'intent'
  | 'intentPriority'
  | 'intentReflection'
  | 'intentProjection'
  | 'brainScience'
  | 'modernBreathing'
  | 'breathPrimer'
  | 'name'
  | 'greeting'
  | 'acquisitionSource'
  | 'attPriming'
  | 'stress'
  | 'sleep'
  | 'brainFog'
  | 'heartWorry'
  | 'agreement'
  | 'experience'
  | 'assessmentReflection'
  | 'breathHoldBenefits'
  | 'lungCapacity'
  | 'age'
  | 'gender'
  | 'consistency'
  | 'dailyTime'
  | 'wakeTime'
  | 'sleepTime'
  | 'doctorReferral'
  | 'heartVariability'
  | 'baselineIntro'
  | 'baseline'
  | 'planIntro'
  | 'planLoading'
  | 'diagnosis'
  | 'recommendedExercise'
  | 'scienceCredibility'
  | 'pact'
  | 'notifications'
  | 'paywall';

export interface OnboardingBreathHoldResult {
  holdSeconds: number;
  score: number;
  lungAgeYears: number;
}

export interface OnboardingBaselineResult {
  completed: boolean;
  avgBpm: number | null;
  earlyBpm: number | null;
  lateBpm: number | null;
  bpmDrop: number | null;
  durationSec: number;
  bpmHistory: number[];
}

export interface CompletedOnboardingBaselineResult
  extends OnboardingBaselineResult {
  completed: true;
  avgBpm: number;
}

/**
 * The goals a user can pick during onboarding, and the single source of truth
 * for that set. Adding a goal here is what forces the rest of the app to
 * account for it — most importantly `INTENT_TECHNIQUE` in
 * `src/features/exercise/guidedBreathing/techniqueSelection.ts`, which will not
 * compile until the new goal has an exercise. Without that chain a new goal
 * silently falls through to the `other` default at runtime.
 */
export type OnboardingIntent =
  | 'stress_relief'
  | 'calm_fast'
  | 'sleep'
  | 'focus'
  | 'energy'
  | 'spiritual'
  | 'yoga'
  | 'heart_health'
  | 'daily_habit'
  | 'other';

export interface IntentOption {
  id: OnboardingIntent;
  icon: IconName;
  accent: string;
  title: string;
  body: string;
}

export interface IntentValuePoint {
  icon: IconName;
  accent: string;
  label: string;
}

export interface PersonalizedIntentOption extends IntentOption {
  hook: string;
  goalPhrase: string;
  assessmentPlan: string;
  reflectionHeadline: string;
  reflectionBody: string;
  valuePoints: IntentValuePoint[];
}
