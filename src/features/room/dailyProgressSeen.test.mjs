import assert from 'node:assert/strict';
import test from 'node:test';
import { markSeenDailies, wasDayCelebrationSeen } from './dailyProgressSeen.ts';

test('a day counts as celebrated only once its full count was watched', () => {
  assert.equal(wasDayCelebrationSeen('2026-09-29', 3), false);
  markSeenDailies('2026-09-29', 2);
  assert.equal(wasDayCelebrationSeen('2026-09-29', 3), false);
  markSeenDailies('2026-09-29', 3);
  assert.equal(wasDayCelebrationSeen('2026-09-29', 3), true);
  assert.equal(wasDayCelebrationSeen('2026-09-30', 3), false);
  assert.equal(wasDayCelebrationSeen('2026-09-29', 0), false);
});
