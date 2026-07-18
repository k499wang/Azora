import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBreathingSessionCompletion } from './breathingSessionCompletion.ts';

const pattern = { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 };

test('builds completion timing, graph samples, and BPM summary', () => {
  const bpmSamples = [
    { offsetMs: 0, bpm: 72, signalQuality: 0.8 },
    { offsetMs: 1_000, bpm: 78, signalQuality: 0.9 },
    { offsetMs: 2_000, bpm: 84, signalQuality: null },
  ];

  const completion = buildBreathingSessionCompletion({
    pattern,
    rounds: 4,
    startedAtMs: 1_000,
    endedAtMs: 65_400,
    fallbackElapsedSeconds: 60,
    bpmSamples,
  });

  assert.equal(completion.startedAtMs, 1_000);
  assert.equal(completion.endedAtMs, 65_400);
  assert.equal(completion.durationSeconds, 64);
  assert.equal(completion.targetSeconds, 64);
  assert.deepEqual(completion.bpmSamples, bpmSamples);
  assert.deepEqual(completion.graphSamples, [
    { offsetMs: 0, bpm: 72 },
    { offsetMs: 1_000, bpm: 78 },
    { offsetMs: 2_000, bpm: 84 },
  ]);
  assert.deepEqual(completion.bpmSummary, {
    avgBpm: 78,
    minBpm: 72,
    maxBpm: 84,
    hrDropBpm: 12,
  });
});

test('retains exactly two BPM samples', () => {
  const completion = buildBreathingSessionCompletion({
    pattern,
    rounds: 1,
    startedAtMs: 1_000,
    endedAtMs: 17_000,
    fallbackElapsedSeconds: 16,
    bpmSamples: [
      { offsetMs: 0, bpm: 70, signalQuality: 0.7 },
      { offsetMs: 1_000, bpm: 72, signalQuality: 0.8 },
    ],
  });

  assert.equal(completion.bpmSamples.length, 2);
  assert.equal(completion.bpmSummary.avgBpm, 71);
});

test('discards a lone BPM sample before graphing and persistence', () => {
  const completion = buildBreathingSessionCompletion({
    pattern,
    rounds: 1,
    startedAtMs: 1_000,
    endedAtMs: 17_000,
    fallbackElapsedSeconds: 16,
    bpmSamples: [{ offsetMs: 0, bpm: 70, signalQuality: 0.7 }],
  });

  assert.deepEqual(completion.bpmSamples, []);
  assert.deepEqual(completion.graphSamples, []);
  assert.deepEqual(completion.bpmSummary, {
    avgBpm: null,
    minBpm: null,
    maxBpm: null,
    hrDropBpm: null,
  });
});

test('uses the end timestamp and elapsed fallback when no start was recorded', () => {
  const completion = buildBreathingSessionCompletion({
    pattern,
    rounds: 1,
    startedAtMs: 0,
    endedAtMs: 17_000,
    fallbackElapsedSeconds: 12,
    bpmSamples: [],
  });

  assert.equal(completion.startedAtMs, 17_000);
  assert.equal(completion.durationSeconds, 12);
});

test('preserves raw samples while excluding invalid BPM from the summary', () => {
  const completion = buildBreathingSessionCompletion({
    pattern,
    rounds: 1,
    startedAtMs: 1_000,
    endedAtMs: 17_000,
    fallbackElapsedSeconds: 16,
    bpmSamples: [
      { offsetMs: 0, bpm: 72, signalQuality: 0.8 },
      { offsetMs: 1_000, bpm: 300, signalQuality: 0.9 },
    ],
  });

  assert.equal(completion.bpmSamples.length, 2);
  assert.equal(completion.graphSamples.length, 2);
  assert.deepEqual(completion.bpmSummary, {
    avgBpm: 72,
    minBpm: 72,
    maxBpm: 72,
    hrDropBpm: 0,
  });
});

test('does not alias or mutate collected BPM samples', () => {
  const sample = { offsetMs: 0, bpm: 72, signalQuality: 0.8 };
  const bpmSamples = [
    sample,
    { offsetMs: 1_000, bpm: 74, signalQuality: 0.9 },
  ];

  const completion = buildBreathingSessionCompletion({
    pattern,
    rounds: 1,
    startedAtMs: 1_000,
    endedAtMs: 17_000,
    fallbackElapsedSeconds: 16,
    bpmSamples,
  });

  assert.notEqual(completion.bpmSamples, bpmSamples);
  assert.notEqual(completion.bpmSamples[0], sample);
  assert.deepEqual(bpmSamples[0], sample);
});
