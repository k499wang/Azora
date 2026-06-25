import type { IconName } from '../common/icons/Icon';

export type OnboardingStep =
  | 'intent'
  | 'intentReflection'
  | 'intentProjection'
  | 'name'
  | 'greeting'
  | 'attPriming'
  | 'stress'
  | 'mindRacing'
  | 'sleep'
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
  | 'recommendation'
  | 'recommendedExercise'
  | 'fiveMinutes'
  | 'founderNote'
  | 'scienceCredibility'
  | 'pact'
  | 'notifications'
  | 'paywall';

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
  reflectionHeadline: string;
  reflectionBody: string;
  valuePoints: IntentValuePoint[];
}
