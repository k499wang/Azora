import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCountdown, msUntilNextLocalDay } from './nextDayCountdown.ts';

test('counts to the next local midnight', () => {
  const ms = msUntilNextLocalDay(new Date(2026, 7, 18, 21, 30, 0));
  assert.equal(ms, ((2 * 60 + 30) * 60) * 1000);
});

test('a minute before midnight is a minute, not a day', () => {
  const ms = msUntilNextLocalDay(new Date(2026, 7, 18, 23, 59, 0));
  assert.equal(ms, 60 * 1000);
});

test('midnight itself is a full day away, never negative', () => {
  const ms = msUntilNextLocalDay(new Date(2026, 7, 18, 0, 0, 0));
  assert.equal(ms, 24 * 60 * 60 * 1000);
});

test('the clock is always eight characters wide', () => {
  assert.equal(formatCountdown(0), '00:00:00');
  assert.equal(formatCountdown(9 * 1000), '00:00:09');
  assert.equal(formatCountdown((5 * 3600 + 4 * 60 + 3) * 1000), '05:04:03');
  assert.equal(formatCountdown(-500), '00:00:00');
});

test('a positive subsecond remainder does not show as expired', () => {
  assert.equal(formatCountdown(1), '00:00:01');
  assert.equal(formatCountdown(999), '00:00:01');
});
