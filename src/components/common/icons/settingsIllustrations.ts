import { HABIT_ILLUSTRATIONS } from './habitIllustrations';
import { TODO_ILLUSTRATIONS } from './todoIllustrations';
import { ONBOARDING_ILLUSTRATIONS } from './onboardingIllustrations';
import { ONBOARDING_CONTEXT_ILLUSTRATIONS } from './onboardingContextIllustrations';

/** Settings shares the app's sticker artwork and uses distinct device and privacy symbols. */
export const SETTINGS_ILLUSTRATIONS = {
  'bell-outline': HABIT_ILLUSTRATIONS.bell,
  'sound-effects': '<path d="M7 14h7l8-7q3-2 3 2v22q0 4-3 2l-8-7H7q-3 0-3-3v-6q0-3 3-3Z" fill="#3E8F93"/><path d="m15 16 7-6v20l-7-6Z" fill="#BDE0D8"/><rect x="7" y="17" width="5" height="6" rx="1.5" fill="#66B4AB"/><path d="M29 14q5 6 0 12" fill="none" stroke="#E8AF54" stroke-width="3" stroke-linecap="round"/><path d="M34 9q8 11 0 22" fill="none" stroke="#F7CF78" stroke-width="3" stroke-linecap="round"/>',
  vibrate: '<rect x="11" y="5" width="18" height="30" rx="5" fill="#3E8F93"/><rect x="14" y="9" width="12" height="19" rx="2" fill="#BDE0D8"/><path d="M18 8h4" stroke="#FFF1D7" stroke-width="1.5" stroke-linecap="round"/><circle cx="20" cy="31.5" r="1.5" fill="#FFF1D7"/><path d="M6 13q-5 7 0 14m28-14q5 7 0 14" fill="none" stroke="#3E8F93" stroke-width="2.5" stroke-linecap="round"/>',
  restore: '<rect x="9" y="15" width="22" height="21" rx="3" fill="#E8AF54"/><path d="M9 18h22v6H9Z" fill="#F7CF78"/><path d="M18 18h4v18h-4Z" fill="#FFF1D7"/><path d="M9 12a13 13 0 0 1 24 3" fill="none" stroke="#3E8F93" stroke-width="3" stroke-linecap="round"/><path d="m27 13 6 3 3-6" fill="none" stroke="#3E8F93" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  'heart-pulse': ONBOARDING_ILLUSTRATIONS['heart-pulse'],
  'email-outline': TODO_ILLUSTRATIONS['todo-mail'],
  'shield-lock-outline': '<path d="M20 3 34 9v11c0 8-6 13-14 17C12 33 6 28 6 20V9Z" fill="#3E8F93"/><path d="M20 7 30 11v9c0 6-4 10-10 13Z" fill="#66B4AB"/><path d="M15 18v-3a5 5 0 0 1 10 0v3" fill="none" stroke="#FFF1D7" stroke-width="3" stroke-linecap="round"/><rect x="12" y="17" width="16" height="12" rx="3" fill="#FFF1D7"/><circle cx="20" cy="22" r="2" fill="#3E8F93"/><path d="M20 23v2" stroke="#3E8F93" stroke-width="2" stroke-linecap="round"/>',
  'file-document-outline': ONBOARDING_CONTEXT_ILLUSTRATIONS['file-document-outline'],
} as const;
