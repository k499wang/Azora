import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHeartRateSessionRpcPayload } from './sessionPayload.ts';

function makeFrame(timestamp) {
  return {
    timestamp,
    rois: [
      {
        id: 'center',
        r: 120,
        g: 80,
        b: 25,
        saturatedPct: 0.02,
        darkPct: 0.01,
        variance: 120,
      },
    ],
  };
}

test('buildHeartRateSessionRpcPayload returns null when the capture result has no reading', () => {
  const payload = buildHeartRateSessionRpcPayload(
    [makeFrame(Date.parse('2026-04-25T12:00:00.000Z'))],
    {
      reading: null,
      error: 'low_confidence',
      ibiSamples: [],
    },
    { timezone: 'America/Toronto' },
  );

  assert.equal(payload, null);
});

test('buildHeartRateSessionRpcPayload matches complete_heart_rate_session RPC arg shape', () => {
  const startedAt = Date.parse('2026-04-25T02:29:00.000Z');
  const endedAt = Date.parse('2026-04-25T02:30:30.000Z');

  const payload = buildHeartRateSessionRpcPayload(
    [
      makeFrame(startedAt),
      makeFrame(startedAt + 30_000),
      makeFrame(endedAt),
    ],
    {
      reading: {
        bpm: 68,
        confidence: 0.88,
        sampleCount: 120,
        durationMs: 90_000,
        recordedAt: '2026-04-25T02:30:30.000Z',
        source: 'camera-flash',
        rmssd: 41,
        sdnn: 33,
        pnn50: 18,
        hrDrop: 7,
        beatCount: 16,
      },
      error: null,
      ibiSamples: [
        { offsetMs: 1_200, ibiMs: 1_000, signalQuality: 0.5 },
        { offsetMs: 1_800, ibiMs: 900, signalQuality: 0.7 },
        { offsetMs: 2_250, ibiMs: 800, signalQuality: 0.4 },
        { offsetMs: 2_950, ibiMs: 750, signalQuality: null },
      ],
    },
    { timezone: 'America/Toronto' },
  );

  assert.ok(payload, 'expected a payload');
  assert.deepEqual(payload.p_session, {
    started_at: '2026-04-25T02:29:00.000Z',
    ended_at: '2026-04-25T02:30:30.000Z',
    local_date: '2026-04-24',
    timezone: 'America/Toronto',
    duration_seconds: 90,
    avg_bpm: 71,
    min_bpm: 64,
    max_bpm: 78,
    rmssd: 41,
    sdnn: 33,
    pnn50: 18,
    hr_drop: 7,
    beat_count: 16,
    ibi_samples: [
      { offset_ms: 1_200, ibi_ms: 1_000, signal_quality: 0.5 },
      { offset_ms: 1_800, ibi_ms: 900, signal_quality: 0.7 },
      { offset_ms: 2_250, ibi_ms: 800, signal_quality: 0.4 },
      { offset_ms: 2_950, ibi_ms: 750, signal_quality: null },
    ],
  });

  assert.deepEqual(payload.p_samples, [
    { offset_ms: 1_000, bpm: 64, signal_quality: 0.6 },
    { offset_ms: 2_000, bpm: 78, signal_quality: 0.4 },
  ]);
});

test('buildHeartRateSessionRpcPayload falls back to the final reading when no BPM buckets can be derived', () => {
  const payload = buildHeartRateSessionRpcPayload(
    [
      makeFrame(Date.parse('2026-04-25T12:00:00.000Z')),
      makeFrame(Date.parse('2026-04-25T12:00:45.000Z')),
    ],
    {
      reading: {
        bpm: 62,
        confidence: 0.9,
        sampleCount: 150,
        durationMs: 45_000,
        recordedAt: '2026-04-25T12:00:45.000Z',
        source: 'camera-flash',
      },
      error: null,
      ibiSamples: [],
    },
    { timezone: 'UTC' },
  );

  assert.ok(payload, 'expected a payload');
  assert.equal(payload.p_session.avg_bpm, 62);
  assert.equal(payload.p_session.min_bpm, 62);
  assert.equal(payload.p_session.max_bpm, 62);
  assert.deepEqual(payload.p_session.ibi_samples, []);
  assert.deepEqual(payload.p_samples, []);
});
