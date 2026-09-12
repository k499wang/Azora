export const MIN_SESSIONS_BEFORE_FIRST_PROMPT = 3;
// A count alone cannot tell an engaged user from someone who opened the app
// three times in one sitting. Two days in a row is the cheapest honest proof
// that the habit took.
export const MIN_CONSECUTIVE_SESSION_DAYS = 2;
export const MIN_SESSIONS_BETWEEN_PROMPTS = 10;
export const MIN_DAYS_BETWEEN_PROMPTS = 30;
// iOS shows at most three native review prompts per year, so asking more often
// than that only burns prompts the system silently swallows.
export const MAX_PROMPTS = 3;
// A price is the last thing a user should have in mind when asked for a rating.
export const PAYWALL_COOLDOWN_MS = 10 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReviewPromptState {
  completedSessions: number;
  consecutiveSessionDays: number;
  lastSessionDate: string | null;
  promptCount: number;
  lastPromptAt: number | null;
  lastPromptSessionCount: number;
  lastPaywallDismissedAt: number | null;
}

export const EMPTY_REVIEW_PROMPT_STATE: ReviewPromptState = {
  completedSessions: 0,
  consecutiveSessionDays: 0,
  lastSessionDate: null,
  promptCount: 0,
  lastPromptAt: null,
  lastPromptSessionCount: 0,
  lastPaywallDismissedAt: null,
};

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

function toTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toLocalDate(value: unknown): string | null {
  return typeof value === 'string' && LOCAL_DATE_PATTERN.test(value)
    ? value
    : null;
}

// Date-only arithmetic, so the two dates are read as UTC midnights and DST
// never shifts the gap by an hour.
function daysBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number);
  const [toYear, toMonth, toDay] = to.split('-').map(Number);
  const fromMs = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const toMs = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((toMs - fromMs) / DAY_MS);
}

export function normalizeReviewPromptState(value: unknown): ReviewPromptState {
  if (value == null || typeof value !== 'object') return EMPTY_REVIEW_PROMPT_STATE;
  const raw = value as Partial<Record<keyof ReviewPromptState, unknown>>;
  return {
    completedSessions: toCount(raw.completedSessions),
    consecutiveSessionDays: toCount(raw.consecutiveSessionDays),
    lastSessionDate: toLocalDate(raw.lastSessionDate),
    promptCount: toCount(raw.promptCount),
    lastPromptAt: toTimestamp(raw.lastPromptAt),
    lastPromptSessionCount: toCount(raw.lastPromptSessionCount),
    lastPaywallDismissedAt: toTimestamp(raw.lastPaywallDismissedAt),
  };
}

export function shouldRequestReview(
  state: ReviewPromptState,
  nowMs: number,
): boolean {
  if (state.promptCount >= MAX_PROMPTS) return false;
  if (state.completedSessions < MIN_SESSIONS_BEFORE_FIRST_PROMPT) return false;
  if (state.consecutiveSessionDays < MIN_CONSECUTIVE_SESSION_DAYS) return false;
  if (
    state.lastPaywallDismissedAt != null &&
    nowMs - state.lastPaywallDismissedAt < PAYWALL_COOLDOWN_MS
  ) {
    return false;
  }
  if (state.lastPromptAt == null) return true;

  const elapsedDays = (nowMs - state.lastPromptAt) / DAY_MS;
  if (elapsedDays < MIN_DAYS_BETWEEN_PROMPTS) return false;

  const sessionsSincePrompt = state.completedSessions - state.lastPromptSessionCount;
  return sessionsSincePrompt >= MIN_SESSIONS_BETWEEN_PROMPTS;
}

export function recordCompletedSession(
  state: ReviewPromptState,
  localDate: string,
): ReviewPromptState {
  const gap =
    state.lastSessionDate == null
      ? null
      : daysBetween(state.lastSessionDate, localDate);
  const consecutiveSessionDays =
    gap === 0 ? Math.max(state.consecutiveSessionDays, 1)
    : gap === 1 ? state.consecutiveSessionDays + 1
    : 1;

  return {
    ...state,
    completedSessions: state.completedSessions + 1,
    consecutiveSessionDays,
    lastSessionDate: localDate,
  };
}

export function recordPrompt(
  state: ReviewPromptState,
  nowMs: number,
): ReviewPromptState {
  return {
    ...state,
    promptCount: state.promptCount + 1,
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
