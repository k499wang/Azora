import test from 'node:test';
import assert from 'node:assert/strict';
import { formatProfileCount, formatProfileDuration } from './profileStatsFormat.ts';

test('counts stay readable as they grow past three and four digits', () => {
  assert.equal(formatProfileCount(0), '0');
  assert.equal(formatProfileCount(8), '8');
  assert.equal(formatProfileCount(142), '142');
  assert.equal(formatProfileCount(1247), '1,247');
  assert.equal(formatProfileCount(18406), '18,406');
  assert.equal(formatProfileCount(204913), '204,913');
});

test('durations report whole minutes, truncated rather than rounded up', () => {
  assert.equal(formatProfileDuration(0), '0m');
  assert.equal(formatProfileDuration(45), '0m');
  assert.equal(formatProfileDuration(60), '1m');
  assert.equal(formatProfileDuration(750), '12m');
  assert.equal(formatProfileDuration(3599), '59m');
});

test('durations past an hour keep counting in minutes', () => {
  assert.equal(formatProfileDuration(3600), '60m');
  assert.equal(formatProfileDuration(6420), '107m');
});

test('large minute totals stay separated', () => {
  assert.equal(formatProfileDuration(360000), '6,000m');
});
