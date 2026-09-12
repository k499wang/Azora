import test from 'node:test';
import assert from 'node:assert/strict';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The stub shipped for non-native environments has no methods at all, so the
// writes below would silently no-op and prove nothing. Give it a real map
// before the module is imported, so what is asserted is the whole chain:
// the reducer, through JSON, to the value that outlives the launch.
const stored = new Map();
let failNextWrite = false;
AsyncStorage.setItem = async (key, value) => {
  if (failNextWrite) {
    failNextWrite = false;
    throw new Error('disk full');
  }
  stored.set(key, value);
};
AsyncStorage.getItem = async (key) => stored.get(key) ?? null;

const {
  markPaywallDismissed,
  markPromptShown,
  markSessionCompleted,
  readReviewPromptState,
} = await import('./reviewPromptState.ts');
const { EMPTY_REVIEW_PROMPT_STATE } = await import('./reviewPromptPolicy.ts');

const KEY = 'reviews:prompt_state';

test.beforeEach(() => {
  stored.clear();
  failNextWrite = false;
});

test('a first session persists under the documented key', async () => {
  const state = await markSessionCompleted();

  assert.equal(state.completedSessions, 1);
  assert.equal(state.consecutiveSessionDays, 1);
  assert.notEqual(stored.get(KEY), undefined);
  assert.deepEqual(JSON.parse(stored.get(KEY)), state);
});

test('state survives a relaunch', async () => {
  await markSessionCompleted();
  await markPromptShown();

  const reloaded = await readReviewPromptState();
  assert.equal(reloaded.completedSessions, 1);
  assert.equal(reloaded.promptCount, 1);
  assert.equal(reloaded.lastPromptSessionCount, 1);
  assert.equal(typeof reloaded.lastPromptAt, 'number');
});

test('concurrent writes are serialized, never lost', async () => {
  const results = await Promise.all([
    markSessionCompleted(),
    markSessionCompleted(),
    markSessionCompleted(),
    markPaywallDismissed(),
  ]);

  const final = await readReviewPromptState();
  assert.equal(final.completedSessions, 3, 'no increment was clobbered');
  assert.equal(typeof final.lastPaywallDismissedAt, 'number');
  // Each writer saw a distinct count, which is what proves the queue held.
  const counts = results.slice(0, 3).map((s) => s.completedSessions).sort();
  assert.deepEqual(counts, [1, 2, 3]);
});

test('a corrupt stored value reads as empty instead of throwing', async () => {
  stored.set(KEY, '{ not json');
  assert.deepEqual(await readReviewPromptState(), EMPTY_REVIEW_PROMPT_STATE);
});

test('a failed write costs accounting, never the caller', async () => {
  failNextWrite = true;
  const state = await markSessionCompleted();

  assert.equal(state.completedSessions, 1, 'the caller still gets a result');
  assert.equal(stored.get(KEY), undefined, 'nothing was persisted');
});

test('reading never writes', async () => {
  await readReviewPromptState();
  assert.equal(stored.get(KEY), undefined);
});
