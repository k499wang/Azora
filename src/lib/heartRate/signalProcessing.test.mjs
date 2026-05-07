import test from 'node:test';
import assert from 'node:assert/strict';
import { computeHRVStats } from '../hrv.ts';
import {
  buildIbiSamplesFromCaptureBeatSeries,
  extractBestCaptureBeatSeries,
} from './signalProcessing.ts';

const FRAME_SPACING_MS = 1000 / 30;
const CAPTURE_DURATION_MS = 45000;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function buildCaptureSamples() {
  const samples = [];
  let phase = 0;

  for (let timestamp = 0; timestamp <= CAPTURE_DURATION_MS; timestamp += FRAME_SPACING_MS) {
    const bpm = 75 + 4.5 * Math.sin(timestamp / 4200) + 2.5 * Math.sin(timestamp / 1650);
    phase += 2 * Math.PI * (bpm / 60) * (FRAME_SPACING_MS / 1000);

    const pulse =
      Math.sin(phase) +
      0.38 * Math.sin(phase * 2 - 0.7) +
      0.18 * Math.sin(phase * 3 - 1.1);
    const redNoise = 10 * Math.sin(timestamp / 110) + 5.5 * Math.sin(timestamp / 47);
    const slowDrift = 3 * Math.sin(timestamp / 1200);
    const tailArtifact =
      timestamp >= CAPTURE_DURATION_MS - 900
        ? 12 * Math.sin(timestamp / 18) + 6 * Math.sin(timestamp / 9)
        : 0;

    samples.push({
      timestamp,
      rois: [
        {
          id: 'center',
          r: 72 + redNoise,
          g: 112 + slowDrift + pulse * 36 + tailArtifact,
          b: 18 + slowDrift * 0.25,
          saturatedPct: 0.03,
          darkPct: 0.01,
          variance: 120 + Math.abs(pulse) * 25,
        },
        {
          id: 'full',
          r: 20,
          g: 12,
          b: 8,
          saturatedPct: 0.08,
          darkPct: 0.78,
          variance: 12,
        },
      ],
    });
  }

  return samples;
}

test('extractBestCaptureBeatSeries chooses the strongest ROI/channel beat series for HRV', () => {
  const samples = buildCaptureSamples();
  const beatSeries = extractBestCaptureBeatSeries(samples);

  assert.ok(beatSeries, 'expected a beat series');
  assert.equal(beatSeries.roiId, 'center');
  assert.equal(beatSeries.channel, 'weighted');
  assert.ok(beatSeries.ibiMs.length >= 20, `expected many HRV intervals, got ${beatSeries.ibiMs.length}`);
  assert.ok(
    beatSeries.beatTimestamps[beatSeries.beatTimestamps.length - 1] <= CAPTURE_DURATION_MS - 1450,
    `expected HRV beat series to stop before noisy tail, got ${beatSeries.beatTimestamps[beatSeries.beatTimestamps.length - 1]}`,
  );
  assert.ok(
    Math.min(...beatSeries.ibiMs) > 500,
    `expected cleanup to avoid implausibly short HRV intervals, got ${Math.min(...beatSeries.ibiMs)}`,
  );

  const medianIbi = median(beatSeries.ibiMs);
  assert.ok(
    Math.abs(medianIbi - 800) < 70,
    `expected median IBI near 800ms, got ${medianIbi}`,
  );
});

test('batch beat series produces enough clean intervals for HRV stats', () => {
  const samples = buildCaptureSamples();
  const beatSeries = extractBestCaptureBeatSeries(samples);

  assert.ok(beatSeries, 'expected batch beat series');
  const stats = computeHRVStats(beatSeries.ibiMs);

  assert.ok(stats.rmssd > 0, `expected RMSSD > 0, got ${stats.rmssd}`);
  assert.ok(stats.sdnn > 0, `expected SDNN > 0, got ${stats.sdnn}`);
  assert.ok(
    stats.beatCount >= 12,
    `expected enough beats for HRV, got ${stats.beatCount}`,
  );
});

test('buildIbiSamplesFromCaptureBeatSeries maps final batch beats to persisted IBI samples', () => {
  const beatSeries = {
    beatTimestamps: [1_500.4, 2_300.2, 3_085.7, 3_910.1],
    ibiMs: [799.8, 785.5, 824.4],
    roiId: 'center',
    channel: 'weighted',
    confidence: 0.73,
    quality: 'good',
    snrDb: 8.2,
    frequencyBpm: 74,
    peakBpm: 75,
    rawIntervalCount: 3,
    rejectedIntervalCount: 0,
  };

  assert.deepEqual(
    buildIbiSamplesFromCaptureBeatSeries(beatSeries, 1_000),
    [
      { offsetMs: 1_300, ibiMs: 800, signalQuality: 0.73 },
      { offsetMs: 2_086, ibiMs: 786, signalQuality: 0.73 },
      { offsetMs: 2_910, ibiMs: 824, signalQuality: 0.73 },
    ],
  );
});
