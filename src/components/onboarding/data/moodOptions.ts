import { colors } from '../../../theme/colors';
import type { OnboardingOptionIconName } from '../OnboardingOptionIcon';
import type { OnboardingMood } from '../types';

export interface MoodOption {
  id: OnboardingMood;
  icon: OnboardingOptionIconName;
  accent: string;
  title: string;
}

/** The four faces in the check-in after the first reset. */
export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'clearer',
    icon: 'emoticon-excited-outline',
    accent: colors.playful.sky.base,
    title: 'Great',
  },
  {
    id: 'calmer',
    icon: 'emoticon-happy-outline',
    accent: colors.playful.teal.base,
    title: 'Good',
  },
  {
    id: 'same',
    icon: 'emoticon-neutral-outline',
    accent: colors.playful.amber.base,
    title: 'Okay',
  },
  {
    id: 'restless',
    icon: 'emoticon-confused-outline',
    accent: colors.playful.coral.base,
    title: 'Bad',
  },
];
