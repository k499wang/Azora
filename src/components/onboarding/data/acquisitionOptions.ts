import { colors } from '../../../theme/colors';
import type { IconName } from '../../common/icons/Icon';

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
  icon: IconName;
  // Brand marks carry their own color; the two non-brand rows fall back to
  // palette tones so the list still reads as one set.
  accent: string;
  title: string;
}

export const ACQUISITION_SOURCE_OPTIONS: AcquisitionSourceOption[] = [
  {
    id: 'instagram',
    icon: 'instagram',
    accent: colors.channel.instagram,
    title: 'Instagram',
  },
  {
    id: 'tiktok',
    icon: 'tiktok',
    accent: colors.text.primary,
    title: 'TikTok',
  },
  {
    id: 'facebook',
    icon: 'facebook',
    accent: colors.channel.facebook,
    title: 'Facebook',
  },
  {
    id: 'reddit',
    icon: 'reddit',
    accent: colors.channel.reddit,
    title: 'Reddit',
  },
  {
    id: 'app_store_search',
    icon: 'appStore',
    accent: colors.channel.appStore,
    title: 'Searching the App Store',
  },
  {
    id: 'google_search',
    icon: 'google',
    accent: colors.text.primary,
    title: 'A Google search',
  },
  {
    id: 'friend_or_family',
    icon: 'profile',
    accent: colors.orange[500],
    title: 'A friend or family member',
  },
  {
    id: 'other',
    icon: 'sparkle',
    accent: colors.text.tertiary,
    title: 'Somewhere else',
  },
];
