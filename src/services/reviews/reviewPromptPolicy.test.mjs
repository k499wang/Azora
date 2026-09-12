import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_REVIEW_PROMPT_STATE,
  MAX_PROMPTS,
  MIN_CONSECUTIVE_SESSION_DAYS,
  MIN_DAYS_BETWEEN_PROMPTS,
  MIN_SESSIONS_BEFORE_FIRST_PROMPT,
  MIN_SESSIONS_BETWEEN_PROMPTS,
  PAYWALL_COOLDOWN_MS,
  ReviewPromptBlock,
  evaluateReviewPrompt,
  normalizeReviewPromptState,
  recordCompletedSession,
  recordPaywallDismissed,
  recordPrompt,
} from './reviewPromptPolicy.ts';

/** The rules read as pass/fail in most tests; the reason is asserted directly
 *  where it is the point of the test. */
const allows = (state, nowMs) => evaluateReviewPrompt(state, nowMs) === null;

const NOW = Date.UTC(2026, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;

/** A user who has done enough sessions across enough days to qualify. */
const ENGAGED = {
  ...EMPTY_REVIEW_PROMPT_STATE,
  completedSessions: MIN_SESSIONS_BEFORE_FIRST_PROMPT,
  consecutiveSessionDays: MIN_CONSECUTIVE_SESSION_DAYS,
  lastSessionDate: '2026-01-01',
};

test('stays quiet until the user has finished enough sessions', () => {
  const state = {
    ...ENGAGED,
    completedSessions: MIN_SESSIONS_BEFORE_FIRST_PROMPT - 1,
  };
  assert.equal(allows(state, NOW), false);
  assert.equal(
    allows(recordCompletedSession(state, '2026-01-01'), NOW),
    true,
  );
});

test('a burst of sessions in one day is not enough on its own', () => {
  let state = EMPTY_REVIEW_PROMPT_STATE;
  for (let i = 0; i < MIN_SESSIONS_BEFORE_FIRST_PROMPT; i += 1) {
    state = recordCompletedSession(state, '2026-01-01');
  }
  assert.equal(state.completedSessions, MIN_SESSIONS_BEFORE_FIRST_PROMPT);
  assert.equal(state.consecutiveSessionDays, 1);
  assert.equal(allows(state, NOW), false);

  const nextDay = recordCompletedSession(state, '2026-01-02');
  assert.equal(nextDay.consecutiveSessionDays, 2);
  assert.equal(allows(nextDay, NOW), true);
});

test('a missed day restarts the consecutive-day run', () => {
  const state = recordCompletedSession(
    { ...ENGAGED, consecutiveSessionDays: 6, lastSessionDate: '2026-01-01' },
    '2026-01-05',
  );
  assert.equal(state.consecutiveSessionDays, 1);
  assert.equal(allows(state, NOW), false);
});

test('the consecutive-day run spans a month boundary', () => {
  const state = recordCompletedSession(
    { ...EMPTY_REVIEW_PROMPT_STATE, lastSessionDate: '2026-01-31' },
    '2026-02-01',
  );
  assert.equal(state.consecutiveSessionDays, 1);
});

test('stays quiet in the cooldown after a paywall was dismissed', () => {
  const dismissed = recordPaywallDismissed(ENGAGED, NOW);
  assert.equal(allows(dismissed, NOW), false);
  assert.equal(
    allows(dismissed, NOW + PAYWALL_COOLDOWN_MS - 1),
    false,
  );
  assert.equal(allows(dismissed, NOW + PAYWALL_COOLDOWN_MS), true);
});

test('a second prompt needs both the time gap and more sessions', () => {
  const prompted = recordPrompt({ ...ENGAGED, completedSessions: 5 }, NOW);
  const later = NOW + MIN_DAYS_BETWEEN_PROMPTS * DAY_MS;

  assert.equal(allows(prompted, later), false);

  const withSessions = {
    ...prompted,
    completedSessions: prompted.completedSessions + MIN_SESSIONS_BETWEEN_PROMPTS,
  };
  assert.equal(allows(withSessions, later), true);
  assert.equal(allows(withSessions, later - DAY_MS), false);
});

test('never asks more than the annual prompt budget', () => {
  const state = {
    ...ENGAGED,
    completedSessions: 500,
    promptCount: MAX_PROMPTS,
    lastPromptAt: NOW - 365 * DAY_MS,
  };
  assert.equal(allows(state, NOW), false);
});

test('a device clock that moves backwards does not unlock a prompt', () => {
  const prompted = recordPrompt({ ...ENGAGED, completedSessions: 100 }, NOW);
  assert.equal(allows(prompted, NOW - 90 * DAY_MS), false);

  const dismissed = recordPaywallDismissed(ENGAGED, NOW);
  assert.equal(allows(dismissed, NOW - DAY_MS), false);
});

test('corrupt stored state falls back to an empty state', () => {
  assert.deepEqual(normalizeReviewPromptState(null), EMPTY_REVIEW_PROMPT_STATE);
  assert.deepEqual(normalizeReviewPromptState('nope'), EMPTY_REVIEW_PROMPT_STATE);
  assert.deepEqual(
    normalizeReviewPromptState({
      completedSessions: -4,
      consecutiveSessionDays: 'lots',
      lastSessionDate: 'yesterday',
      promptCount: Number.NaN,
      lastPromptAt: 'yesterday',
      lastPromptSessionCount: 2.7,
      lastPaywallDismissedAt: {},
    }),
    { ...EMPTY_REVIEW_PROMPT_STATE, lastPromptSessionCount: 2 },
  );
});

test('state written before consecutive days existed does not block forever', () => {
  const legacy = normalizeReviewPromptState({
    completedSessions: 40,
    promptCount: 0,
    lastPromptAt: null,
    lastPromptSessionCount: 0,
  });
  assert.equal(allows(legacy, NOW), false);

  const afterTwoDays = recordCompletedSession(
    recordCompletedSession(legacy, '2026-01-01'),
    '2026-01-02',
  );
  assert.equal(allows(afterTwoDays, NOW), true);
});

test('each rule names itself so a suppressed prompt is legible', () => {
  const tooFewSessions = {
    ...ENGAGED,
    completedSessions: MIN_SESSIONS_BEFORE_FIRST_PROMPT - 1,
  };
  assert.equal(
    evaluateReviewPrompt(tooFewSessions, NOW),
    ReviewPromptBlock.TooFewSessions,
  );

  assert.equal(
    evaluateReviewPrompt({ ...ENGAGED, consecutiveSessionDays: 1 }, NOW),
    ReviewPromptBlock.TooFewDays,
  );

  assert.equal(
    evaluateReviewPrompt(recordPaywallDismissed(ENGAGED, NOW), NOW),
    ReviewPromptBlock.PaywallCooldown,
  );

  assert.equal(
    evaluateReviewPrompt({ ...ENGAGED, promptCount: MAX_PROMPTS }, NOW),
    ReviewPromptBlock.BudgetExhausted,
  );

  const prompted = recordPrompt(ENGAGED, NOW);
  assert.equal(
    evaluateReviewPrompt(prompted, NOW + DAY_MS),
    ReviewPromptBlock.TooSoonAfterPrompt,
  );
  assert.equal(
    evaluateReviewPrompt(prompted, NOW + MIN_DAYS_BETWEEN_PROMPTS * DAY_MS),
    ReviewPromptBlock.TooFewSessionsSincePrompt,
  );

  assert.equal(evaluateReviewPrompt(ENGAGED, NOW), null);
});
