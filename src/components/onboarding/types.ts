import type { IconName } from '../common/icons/Icon';

export type OnboardingStep =
  | 'intent'
  | 'intentReflection'
  | 'customIntent'
  | 'age'
  | 'gender'
  | 'dailyTime'
  | 'pact';

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
  reflectionHeadline: string;
  reflectionBody: string;
  valuePoints: IntentValuePoint[];
}
