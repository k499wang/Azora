const FIRST_STEP_SUBTITLE = 'Start here—one small group is enough.';
const LAST_STEP_SUBTITLE = 'Last group—then you’re done.';

const MIDDLE_STEP_SUBTITLES = [
  'Just this group for now.',
  'One small win at a time.',
  'Keep it simple—this group only.',
] as const;

/**
 * Keeps the cleanup prompt encouraging without assuming where an item belongs.
 * The middle copy rotates predictably with progress, so revisiting a step does
 * not make the instruction feel random.
 */
export function getCleanupStepSubtitle(currentStep: number, totalSteps: number): string {
  if (totalSteps <= 1) return LAST_STEP_SUBTITLE;
  if (currentStep <= 1) return FIRST_STEP_SUBTITLE;
  if (currentStep >= totalSteps) return LAST_STEP_SUBTITLE;

  return MIDDLE_STEP_SUBTITLES[(currentStep - 2) % MIDDLE_STEP_SUBTITLES.length];
}
