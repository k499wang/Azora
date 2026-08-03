export const MIN_SESSIONS_BEFORE_FIRST_PROMPT = 3;
export const MIN_SESSIONS_BETWEEN_PROMPTS = 10;
export const MIN_DAYS_BETWEEN_PROMPTS = 30;
// iOS shows at most three native review prompts per year, so asking more often
// than that only burns prompts the system silently swallows.
export const MAX_PROMPTS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReviewPromptState {
  completedSessions: number;
  promptCount: number;
  lastPromptAt: number | null;
  lastPromptSessionCount: number;
}

export const EMPTY_REVIEW_PROMPT_STATE: ReviewPromptState = {
  completedSessions: 0,
  promptCount: 0,
  lastPromptAt: null,
  lastPromptSessionCount: 0,
};

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : 0;
}

export function normalizeReviewPromptState(value: unknown): ReviewPromptState {
  if (value == null || typeof value !== 'object') return EMPTY_REVIEW_PROMPT_STATE;
  const raw = value as Partial<Record<keyof ReviewPromptState, unknown>>;
  const lastPromptAt = raw.lastPromptAt;
  return {
    completedSessions: toCount(raw.completedSessions),
    promptCount: toCount(raw.promptCount),
    lastPromptAt:
      typeof lastPromptAt === 'number' && Number.isFinite(lastPromptAt)
        ? lastPromptAt
        : null,
    lastPromptSessionCount: toCount(raw.lastPromptSessionCount),
  };
}

export function shouldRequestReview(
  state: ReviewPromptState,
  nowMs: number,
): boolean {
  if (state.promptCount >= MAX_PROMPTS) return false;
  if (state.completedSessions < MIN_SESSIONS_BEFORE_FIRST_PROMPT) return false;
  if (state.lastPromptAt == null) return true;

  const elapsedDays = (nowMs - state.lastPromptAt) / DAY_MS;
  if (elapsedDays < MIN_DAYS_BETWEEN_PROMPTS) return false;

  const sessionsSincePrompt = state.completedSessions - state.lastPromptSessionCount;
  return sessionsSincePrompt >= MIN_SESSIONS_BETWEEN_PROMPTS;
}

export function recordCompletedSession(state: ReviewPromptState): ReviewPromptState {
  return { ...state, completedSessions: state.completedSessions + 1 };
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
