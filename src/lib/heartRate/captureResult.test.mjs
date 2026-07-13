import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCaptureResult,
  deriveCaptureHrvResult,
  deriveIbiSampleHrvResult,
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

test('deriveIbiSampleHrvResult accepts clean high-BPM live intervals', () => {
  const ibiSamples = Array.from({ length: 36 }, (_, index) => {
    const ibiMs = 600 + (index % 2 === 0 ? 10 : -6);
    return {
      offsetMs: (index + 1) * ibiMs,
      ibiMs,
      signalQuality: 0.88,
    };
  });

  const result = deriveIbiSampleHrvResult(ibiSamples);

  assert.ok(result.hrvStats, 'expected HRV stats');
  assert.equal(result.hrvAvailabilityReason, null);
  assert.equal(result.correctedIbi.length, ibiSamples.length);
  assert.ok(result.hrvStats.meanHr >= 98 && result.hrvStats.meanHr <= 101);
});

test('deriveIbiSampleHrvResult rejects low-quality live intervals', () => {
  const ibiSamples = Array.from({ length: 36 }, (_, index) => ({
    offsetMs: (index + 1) * 600,
    ibiMs: 600,
    signalQuality: index % 3 === 0 ? 0.85 : 0.35,
  }));

  const result = deriveIbiSampleHrvResult(ibiSamples);

  assert.equal(result.hrvStats, null);
  assert.equal(result.hrvAvailabilityReason, 'low_signal_quality');
});

test('deriveIbiSampleHrvResult rejects artifact-heavy live intervals', () => {
  const ibiSamples = Array.from({ length: 36 }, (_, index) => ({
    offsetMs: (index + 1) * 600,
    ibiMs: index % 8 === 0 ? 360 : 600,
    signalQuality: 0.9,
  }));

  const result = deriveIbiSampleHrvResult(ibiSamples);

  assert.equal(result.hrvStats, null);
  assert.equal(result.hrvAvailabilityReason, 'low_signal_quality');
});

test('buildCaptureResult requires captured frame samples for the final analyzer', () => {
  const result = buildCaptureResult([]);

  assert.equal(result.reading, null);
  assert.equal(result.error, 'too_few_samples');
  assert.deepEqual(result.ibiSamples, []);
});

function makeCoveredFrames(count = 100) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    frames.push({
      timestamp: i * 33,
      rois: [{ id: 'center', r: 200, g: 20, b: 20, saturatedPct: 0, darkPct: 0, variance: 50 }],
    });
  }
  return frames;
}

test('buildCaptureResult quick mode uses the live BPM median as the final reading', () => {
  const presentationBpmSamples = [70, 71, 72, 72, 73, 74].map((bpm, i) => ({
    offsetMs: (i + 1) * 1000,
    bpm,
  }));

  const result = buildCaptureResult(makeCoveredFrames(), 'quick', { presentationBpmSamples });

  assert.equal(result.error, null);
  assert.ok(result.reading);
  assert.equal(result.reading.bpm, 72);
});

test('buildCaptureResult quick mode rejects captures when live never locked', () => {
  // Covered frames but no live samples: quick mode should not fall back to an
  // offline frequency estimate that can report low-end noise as a BPM.
  const result = buildCaptureResult(makeCoveredFrames(), 'quick', { presentationBpmSamples: [] });

  assert.equal(result.reading, null);
  assert.equal(result.error, 'not_enough_signal');
});

test('buildCaptureResult rejects a no-finger capture instead of reporting noise BPM', () => {
  // Frames with no red-dominant finger signal (e.g. lens open to a room), with
  // a slow brightness drift the frequency estimator could latch onto near the
  // bottom of the band.
  const samples = [];
  for (let i = 0; i < 900; i++) {
    const t = i * 33;
    const green = 90 + 20 * Math.sin((2 * Math.PI * t) / 1400);
    samples.push({
      timestamp: t,
      rois: [{ id: 'center', r: 70, g: green, b: 80, saturatedPct: 0, darkPct: 0, variance: 50 }],
    });
  }

  const result = buildCaptureResult(samples);

  assert.equal(result.reading, null);
  assert.equal(result.error, 'no_finger');
});
