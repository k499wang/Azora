import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCaptureResult,
  deriveCaptureHrvResult,
  deriveLiveIbiHrvResult,
} from './captureResult.ts';

function makeBeatSeries(ibiMs, overrides = {}) {
  const beatTimestamps = [1_000];
  for (const ibi of ibiMs) {
    beatTimestamps.push(beatTimestamps[beatTimestamps.length - 1] + ibi);
  }

  return {
    beatTimestamps,
    ibiMs,
    adjacencyBreaks: ibiMs.map(() => false),
    roiId: 'center',
    channel: 'weighted',
    confidence: 0.82,
    quality: 'good',
    snrDb: 8,
    frequencyBpm: 75,
    peakBpm: 75,
    rawIntervalCount: ibiMs.length,
    rejectedIntervalCount: 0,
    ...overrides,
  };
}

test('deriveCaptureHrvResult returns unavailable HRV instead of zero stats for unstable intervals', () => {
  const ibiMs = Array.from({ length: 18 }, (_, index) => 800 + (index % 4));
  ibiMs.splice(8, 2, 392, 805);

  const result = deriveCaptureHrvResult(makeBeatSeries(ibiMs));

  assert.equal(result.hrvStats, null);
  assert.deepEqual(result.correctedIbi, []);
  assert.equal(result.hrvAvailabilityReason, 'low_signal_quality');
});

test('deriveCaptureHrvResult returns HRV stats for usable cleaned intervals', () => {
  const ibiMs = Array.from({ length: 20 }, (_, index) => 800 + (index % 2 === 0 ? 12 : -8));

  const result = deriveCaptureHrvResult(makeBeatSeries(ibiMs));

  assert.ok(result.hrvStats, 'expected HRV stats');
  assert.equal(result.hrvAvailabilityReason, null);
  assert.equal(result.correctedIbi.length, ibiMs.length);
  assert.ok(result.hrvStats.rmssd > 0);
});

test('deriveLiveIbiHrvResult derives full-window HRV from live IBI samples', () => {
  const liveIbiSamples = Array.from({ length: 20 }, (_, index) => {
    const ibiMs = 800 + (index % 2 === 0 ? 12 : -8);
    return {
      offsetMs: (index + 1) * ibiMs,
      ibiMs,
      signalQuality: 0.8,
    };
  });

  const result = deriveLiveIbiHrvResult(liveIbiSamples);

  assert.ok(result.hrvStats, 'expected live HRV stats');
  assert.equal(result.hrvAvailabilityReason, null);
  assert.equal(result.correctedIbi.length, liveIbiSamples.length);
  assert.equal(result.avgBpm, 75);
});

test('buildCaptureResult can use live full-window IBIs for reading and HRV stats', () => {
  const liveIbiSamples = Array.from({ length: 20 }, (_, index) => ({
    offsetMs: (index + 1) * 800,
    ibiMs: 800,
    signalQuality: 0.75,
  }));

  const result = buildCaptureResult([], liveIbiSamples, {
    preferLiveIbiSamples: true,
  });

  assert.ok(result.reading, 'expected a reading from live IBIs');
  assert.equal(result.reading.bpm, 75);
  assert.equal(result.reading.beatCount, 20);
  assert.equal(result.error, null);
  assert.equal(result.ibiSamples.length, 20);
});

test('buildCaptureResult keeps the offline capture path by default', () => {
  const liveIbiSamples = Array.from({ length: 20 }, (_, index) => ({
    offsetMs: (index + 1) * 800,
    ibiMs: 800,
    signalQuality: 0.75,
  }));

  const result = buildCaptureResult([], liveIbiSamples);

  assert.equal(result.reading, null);
  assert.equal(result.error, 'too_few_samples');
  assert.deepEqual(result.ibiSamples, []);
});
