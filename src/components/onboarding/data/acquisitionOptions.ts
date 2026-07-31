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
}

export const ACQUISITION_SOURCE_OPTIONS: AcquisitionSourceOption[] = [
  {
    id: 'instagram',
    title: 'Instagram',
  },
  {
    id: 'tiktok',
    title: 'TikTok',
  },
  {
    id: 'facebook',
    title: 'Facebook',
  },
  {
    id: 'reddit',
    title: 'Reddit',
  },
  {
    id: 'app_store_search',
    title: 'Searching the App Store',
  },
  {
    id: 'google_search',
    title: 'A Google search',
  },
  {
    id: 'friend_or_family',
    title: 'A friend or family member',
  },
  {
    id: 'other',
    title: 'Somewhere else',
  },
];
