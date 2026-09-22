import assert from 'node:assert/strict';
import test from 'node:test';
import { habitSwipeDecision } from './onboardingHabitSwipe.ts';

test('distance commits in the visible drag direction, even against a fast final flick', () => {
  assert.equal(habitSwipeDecision(88, -1200), 'accepted');
  assert.equal(habitSwipeDecision(-88, 1200), 'rejected');
  assert.equal(habitSwipeDecision(130, 200), 'accepted');
  assert.equal(habitSwipeDecision(-130, -200), 'rejected');
});

test('a short flick can commit, and a slow short drag settles back', () => {
  assert.equal(habitSwipeDecision(30, 800), 'accepted');
  assert.equal(habitSwipeDecision(-30, -800), 'rejected');
  assert.equal(habitSwipeDecision(30, 200), null);
  assert.equal(habitSwipeDecision(-30, -200), null);
});
