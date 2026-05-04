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
    accent: colors.error[500],
    title: 'Female',
  },
  {
    id: 'male',
    icon: 'sparkle',
    accent: colors.primary.blue600,
    title: 'Male',
  },
  {
    id: 'nonbinary',
    icon: 'sparkle',
    accent: colors.orange[500],
    title: 'Non-binary',
  },
  {
    id: 'prefer_not',
    icon: 'sparkle',
    accent: colors.text.tertiary,
    title: 'Prefer not to say',
  },
];
