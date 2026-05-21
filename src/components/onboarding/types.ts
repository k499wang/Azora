import type { IconName } from '../common/icons/Icon';

export type OnboardingStep =
  | 'intent'
  | 'intentReflection'
  | 'intentProjection'
  | 'name'
  | 'founderVideo'
  | 'greeting'
  | 'stress'
  | 'sleep'
  | 'agreement'
  | 'experience'
  | 'assessmentReflection'
  | 'lungCapacity'
  | 'age'
  | 'gender'
  | 'dailyTime'
  | 'baselineIntro'
  | 'baseline'
  | 'recommendation'
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
