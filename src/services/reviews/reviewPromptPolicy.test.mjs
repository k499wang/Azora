import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_REVIEW_PROMPT_STATE,
  MAX_PROMPTS,
  MIN_DAYS_BETWEEN_PROMPTS,
  MIN_SESSIONS_BEFORE_FIRST_PROMPT,
  MIN_SESSIONS_BETWEEN_PROMPTS,
  normalizeReviewPromptState,
  recordCompletedSession,
  recordPrompt,
  shouldRequestReview,
} from './reviewPromptPolicy.ts';

const NOW = Date.UTC(2026, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;

test('stays quiet until the user has finished enough sessions', () => {
  const state = {
    ...EMPTY_REVIEW_PROMPT_STATE,
    completedSessions: MIN_SESSIONS_BEFORE_FIRST_PROMPT - 1,
  };
  assert.equal(shouldRequestReview(state, NOW), false);
  assert.equal(shouldRequestReview(recordCompletedSession(state), NOW), true);
});

test('a second prompt needs both the time gap and more sessions', () => {
  const prompted = recordPrompt(
    { ...EMPTY_REVIEW_PROMPT_STATE, completedSessions: 5 },
    NOW,
  );
  const later = NOW + MIN_DAYS_BETWEEN_PROMPTS * DAY_MS;

  assert.equal(shouldRequestReview(prompted, later), false);

  const withSessions = {
    ...prompted,
    completedSessions: prompted.completedSessions + MIN_SESSIONS_BETWEEN_PROMPTS,
  };
  assert.equal(shouldRequestReview(withSessions, later), true);
  assert.equal(shouldRequestReview(withSessions, later - DAY_MS), false);
});

test('never asks more than the annual prompt budget', () => {
  const state = {
    completedSessions: 500,
    promptCount: MAX_PROMPTS,
    lastPromptAt: NOW - 365 * DAY_MS,
    lastPromptSessionCount: 0,
  };
  assert.equal(shouldRequestReview(state, NOW), false);
});

test('a device clock that moves backwards does not unlock a prompt', () => {
  const prompted = recordPrompt(
    { ...EMPTY_REVIEW_PROMPT_STATE, completedSessions: 100 },
    NOW,
  );
  assert.equal(shouldRequestReview(prompted, NOW - 90 * DAY_MS), false);
});

test('corrupt stored state falls back to an empty state', () => {
  assert.deepEqual(normalizeReviewPromptState(null), EMPTY_REVIEW_PROMPT_STATE);
  assert.deepEqual(normalizeReviewPromptState('nope'), EMPTY_REVIEW_PROMPT_STATE);
  assert.deepEqual(
    normalizeReviewPromptState({
      completedSessions: -4,
      promptCount: Number.NaN,
      lastPromptAt: 'yesterday',
      lastPromptSessionCount: 2.7,
    }),
    { ...EMPTY_REVIEW_PROMPT_STATE, lastPromptSessionCount: 2 },
  );
});
