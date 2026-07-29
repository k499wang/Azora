import type { IconName } from '../common/icons/Icon';

export type OnboardingStep =
  | 'intent'
  | 'intentReflection'
  | 'intentProjection'
  | 'brainScience'
  | 'breathPrimer'
  | 'name'
  | 'greeting'
  | 'acquisitionSource'
  | 'attPriming'
  | 'stress'
  | 'sleep'
  | 'heartWorry'
  | 'agreement'
  | 'experience'
  | 'assessmentReflection'
  | 'lungCapacity'
  | 'age'
  | 'gender'
  | 'consistency'
  | 'dailyTime'
  | 'baselineIntro'
  | 'baseline'
  | 'planIntro'
  | 'planLoading'
  | 'recommendedExercise'
  | 'founderNote'
  | 'scienceCredibility'
  | 'pact'
  | 'notifications'
  | 'paywall';

export interface OnboardingBreathHoldResult {
  holdSeconds: number;
  score: number;
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

export interface IntentOption {
  id: string;
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
