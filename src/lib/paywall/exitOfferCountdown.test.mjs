import test from 'node:test';
import assert from 'node:assert/strict';
import { secondsUntilDeadline } from './exitOfferCountdown.ts';

test('derives remaining time from the deadline instead of elapsed ticks', () => {
  const deadline = 300_000;
  assert.equal(secondsUntilDeadline(deadline, 0), 300);
  assert.equal(secondsUntilDeadline(deadline, 120_000), 180);
  assert.equal(secondsUntilDeadline(deadline, 299_500), 1);
});

test('an elapsed deadline stays expired', () => {
  assert.equal(secondsUntilDeadline(300_000, 300_000), 0);
  assert.equal(secondsUntilDeadline(300_000, 600_000), 0);
});
