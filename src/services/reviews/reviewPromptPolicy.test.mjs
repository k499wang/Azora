import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_REVIEW_PROMPT_STATE,
  MAX_PROMPTS,
  MIN_DAYS_AFTER_ONBOARDING_PROMPT,
  MIN_DAYS_BETWEEN_PROMPTS,
  MIN_SESSIONS_BEFORE_FIRST_PROMPT,
  MIN_SESSIONS_BETWEEN_PROMPTS,
  PAYWALL_COOLDOWN_MS,
  ReviewPromptBlock,
  ReviewPromptKind,
  evaluateOnboardingPrompt,
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

/** A user who has done enough sessions to qualify for a first ask. */
const ENGAGED = {
  ...EMPTY_REVIEW_PROMPT_STATE,
  completedSessions: MIN_SESSIONS_BEFORE_FIRST_PROMPT,
};

const onboardingAsked = (state, atMs) =>
  recordPrompt(state, atMs, ReviewPromptKind.Onboarding);
const sessionAsked = (state, atMs) =>
  recordPrompt(state, atMs, ReviewPromptKind.Session);

test('the first completed Reset asks when nobody has asked yet', () => {
  assert.equal(allows(EMPTY_REVIEW_PROMPT_STATE, NOW), false);
  assert.equal(allows(recordCompletedSession(EMPTY_REVIEW_PROMPT_STATE), NOW), true);
});

test('the first Reset waits a day after the onboarding ask', () => {
  const asked = onboardingAsked(EMPTY_REVIEW_PROMPT_STATE, NOW);
  const afterReset = recordCompletedSession(asked);
  const oneDay = MIN_DAYS_AFTER_ONBOARDING_PROMPT * DAY_MS;

  assert.equal(
    evaluateReviewPrompt(afterReset, NOW + oneDay - 1),
    ReviewPromptBlock.TooSoonAfterOnboarding,
  );
  assert.equal(evaluateReviewPrompt(afterReset, NOW + oneDay), null);
});

test('an onboarding ask spends budget but is not a session ask', () => {
  const asked = onboardingAsked(ENGAGED, NOW);
  assert.equal(asked.promptCount, 1);
  assert.equal(asked.sessionPromptCount, 0);
  assert.equal(asked.lastPromptAt, NOW);

  const reset = sessionAsked(asked, NOW);
  assert.equal(reset.promptCount, 2);
  assert.equal(reset.sessionPromptCount, 1);
});

test('stays quiet in the cooldown after a paywall was dismissed', () => {
  const dismissed = recordPaywallDismissed(ENGAGED, NOW);
  assert.equal(allows(dismissed, NOW), false);
  assert.equal(allows(dismissed, NOW + PAYWALL_COOLDOWN_MS - 1), false);
  assert.equal(allows(dismissed, NOW + PAYWALL_COOLDOWN_MS), true);
});

test('after a session ask, the next needs both the time gap and more sessions', () => {
  const prompted = sessionAsked(
    onboardingAsked({ ...ENGAGED, completedSessions: 5 }, NOW - 2 * DAY_MS),
    NOW,
  );
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
    sessionPromptCount: MAX_PROMPTS,
    lastPromptAt: NOW - 365 * DAY_MS,
  };
  assert.equal(allows(state, NOW), false);
  assert.equal(evaluateOnboardingPrompt(state), ReviewPromptBlock.BudgetExhausted);
});

test('a device clock that moves backwards does not unlock a prompt', () => {
  const prompted = sessionAsked({ ...ENGAGED, completedSessions: 100 }, NOW);
  assert.equal(allows(prompted, NOW - 90 * DAY_MS), false);

  const onboarded = onboardingAsked(ENGAGED, NOW);
  assert.equal(allows(onboarded, NOW - DAY_MS), false);

  const dismissed = recordPaywallDismissed(ENGAGED, NOW);
  assert.equal(allows(dismissed, NOW - DAY_MS), false);
});

test('onboarding only asks someone never asked before', () => {
  assert.equal(evaluateOnboardingPrompt(EMPTY_REVIEW_PROMPT_STATE), null);
  assert.equal(
    evaluateOnboardingPrompt(onboardingAsked(EMPTY_REVIEW_PROMPT_STATE, NOW)),
    ReviewPromptBlock.AlreadyPrompted,
  );
});

test('corrupt stored state falls back to an empty state', () => {
  assert.deepEqual(normalizeReviewPromptState(null), EMPTY_REVIEW_PROMPT_STATE);
  assert.deepEqual(normalizeReviewPromptState('nope'), EMPTY_REVIEW_PROMPT_STATE);
  assert.deepEqual(
    normalizeReviewPromptState({
      completedSessions: -4,
      promptCount: Number.NaN,
      sessionPromptCount: 'lots',
      lastPromptAt: 'yesterday',
      lastPromptSessionCount: 2.7,
      lastPaywallDismissedAt: {},
    }),
    { ...EMPTY_REVIEW_PROMPT_STATE, lastPromptSessionCount: 2 },
  );
});

test('state written before session asks were counted keeps its history', () => {
  const legacy = normalizeReviewPromptState({
    completedSessions: 40,
    consecutiveSessionDays: 3,
    lastSessionDate: '2026-01-01',
    promptCount: 2,
    lastPromptAt: NOW - 10 * DAY_MS,
    lastPromptSessionCount: 35,
  });
  assert.equal(legacy.sessionPromptCount, 2);
  assert.equal(
    evaluateReviewPrompt(legacy, NOW),
    ReviewPromptBlock.TooSoonAfterPrompt,
  );
  assert.equal('consecutiveSessionDays' in legacy, false);
  assert.equal('lastSessionDate' in legacy, false);
});

test('each rule names itself so a suppressed prompt is legible', () => {
  assert.equal(
    evaluateReviewPrompt(EMPTY_REVIEW_PROMPT_STATE, NOW),
    ReviewPromptBlock.TooFewSessions,
  );

  assert.equal(
    evaluateReviewPrompt(recordPaywallDismissed(ENGAGED, NOW), NOW),
    ReviewPromptBlock.PaywallCooldown,
  );

  assert.equal(
    evaluateReviewPrompt({ ...ENGAGED, promptCount: MAX_PROMPTS }, NOW),
    ReviewPromptBlock.BudgetExhausted,
  );

  assert.equal(
    evaluateReviewPrompt(onboardingAsked(ENGAGED, NOW), NOW),
    ReviewPromptBlock.TooSoonAfterOnboarding,
  );

  const prompted = sessionAsked(ENGAGED, NOW);
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
