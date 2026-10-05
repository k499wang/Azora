import test from 'node:test';
import assert from 'node:assert/strict';
import { subscribeToAudioLoaded } from './useAudioLoaded.ts';

test('readiness arriving before listener attachment is recovered from native state', () => {
  let ready = false;
  let completions = 0;
  let removals = 0;
  const cleanup = subscribeToAudioLoaded({
    get isLoaded() { return ready; },
    addListener() {
      // The native readiness event happened before this listener was installed.
      ready = true;
      return { remove() { removals += 1; } };
    },
  }, () => { completions += 1; });
  assert.equal(completions, 1);
  assert.equal(removals, 1);
  cleanup();
  assert.equal(removals, 1);
});

test('readiness subscription completes once and detaches immediately', () => {
  let listener;
  let completions = 0;
  let removals = 0;
  const cleanup = subscribeToAudioLoaded({
    isLoaded: false,
    addListener(event, callback) {
      assert.equal(event, 'playbackStatusUpdate');
      listener = callback;
      return { remove() { removals += 1; } };
    },
  }, () => { completions += 1; });
  listener({ isLoaded: false });
  assert.equal(completions, 0);
  listener({ isLoaded: true });
  listener({ isLoaded: true });
  assert.equal(completions, 1);
  assert.equal(removals, 1);
  cleanup();
  assert.equal(removals, 1);
});

test('cleanup prevents a late readiness callback after leaving the owner', () => {
  let listener;
  let completions = 0;
  let removals = 0;
  const cleanup = subscribeToAudioLoaded({
    isLoaded: false,
    addListener(event, callback) {
      listener = callback;
      return { remove() { removals += 1; } };
    },
  }, () => { completions += 1; });
  cleanup();
  listener({ isLoaded: true });
  assert.equal(completions, 0);
  assert.equal(removals, 1);
});
