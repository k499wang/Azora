import type { IconName } from '../common/icons/Icon';

export type OnboardingStep = 'intent';

export interface IntentOption {
  id: string;
  icon: IconName;
  title: string;
  body: string;
}
