import * as StoreReview from 'expo-store-review';
import {
  trackReviewPromptRequested,
  trackReviewPromptSuppressed,
} from '../analytics/tracking';
import { evaluateReviewPrompt } from './reviewPromptPolicy';
import { markPromptShown, markSessionCompleted } from './reviewPromptState';

export const ReviewTrigger = {
  OnboardingBaseline: 'onboarding_baseline',
  GuidedBreathing: 'guided_breathing',
  BreathHold: 'breath_hold',
  HeartRate: 'heart_rate',
} as const;

export type ReviewTriggerValue =
  typeof ReviewTrigger[keyof typeof ReviewTrigger];

// The native sheet slides up over whatever is on screen; give the result screen
// a beat to land first so it does not fight the navigation transition, and so
// the user reads their own number before the sheet covers it.
const PROMPT_DELAY_MS = 1800;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestStoreReview(
  trigger: ReviewTriggerValue,
): Promise<void> {
  try {
    if (!(await StoreReview.isAvailableAsync())) return;
    await delay(PROMPT_DELAY_MS);
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
  const blockedBy = evaluateReviewPrompt(state, Date.now());
  if (blockedBy != null) {
    trackReviewPromptSuppressed({
      trigger,
      reason: blockedBy,
      promptCount: state.promptCount,
      completedSessions: state.completedSessions,
      consecutiveSessionDays: state.consecutiveSessionDays,
    });
    return;
  }
  await requestStoreReview(trigger);
}
