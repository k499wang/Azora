import test from 'node:test';
import assert from 'node:assert/strict';
import { computeHRVStats, preprocessHRVIntervals } from './hrv.ts';

function rawRmssd(ibi) {
  if (ibi.length < 2) return 0;
  let sumSq = 0;
  for (let i = 1; i < ibi.length; i++) {
    const diff = ibi[i] - ibi[i - 1];
    sumSq += diff * diff;
  }
  return Math.round(Math.sqrt(sumSq / (ibi.length - 1)));
}

test('preprocessHRVIntervals removes abnormal beat artifacts and marks adjacency breaks', () => {
  const input = Array.from({ length: 45 }, (_, index) => 800 + (index % 5));
  input.splice(20, 1, 392, 805);
  const result = preprocessHRVIntervals(input);

  assert.equal(result.correctedIbi.length, input.length - 2);
  assert.deepEqual(result.artifactIndices, [20, 21]);
  assert.equal(result.correctedIbi.includes(392), false);
  assert.equal(result.adjacencyBreaks[20], true);
});

test('preprocessHRVIntervals leaves a clean beat train unchanged', () => {
  const input = [802, 799, 804, 801, 803, 800];
  const result = preprocessHRVIntervals(input);

  assert.deepEqual(result.artifactIndices, []);
  assert.deepEqual(result.correctedIbi, input);
  assert.deepEqual(result.adjacencyBreaks, [false, false, false, false, false, false]);
});

test('computeHRVStats skips artifact intervals instead of interpolating fake IBIs', () => {
  const input = Array.from({ length: 45 }, (_, index) => 800 + (index % 5));
  input.splice(20, 1, 392, 805);
  const raw = rawRmssd(input);
  const stats = computeHRVStats(input);

  assert.ok(raw > 80, `expected raw RMSSD to be artifact-inflated, got ${raw}`);
  assert.ok(stats.rmssd < 60, `expected corrected RMSSD to stay physiologic, got ${stats.rmssd}`);
  assert.ok(stats.rmssd < raw / 4, `expected cleaned RMSSD to be much smaller than raw RMSSD, got ${stats.rmssd} vs ${raw}`);
  assert.equal(stats.beatCount, input.length - 2);
});
