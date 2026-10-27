import type { CleanupPlan } from './cleanupPlan';

/**
 * The development-only stand-in for a Gemini result. It lets the camera,
 * loading, safety, and ordered-list experience be reviewed without a provider
 * request or a billing credential.
 */
export const PHOTO_CLEANUP_PREVIEW_PLAN: CleanupPlan = {
  title: 'Start here',
  objects: [
    { name: 'Cups and dishes', minutes: 2 },
    { name: 'Food wrappers and trash', minutes: 1 },
    { name: 'Clothes on the floor', minutes: 4 },
    { name: 'Items on the desk or main surface', minutes: 3 },
  ],
  safetyNote: null,
};
