import { colors } from '../../../theme/colors';
import type { IconName } from '../../common/icons/Icon';

export interface GenderOption {
  id: 'female' | 'male' | 'nonbinary' | 'prefer_not';
  icon: IconName;
  accent: string;
  title: string;
}

export const GENDER_OPTIONS: GenderOption[] = [
  {
    id: 'female',
    icon: 'sparkle',
    accent: colors.playful.blush.base,
    title: 'Female',
  },
  {
    id: 'male',
    icon: 'sparkle',
    accent: colors.playful.sky.base,
    title: 'Male',
  },
  {
    id: 'nonbinary',
    icon: 'sparkle',
    accent: colors.playful.violet.base,
    title: 'Non-binary',
  },
  {
    id: 'prefer_not',
    icon: 'sparkle',
    accent: colors.accent[600],
    title: 'Prefer not to say',
  },
];
