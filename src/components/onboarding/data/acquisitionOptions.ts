import { colors } from '../../../theme/colors';

export type AcquisitionSourceId =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'reddit'
  | 'app_store_search'
  | 'google_search'
  | 'friend_or_family'
  | 'other';

export interface AcquisitionSourceOption {
  id: AcquisitionSourceId;
  title: string;
  accent: string;
}

export const ACQUISITION_SOURCE_OPTIONS: AcquisitionSourceOption[] = [
  {
    id: 'instagram',
    accent: colors.playful.blush.base,
    title: 'Instagram',
  },
  {
    id: 'tiktok',
    accent: colors.neutral[800],
    title: 'TikTok',
  },
  {
    id: 'facebook',
    accent: colors.playful.sky.base,
    title: 'Facebook',
  },
  {
    id: 'reddit',
    accent: colors.playful.coral.base,
    title: 'Reddit',
  },
  {
    id: 'app_store_search',
    accent: colors.playful.violet.base,
    title: 'Searching the App Store',
  },
  {
    id: 'google_search',
    accent: colors.playful.amber.base,
    title: 'A Google search',
  },
  {
    id: 'friend_or_family',
    accent: colors.playful.teal.base,
    title: 'A friend or family member',
  },
  {
    id: 'other',
    accent: colors.accent[600],
    title: 'Somewhere else',
  },
];
