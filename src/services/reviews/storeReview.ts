import * as StoreReview from 'expo-store-review';
import { trackReviewPromptRequested } from '../analytics/tracking';
import { shouldRequestReview } from './reviewPromptPolicy';
import { markPromptShown, markSessionCompleted } from './reviewPromptState';

export const ReviewTrigger = {
  Onboarding: 'onboarding',
  GuidedBreathing: 'guided_breathing',
  BreathHold: 'breath_hold',
  HeartRate: 'heart_rate',
} as const;

export type ReviewTriggerValue =
  typeof ReviewTrigger[keyof typeof ReviewTrigger];

// The native sheet slides up over whatever is on screen; give the result screen
// a beat to land first so it does not fight the navigation transition.
const PROMPT_DELAY_MS = 1800;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestStoreReview(
  trigger: ReviewTriggerValue = ReviewTrigger.Onboarding,
): Promise<void> {
  try {
    if (!(await StoreReview.isAvailableAsync())) return;
    await StoreReview.requestReview();
    const state = await markPromptShown(Date.now());
    trackReviewPromptRequested({
      trigger,
      promptCount: state.promptCount,
      completedSessions: state.completedSessions,
    });
  } catch {
    // Native review prompts are best-effort and should never block a flow.
  }
}

export async function maybeRequestSessionReview(
  trigger: ReviewTriggerValue,
): Promise<void> {
  const state = await markSessionCompleted();
  if (!shouldRequestReview(state, Date.now())) return;
  await delay(PROMPT_DELAY_MS);
  await requestStoreReview(trigger);
}
