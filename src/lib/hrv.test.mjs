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

test('preprocessHRVIntervals interpolates abnormal beat artifacts', () => {
  const input = [800, 804, 806, 392, 805, 802, 799, 801];
  const result = preprocessHRVIntervals(input);

  assert.equal(result.correctedIbi.length, input.length);
  assert.ok(result.artifactIndices.includes(3), `expected short artifact interval to be detected, got ${result.artifactIndices}`);
  assert.ok(result.correctedIbi[3] > 790 && result.correctedIbi[3] < 820);
});

test('preprocessHRVIntervals leaves a clean beat train unchanged', () => {
  const input = [802, 799, 804, 801, 803, 800];
  const result = preprocessHRVIntervals(input);

  assert.deepEqual(result.artifactIndices, []);
  assert.deepEqual(result.correctedIbi, input);
});

test('computeHRVStats uses corrected IBIs instead of raw artifact spikes', () => {
  const input = [800, 804, 392, 1_210, 802, 799];
  const raw = rawRmssd(input);
  const stats = computeHRVStats(input);

  assert.ok(raw > 250, `expected raw RMSSD to be artifact-inflated, got ${raw}`);
  assert.ok(stats.rmssd < 60, `expected corrected RMSSD to stay physiologic, got ${stats.rmssd}`);
  assert.ok(stats.rmssd < raw / 4, `expected corrected RMSSD to be much smaller than raw RMSSD, got ${stats.rmssd} vs ${raw}`);
  assert.equal(stats.beatCount, input.length);
});
