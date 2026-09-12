import { AppState } from 'react-native';
import * as StoreReview from 'expo-store-review';
import {
  trackReviewPromptRequested,
  trackReviewPromptSuppressed,
} from '../analytics/tracking';
import {
  ReviewPromptBlock,
  evaluateReviewPrompt,
  hasPromptBudget,
  type ReviewPromptBlockValue,
  type ReviewPromptState,
} from './reviewPromptPolicy';
import {
  markPromptShown,
  markSessionCompleted,
  readReviewPromptState,
} from './reviewPromptState';

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

/**
 * Shows the native sheet, subject to the two conditions that hold for every
 * trigger — onboarding included, which otherwise skips the session policy.
 */
export async function requestStoreReview(
  trigger: ReviewTriggerValue,
): Promise<void> {
  try {
    if (!(await StoreReview.isAvailableAsync())) return;

    const stored = await readReviewPromptState();
    if (!hasPromptBudget(stored)) {
      trackSuppressed(trigger, ReviewPromptBlock.BudgetExhausted, stored);
      return;
    }

    await delay(PROMPT_DELAY_MS);
    // The sheet is discarded if the app left the foreground during the beat,
    // and asking anyway would spend one of the three annual prompts on nobody.
    if (AppState.currentState !== 'active') return;

    await StoreReview.requestReview();
    const state = await markPromptShown();
    trackReviewPromptRequested({
      trigger,
      promptCount: state.promptCount,
      completedSessions: state.completedSessions,
    });
  } catch {
    // Native review prompts are best-effort and should never block a flow.
  }
}

function trackSuppressed(
  trigger: ReviewTriggerValue,
  reason: ReviewPromptBlockValue,
  state: ReviewPromptState,
): void {
  trackReviewPromptSuppressed({
    trigger,
    reason,
    promptCount: state.promptCount,
    completedSessions: state.completedSessions,
    consecutiveSessionDays: state.consecutiveSessionDays,
  });
}

export async function maybeRequestSessionReview(
  trigger: ReviewTriggerValue,
): Promise<void> {
  const state = await markSessionCompleted();
  const blockedBy = evaluateReviewPrompt(state, Date.now());
  if (blockedBy != null) {
    trackSuppressed(trigger, blockedBy, state);
    return;
  }
  await requestStoreReview(trigger);
}
