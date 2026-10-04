import { HABIT_ILLUSTRATIONS } from './habitIllustrations';
import { ONBOARDING_ILLUSTRATIONS } from './onboardingIllustrations';
import { ONBOARDING_CONTEXT_ILLUSTRATIONS } from './onboardingContextIllustrations';

// Original metric and status artwork on the shared 40 × 40 sticker canvas.
export const HEART_RATE_ILLUSTRATIONS = {
  'stat-heart-rate-graph': '<rect x="3" y="7" width="34" height="28" rx="6" fill="#8CB7C8"/><rect x="3" y="5" width="34" height="27" rx="6" fill="#E0EFF1"/><path d="M9 12v14h22M9 19h22M20 12v14" fill="none" stroke="#BED9DF" stroke-width="1.3"/><path d="M6 21h7l3-7 5 13 4-9 3 3h6" fill="none" stroke="#E56D81" stroke-width="2.8"/><path d="M10 9h7" fill="none" stroke="#FFFFFF" stroke-width="2"/>',
  'stat-average-hrv': '<rect x="3" y="7" width="34" height="28" rx="6" fill="#65A99D"/><rect x="3" y="5" width="34" height="27" rx="6" fill="#D9EEE6"/><path d="M9 26h22M9 12v14" fill="none" stroke="#AED2C7" stroke-width="1.5"/><path d="M7 22c3 0 2-9 5-9s2 14 5 14 2-18 5-18 2 13 5 13 3-8 6-8" fill="none" stroke="#388F84" stroke-width="2.8"/><path d="M10 9h6" fill="none" stroke="#FAFFF5" stroke-width="2"/>',
  'stat-rmssd': '<rect x="3" y="7" width="34" height="28" rx="6" fill="#9680BD"/><rect x="3" y="5" width="34" height="27" rx="6" fill="#EAE2F5"/><path d="M7 23h5l2-9 3 14 2-5h6l2-9 3 14 2-5h2" fill="none" stroke="#8662AC" stroke-width="2.6"/><path d="M14 9h13m-13-2v4m13-4v4" fill="none" stroke="#B294CD" stroke-width="1.8"/><circle cx="14" cy="14" r="2" fill="#C6B2E2"/><circle cx="27" cy="14" r="2" fill="#C6B2E2"/>',
  'stat-stress-index': '<path d="M3 28a17 17 0 0 1 34 0v4H3Z" fill="#E4B86A"/><path d="M3 27a17 17 0 0 1 34 0H3Z" fill="#F9D98D"/><path d="M8 27a12 12 0 0 1 24 0" fill="none" stroke="#FFF3CF" stroke-width="4"/><path d="M8 27a12 12 0 0 1 7-11" fill="none" stroke="#73B6A5" stroke-width="4"/><path d="m20 27 7-10" fill="none" stroke="#806B58" stroke-width="2.8"/><circle cx="20" cy="27" r="3.5" fill="#806B58"/><circle cx="20" cy="27" r="1.5" fill="#FFF3CF"/>',
  'alert-outline': '<path d="m17 5-14 26q-2 5 3 5h28q5 0 3-5L23 5q-3-5-6 0Z" fill="#D8A24E"/><path d="m17 4-14 26q-2 4 3 4h28q5 0 3-4L23 4q-3-4-6 0Z" fill="#F7CE77"/><path d="m9 25 8-15" fill="none" stroke="#FFE8AD" stroke-width="2.2"/><rect x="18.3" y="12" width="3.4" height="12" rx="1.7" fill="#957348"/><circle cx="20" cy="29" r="1.9" fill="#957348"/>',
  'information-outline': '<circle cx="20" cy="21" r="17" fill="#4C9C9C"/><circle cx="20" cy="19" r="16" fill="#83C6C1"/><path d="M9 13q3-6 9-6" fill="none" stroke="#C8EEE1" stroke-width="2.5"/><circle cx="20" cy="11" r="2.3" fill="#FFF8E8"/><path d="M18 19h2v10m-3 0h6" fill="none" stroke="#FFF8E8" stroke-width="3"/>',
  'cloud-off-outline': '<path d="M10 31a8 8 0 0 1-1-16 11 11 0 0 1 21-2 9 9 0 0 1 0 18Z" fill="#8CADC7"/><path d="M10 28a7 7 0 0 1-1-14 11 11 0 0 1 21-2 8 8 0 0 1 0 16Z" fill="#C6DEE8"/><path d="M14 12q2-5 7-4" fill="none" stroke="#EDF7F5" stroke-width="2.5"/><path d="m26 24 9 10" fill="none" stroke="#FFF8EE" stroke-width="5.5"/><path d="m26 24 9 10" fill="none" stroke="#DF8290" stroke-width="3"/>',
  'alert-circle-outline': ONBOARDING_CONTEXT_ILLUSTRATIONS['alert-circle-outline'],
  'clock-outline': HABIT_ILLUSTRATIONS.clock,
  heart: HABIT_ILLUSTRATIONS.heart,
  'heart-pulse': ONBOARDING_ILLUSTRATIONS['heart-pulse'],
  camera: HABIT_ILLUSTRATIONS.camera,
} as const;
