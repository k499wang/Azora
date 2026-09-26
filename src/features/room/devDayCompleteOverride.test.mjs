/**
 * The forced day-complete is a dev switch and nothing else. A release build
 * compiles `__DEV__` to false, so these run the module both ways.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.__DEV__ = true;
const {
  forceNextDayComplete,
  isDayCompleteForced,
  takeForcedDayComplete,
} = await import('./devDayCompleteOverride.ts');

test('a release build can neither arm nor spend it', () => {
  globalThis.__DEV__ = false;
  forceNextDayComplete();
  assert.equal(isDayCompleteForced(), false);
  assert.equal(takeForcedDayComplete(), false);
});

test('a release build reads nothing even if it was armed', () => {
  globalThis.__DEV__ = true;
  forceNextDayComplete();
  globalThis.__DEV__ = false;
  assert.equal(isDayCompleteForced(), false);
  assert.equal(takeForcedDayComplete(), false);
  globalThis.__DEV__ = true;
  takeForcedDayComplete();
});

test('a dev build arms it for exactly one finish', () => {
  globalThis.__DEV__ = true;
  assert.equal(isDayCompleteForced(), false);
  forceNextDayComplete();
  assert.equal(isDayCompleteForced(), true);
  assert.equal(takeForcedDayComplete(), true);
  assert.equal(isDayCompleteForced(), false);
  assert.equal(takeForcedDayComplete(), false);
});
