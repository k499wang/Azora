import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBreathHoldCompletion } from './breathHoldCompletion.ts';

const bpmSamples = [
  { offset_ms: 0, bpm: 72, signal_quality: 0.8 },
  { offset_ms: 1_000, bpm: 78, signal_quality: 0.9 },
  { offset_ms: 2_000, bpm: 84, signal_quality: null },
];

test('builds one completion model for navigation and persistence', () => {
  const completion = buildBreathHoldCompletion({
    holdSeconds: 45,
    previousBestSeconds: 40,
    measuredStartedAtMs: 1_000,
    holdStartedAtMs: 10_000,
    endedAtMs: 55_000,
    hasReading: true,
    captureSampleCount: 900,
    bpmSamples,
  });

  assert.equal(completion.startedAtMs, 1_000);
  assert.equal(completion.sessionKey, '1000:55000:45:900:3');
  assert.equal(completion.isNewBest, true);
  assert.equal(completion.bestHoldSeconds, 45);
  assert.deepEqual(
    {
      avgBpm: completion.avgBpm,
      minBpm: completion.minBpm,
      maxBpm: completion.maxBpm,
    },
    { avgBpm: 78, minBpm: 72, maxBpm: 84 },
  );
  assert.equal(completion.heartRateResultStatus, 'available');
  assert.deepEqual(completion.graphSamples, [
    { offsetMs: 0, bpm: 72 },
    { offsetMs: 1_000, bpm: 78 },
    { offsetMs: 2_000, bpm: 84 },
  ]);
  assert.deepEqual(completion.persistenceSamples[2], {
    offsetMs: 2_000,
    bpm: 84,
    signalQuality: null,
  });
  assert.equal(Number.isFinite(completion.azoraScore), true);
});

test('uses hold start when camera measurement did not start earlier', () => {
  const completion = buildBreathHoldCompletion({
    holdSeconds: 20,
    previousBestSeconds: 30,
    measuredStartedAtMs: 0,
    holdStartedAtMs: 5_000,
    endedAtMs: 25_000,
    hasReading: false,
    captureSampleCount: 0,
    bpmSamples: [],
  });

  assert.equal(completion.startedAtMs, 5_000);
  assert.equal(completion.isNewBest, false);
  assert.equal(completion.bestHoldSeconds, 30);
  assert.equal(completion.avgBpm, null);
  assert.equal(completion.heartRateResultStatus, 'not_measured');
});

test('distinguishes an attempted measurement with too few reliable beats', () => {
  const completion = buildBreathHoldCompletion({
    holdSeconds: 20,
    previousBestSeconds: 0,
    measuredStartedAtMs: 1_000,
    holdStartedAtMs: 5_000,
    endedAtMs: 25_000,
    hasReading: false,
    captureSampleCount: 20,
    bpmSamples: [],
  });

  assert.equal(completion.avgBpm, null);
  assert.equal(completion.heartRateResultStatus, 'insufficient_beats');
});

test('marks invalid timing as non-persistable without losing result data', () => {
  const completion = buildBreathHoldCompletion({
    holdSeconds: 25,
    previousBestSeconds: 0,
    measuredStartedAtMs: 0,
    holdStartedAtMs: 10_000,
    endedAtMs: 9_000,
    hasReading: false,
    captureSampleCount: 0,
    bpmSamples,
  });

  assert.equal(completion.startedAtMs, null);
  assert.equal(completion.sessionKey, null);
  assert.equal(completion.isNewBest, true);
  assert.equal(completion.graphSamples.length, 3);
});

test('returns detached sample arrays', () => {
  const samples = [...bpmSamples];
  const completion = buildBreathHoldCompletion({
    holdSeconds: 20,
    previousBestSeconds: 0,
    measuredStartedAtMs: 1_000,
    holdStartedAtMs: 2_000,
    endedAtMs: 22_000,
    hasReading: true,
    captureSampleCount: 100,
    bpmSamples: samples,
  });

  assert.notEqual(completion.graphSamples, samples);
  assert.notEqual(completion.persistenceSamples, samples);
  assert.deepEqual(samples, bpmSamples);
});
