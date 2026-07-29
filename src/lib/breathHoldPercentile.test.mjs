import test from 'node:test';
import assert from 'node:assert/strict';
import { benchmarkBreathHold } from './breathHoldPercentile.ts';

test('a hold at the peer median lands at the 50th percentile', () => {
  const result = benchmarkBreathHold(46, 22);
  assert.equal(result.peerMedianSeconds, 46);
  assert.equal(result.percentile, 50);
});

test('the same hold ranks higher for an older age band', () => {
  const young = benchmarkBreathHold(60, 22);
  const older = benchmarkBreathHold(60, 68);
  assert.ok(older.percentile > young.percentile);
});

test('long holds report a top-percent label', () => {
  const result = benchmarkBreathHold(120, 30);
  assert.ok(result.percentile > 90);
  assert.equal(result.label, `Top ${result.topPercent}% of people your age`);
});

test('short holds report how many peers they beat', () => {
  const result = benchmarkBreathHold(12, 30);
  assert.ok(result.percentile < 50);
  assert.equal(result.label, `Ahead of ${result.percentile}% of people your age`);
});

test('percentiles stay inside 1-99 at the extremes', () => {
  assert.equal(benchmarkBreathHold(0, 30).percentile, 1);
  assert.equal(benchmarkBreathHold(600, 30).percentile, 99);
});
