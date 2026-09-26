export const MIN_SESSIONS_BEFORE_FIRST_PROMPT = 1;
// The first Reset is asked on a later day than the onboarding ask, so the two
// never read as one nag and the Reset ask reflects the product, not the pitch.
export const MIN_DAYS_AFTER_ONBOARDING_PROMPT = 1;
export const MIN_SESSIONS_BETWEEN_PROMPTS = 10;
export const MIN_DAYS_BETWEEN_PROMPTS = 30;
// iOS shows at most three native review prompts per year, so asking more often
// than that only burns prompts the system silently swallows.
export const MAX_PROMPTS = 3;
// A price is the last thing a user should have in mind when asked for a rating.
export const PAYWALL_COOLDOWN_MS = 10 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

export const ReviewPromptKind = {
  Onboarding: 'onboarding',
  Session: 'session',
} as const;

export type ReviewPromptKindValue =
  typeof ReviewPromptKind[keyof typeof ReviewPromptKind];

export interface ReviewPromptState {
  completedSessions: number;
  promptCount: number;
  sessionPromptCount: number;
  lastPromptAt: number | null;
  lastPromptSessionCount: number;
  lastPaywallDismissedAt: number | null;
}

export const EMPTY_REVIEW_PROMPT_STATE: ReviewPromptState = {
  completedSessions: 0,
  promptCount: 0,
  sessionPromptCount: 0,
  lastPromptAt: null,
  lastPromptSessionCount: 0,
  lastPaywallDismissedAt: null,
};

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function toTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function normalizeReviewPromptState(value: unknown): ReviewPromptState {
  if (value == null || typeof value !== 'object') return EMPTY_REVIEW_PROMPT_STATE;
  const raw = value as Partial<Record<keyof ReviewPromptState, unknown>>;
  const promptCount = toCount(raw.promptCount);
  return {
    completedSessions: toCount(raw.completedSessions),
    promptCount,
    // State written before the split cannot tell onboarding asks from session
    // asks, so treat them all as session asks rather than grant a fresh first.
    sessionPromptCount:
      'sessionPromptCount' in raw ? toCount(raw.sessionPromptCount) : promptCount,
    lastPromptAt: toTimestamp(raw.lastPromptAt),
    lastPromptSessionCount: toCount(raw.lastPromptSessionCount),
    lastPaywallDismissedAt: toTimestamp(raw.lastPaywallDismissedAt),
  };
}

/**
 * Why a prompt was held back. Reported as-is to analytics, so a suppressed
 * prompt is visible rather than a silent nothing.
 */
export const ReviewPromptBlock = {
  BudgetExhausted: 'budget_exhausted',
  AlreadyPrompted: 'already_prompted',
  TooFewSessions: 'too_few_sessions',
  PaywallCooldown: 'paywall_cooldown',
  TooSoonAfterOnboarding: 'too_soon_after_onboarding',
  TooSoonAfterPrompt: 'too_soon_after_prompt',
  TooFewSessionsSincePrompt: 'too_few_sessions_since_prompt',
} as const;

export type ReviewPromptBlockValue =
  typeof ReviewPromptBlock[keyof typeof ReviewPromptBlock];

/**
 * The annual budget is the one rule that binds every trigger, onboarding
 * included, so it lives on its own and is checked again at the native call.
 */
export function hasPromptBudget(state: ReviewPromptState): boolean {
  return state.promptCount < MAX_PROMPTS;
}

/** Onboarding only asks someone never asked, so stepping back and forth is safe. */
export function evaluateOnboardingPrompt(
  state: ReviewPromptState,
): ReviewPromptBlockValue | null {
  if (!hasPromptBudget(state)) return ReviewPromptBlock.BudgetExhausted;
  return state.promptCount > 0 ? ReviewPromptBlock.AlreadyPrompted : null;
}

/** Returns the rule that blocked the prompt, or null when it may be shown. */
export function evaluateReviewPrompt(
  state: ReviewPromptState,
  nowMs: number,
): ReviewPromptBlockValue | null {
  if (!hasPromptBudget(state)) return ReviewPromptBlock.BudgetExhausted;
  if (state.completedSessions < MIN_SESSIONS_BEFORE_FIRST_PROMPT) {
    return ReviewPromptBlock.TooFewSessions;
  }
  if (
    state.lastPaywallDismissedAt != null &&
    nowMs - state.lastPaywallDismissedAt < PAYWALL_COOLDOWN_MS
  ) {
    return ReviewPromptBlock.PaywallCooldown;
  }
  if (state.lastPromptAt == null) return null;

  const elapsedDays = (nowMs - state.lastPromptAt) / DAY_MS;
  if (state.sessionPromptCount === 0) {
    return elapsedDays < MIN_DAYS_AFTER_ONBOARDING_PROMPT
      ? ReviewPromptBlock.TooSoonAfterOnboarding
      : null;
  }
  if (elapsedDays < MIN_DAYS_BETWEEN_PROMPTS) {
    return ReviewPromptBlock.TooSoonAfterPrompt;
  }

  const sessionsSincePrompt = state.completedSessions - state.lastPromptSessionCount;
  return sessionsSincePrompt >= MIN_SESSIONS_BETWEEN_PROMPTS
    ? null
    : ReviewPromptBlock.TooFewSessionsSincePrompt;
}

export function recordCompletedSession(
  state: ReviewPromptState,
): ReviewPromptState {
  return { ...state, completedSessions: state.completedSessions + 1 };
}

export function recordPrompt(
  state: ReviewPromptState,
  nowMs: number,
  kind: ReviewPromptKindValue,
): ReviewPromptState {
  return {
    ...state,
    promptCount: state.promptCount + 1,
    sessionPromptCount:
      state.sessionPromptCount + (kind === ReviewPromptKind.Session ? 1 : 0),
    lastPromptAt: nowMs,
    lastPromptSessionCount: state.completedSessions,
  };
}

export function recordPaywallDismissed(
  state: ReviewPromptState,
  nowMs: number,
): ReviewPromptState {
  return { ...state, lastPaywallDismissedAt: nowMs };
}
