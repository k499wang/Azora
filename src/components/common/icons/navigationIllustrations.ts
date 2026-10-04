import { HABIT_ILLUSTRATIONS } from './habitIllustrations';

/** Source artwork for the native tab bar's bundled PNGs. */
export const NAVIGATION_ILLUSTRATIONS = {
  home: HABIT_ILLUSTRATIONS.home,
  routine: HABIT_ILLUSTRATIONS.calendar,
  plan: '<rect x="5" y="5" width="30" height="32" rx="5" fill="#8FBAB0"/><rect x="9" y="9" width="22" height="24" rx="2" fill="#F5F0DC"/><path d="M13 28h14M13 22h14M13 16h14" fill="none" stroke="#DDDCC5" stroke-width="1.5"/><path d="m13 25 5-6 5 2 4-8" fill="none" stroke="#D59D49" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="27" cy="13" r="2.5" fill="#F4C75E"/>',
  explore: '<circle cx="20" cy="20" r="17" fill="#469FA9"/><circle cx="20" cy="19" r="15" fill="#86CDD0"/><circle cx="20" cy="19" r="11.5" fill="#F8EFD5"/><path d="m25 9-2 13-8 7 2-13Z" fill="#EA9279"/><path d="m17 16 6 6-8 7Z" fill="#83B3AF"/><circle cx="20" cy="19" r="2" fill="#FFF8E9"/><path d="M9 13a13 13 0 0 1 7-6" fill="none" stroke="#B9E7E4" stroke-width="2" stroke-linecap="round"/>',
  profile: HABIT_ILLUSTRATIONS.profile,
} as const;
