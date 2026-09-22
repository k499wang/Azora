import type { CleanupPlan } from './cleanupPlan';

/**
 * The development-only stand-in for a Gemini result. It lets the camera,
 * loading, safety, and ordered-list experience be reviewed without a provider
 * request or a billing credential.
 */
export const PHOTO_CLEANUP_PREVIEW_PLAN: CleanupPlan = {
  title: 'Start here',
  objects: [
    'Cups and dishes',
    'Food wrappers and trash',
    'Clothes on the floor',
    'Items on the desk or main surface',
  ],
  safetyNote: null,
};
