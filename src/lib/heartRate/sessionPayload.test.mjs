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
        stress: 29,
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
    avg_bpm: 68,
    min_bpm: 70,
    max_bpm: 70,
    rmssd: 41,
    sdnn: 33,
    pnn50: 18,
    hr_drop: 7,
    beat_count: 16,
    stress: 29,
    ibi_samples: [
      { offset_ms: 1_200, ibi_ms: 1_000, signal_quality: 0.5 },
      { offset_ms: 1_800, ibi_ms: 900, signal_quality: 0.7 },
      { offset_ms: 2_250, ibi_ms: 800, signal_quality: 0.4 },
      { offset_ms: 2_950, ibi_ms: 750, signal_quality: null },
    ],
    idempotency_key: '2026-04-25T02:30:30.000Z:68:120:90000',
  });

  assert.deepEqual(payload.p_samples, [
    { offset_ms: 1_200, bpm: 70, signal_quality: 0.5 },
    { offset_ms: 1_800, bpm: 70, signal_quality: 0.7 },
    { offset_ms: 2_250, bpm: 70, signal_quality: 0.4 },
    { offset_ms: 2_950, bpm: 70, signal_quality: null },
  ]);
});

test('buildHeartRateSessionRpcPayload uses presentation BPM for graph samples and summary', () => {
  const startedAt = Date.parse('2026-04-25T02:29:00.000Z');
  const endedAt = Date.parse('2026-04-25T02:30:00.000Z');

  const payload = buildHeartRateSessionRpcPayload(
    [
      makeFrame(startedAt),
      makeFrame(endedAt),
    ],
    {
      reading: {
        bpm: 67,
        confidence: 0.88,
        sampleCount: 120,
        durationMs: 60_000,
        recordedAt: '2026-04-25T02:30:00.000Z',
        source: 'camera-flash',
      },
      error: null,
      ibiSamples: [
        { offsetMs: 1_000, ibiMs: 900, signalQuality: 0.8 },
        { offsetMs: 2_000, ibiMs: 895, signalQuality: 0.8 },
        { offsetMs: 3_000, ibiMs: 600, signalQuality: 0.8 },
        { offsetMs: 4_000, ibiMs: 900, signalQuality: 0.8 },
        { offsetMs: 5_000, ibiMs: 905, signalQuality: 0.8 },
        { offsetMs: 6_000, ibiMs: 910, signalQuality: 0.8 },
      ],
    },
    { timezone: 'UTC' },
  );

  assert.ok(payload, 'expected a payload');
  assert.deepEqual(payload.p_samples.map((sample) => sample.bpm), [73, 71, 70, 70, 71, 72]);
  assert.equal(payload.p_session.min_bpm, 70);
  assert.equal(payload.p_session.max_bpm, 73);
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
  assert.equal(payload.p_session.stress, null);
  assert.deepEqual(payload.p_session.ibi_samples, []);
  assert.deepEqual(payload.p_samples, []);
});

function buildReading(recordedAt, durationMs, overrides = {}) {
  return {
    bpm: 70,
    confidence: 0.9,
    sampleCount: 100,
    durationMs,
    recordedAt,
    source: 'camera-flash',
    ...overrides,
  };
}

test('frame timestamps from a monotonic clock (post-boot ms) still produce a today-correct local_date', () => {
  // Simulates the real-world bug: vision-camera frame.timestamp is ms since boot,
  // not Unix epoch. A device on for ~3 days reports timestamps near 259_200_000.
  // Pre-fix this produced local_date='1970-01-04'; post-fix recordedAt anchors it.
  const monotonicStart = 259_200_000;
  const monotonicEnd = monotonicStart + 30_000;
  const realRecordedAt = '2026-05-08T18:20:30.000Z';

  const payload = buildHeartRateSessionRpcPayload(
    [makeFrame(monotonicStart), makeFrame(monotonicEnd)],
    {
      reading: buildReading(realRecordedAt, 30_000),
      error: null,
      ibiSamples: [],
    },
    { timezone: 'America/Toronto' },
  );

  assert.ok(payload, 'expected a payload');
  assert.equal(payload.p_session.ended_at, '2026-05-08T18:20:30.000Z');
  assert.equal(payload.p_session.started_at, '2026-05-08T18:20:00.000Z');
  assert.equal(payload.p_session.local_date, '2026-05-08');
  assert.equal(payload.p_session.duration_seconds, 30);
});

test('local_date reflects the user timezone, not UTC, for the same UTC moment', () => {
  // 2026-05-09 03:30 UTC = 2026-05-08 23:30 in Toronto = 2026-05-09 04:30 in London.
  const recordedAt = '2026-05-09T03:30:00.000Z';
  const frames = [makeFrame(1000), makeFrame(11000)];
  const reading = buildReading(recordedAt, 10_000);

  const torontoPayload = buildHeartRateSessionRpcPayload(
    frames, { reading, error: null, ibiSamples: [] }, { timezone: 'America/Toronto' },
  );
  const londonPayload = buildHeartRateSessionRpcPayload(
    frames, { reading, error: null, ibiSamples: [] }, { timezone: 'Europe/London' },
  );
  const tokyoPayload = buildHeartRateSessionRpcPayload(
    frames, { reading, error: null, ibiSamples: [] }, { timezone: 'Asia/Tokyo' },
  );

  // ended_at is identical (UTC), but local_date differs per tz.
  assert.equal(torontoPayload.p_session.ended_at, '2026-05-09T03:30:00.000Z');
  assert.equal(londonPayload.p_session.ended_at, '2026-05-09T03:30:00.000Z');
  assert.equal(tokyoPayload.p_session.ended_at, '2026-05-09T03:30:00.000Z');

  assert.equal(torontoPayload.p_session.local_date, '2026-05-08');
  assert.equal(londonPayload.p_session.local_date, '2026-05-09');
  assert.equal(tokyoPayload.p_session.local_date, '2026-05-09');
});

test('session crossing midnight is attributed to the day it ended on', () => {
  // Started 2026-05-08 23:59:55 EDT (= 03:59:55 UTC May 9)
  // Ended   2026-05-09 00:00:05 EDT (= 04:00:05 UTC May 9)
  const recordedAt = '2026-05-09T04:00:05.000Z';
  const payload = buildHeartRateSessionRpcPayload(
    [makeFrame(500_000), makeFrame(510_000)],
    {
      reading: buildReading(recordedAt, 10_000),
      error: null,
      ibiSamples: [],
    },
    { timezone: 'America/Toronto' },
  );

  assert.ok(payload);
  assert.equal(payload.p_session.started_at, '2026-05-09T03:59:55.000Z');
  assert.equal(payload.p_session.ended_at, '2026-05-09T04:00:05.000Z');
  // local_date is computed from ended_at — the day the user finished.
  assert.equal(payload.p_session.local_date, '2026-05-09');
  assert.equal(payload.p_session.duration_seconds, 10);
});

test('session entirely before midnight stays on the prior local day even when UTC is the next day', () => {
  // 2026-05-09 03:30:00 UTC = 2026-05-08 23:30 EDT — local day is still May 8.
  const payload = buildHeartRateSessionRpcPayload(
    [makeFrame(1000), makeFrame(31_000)],
    {
      reading: buildReading('2026-05-09T03:30:00.000Z', 30_000),
      error: null,
      ibiSamples: [],
    },
    { timezone: 'America/Toronto' },
  );

  assert.ok(payload);
  assert.equal(payload.p_session.local_date, '2026-05-08');
});

test('DST spring-forward: 02:30 EST → 03:30 EDT — local_date is unaffected', () => {
  // US DST 2026 starts 2026-03-08 02:00 local. A session ending at 06:30 UTC
  // is 02:30 EST (pre-jump) or 02:30 → 03:30 EDT (post-jump). Either way the
  // calendar day is March 8. Intl.DateTimeFormat handles the offset correctly.
  const payload = buildHeartRateSessionRpcPayload(
    [makeFrame(0), makeFrame(60_000)],
    {
      reading: buildReading('2026-03-08T07:00:00.000Z', 60_000),
      error: null,
      ibiSamples: [],
    },
    { timezone: 'America/New_York' },
  );

  assert.ok(payload);
  // 07:00 UTC March 8 is 03:00 EDT after spring-forward → still March 8 locally.
  assert.equal(payload.p_session.local_date, '2026-03-08');
});

test('DST fall-back: ambiguous local 01:30 — both UTC moments still resolve to the same local_date', () => {
  // 2026-11-01: at 02:00 EDT, clocks fall back to 01:00 EST. "01:30" happens twice.
  // First 01:30 = 05:30 UTC (still EDT). Second 01:30 = 06:30 UTC (now EST).
  // Both share the same calendar day Nov 1.
  const firstPayload = buildHeartRateSessionRpcPayload(
    [makeFrame(0), makeFrame(60_000)],
    {
      reading: buildReading('2026-11-01T05:30:00.000Z', 60_000),
      error: null,
      ibiSamples: [],
    },
    { timezone: 'America/New_York' },
  );
  const secondPayload = buildHeartRateSessionRpcPayload(
    [makeFrame(0), makeFrame(60_000)],
    {
      reading: buildReading('2026-11-01T06:30:00.000Z', 60_000),
      error: null,
      ibiSamples: [],
    },
    { timezone: 'America/New_York' },
  );

  assert.equal(firstPayload.p_session.local_date, '2026-11-01');
  assert.equal(secondPayload.p_session.local_date, '2026-11-01');
});

test('travel across timezones: same user, different tz on each session, dates follow the device', () => {
  // Toronto morning then Tokyo evening (~12 hours later, well into next Toronto day).
  const torontoSession = buildHeartRateSessionRpcPayload(
    [makeFrame(0), makeFrame(30_000)],
    {
      reading: buildReading('2026-05-08T14:00:00.000Z', 30_000),
      error: null,
      ibiSamples: [],
    },
    { timezone: 'America/Toronto' },
  );
  const tokyoSession = buildHeartRateSessionRpcPayload(
    [makeFrame(0), makeFrame(30_000)],
    {
      reading: buildReading('2026-05-09T02:00:00.000Z', 30_000),
      error: null,
      ibiSamples: [],
    },
    { timezone: 'Asia/Tokyo' },
  );

  assert.equal(torontoSession.p_session.local_date, '2026-05-08'); // 10:00 EDT May 8
  assert.equal(tokyoSession.p_session.local_date, '2026-05-09');   // 11:00 JST May 9
});

test('malformed recordedAt falls back to current time without throwing', () => {
  const before = Date.now();
  const payload = buildHeartRateSessionRpcPayload(
    [makeFrame(1000), makeFrame(11_000)],
    {
      reading: buildReading('not-a-real-timestamp', 10_000),
      error: null,
      ibiSamples: [],
    },
    { timezone: 'UTC' },
  );
  const after = Date.now();

  assert.ok(payload, 'expected a payload despite bad recordedAt');
  const endedAtMs = Date.parse(payload.p_session.ended_at);
  assert.ok(endedAtMs >= before && endedAtMs <= after,
    `ended_at (${payload.p_session.ended_at}) should fall within [${new Date(before).toISOString()}, ${new Date(after).toISOString()}]`);
});

test('duration is derived from frame deltas, not from wall-clock anchors — robust to monotonic frame timestamps', () => {
  // Frame timestamps in monotonic clock (ms since boot, ~5 days uptime).
  // Wall-clock recordedAt is a real ISO string. Duration must match the frame delta,
  // not (recordedAt - first frame).
  const monotonicStart = 432_000_000; // ~5 days
  const monotonicEnd = monotonicStart + 45_000;

  const payload = buildHeartRateSessionRpcPayload(
    [makeFrame(monotonicStart), makeFrame(monotonicEnd)],
    {
      reading: buildReading('2026-05-08T18:20:30.000Z', 45_000),
      error: null,
      ibiSamples: [],
    },
    { timezone: 'UTC' },
  );

  assert.ok(payload);
  assert.equal(payload.p_session.duration_seconds, 45);
  // started_at must be ended_at − 45s, not derived from frame timestamps.
  assert.equal(payload.p_session.started_at, '2026-05-08T18:19:45.000Z');
  assert.equal(payload.p_session.ended_at, '2026-05-08T18:20:30.000Z');
});

test('IBI offset_ms values are session-relative durations and are unaffected by wall-clock changes', () => {
  // Two payloads built from the same IBI samples but with very different recordedAt
  // and frame timestamps. The persisted offset_ms values must be identical — they
  // describe time within the session, not absolute time.
  const ibiSamples = [
    { offsetMs: 1_000, ibiMs: 900, signalQuality: 0.8 },
    { offsetMs: 1_900, ibiMs: 850, signalQuality: 0.8 },
    { offsetMs: 2_750, ibiMs: 870, signalQuality: 0.8 },
  ];

  const earlyPayload = buildHeartRateSessionRpcPayload(
    [makeFrame(100), makeFrame(3000)],
    {
      reading: buildReading('2026-01-01T00:00:00.000Z', 2_900),
      error: null,
      ibiSamples,
    },
    { timezone: 'UTC' },
  );
  const latePayload = buildHeartRateSessionRpcPayload(
    [makeFrame(900_000_000), makeFrame(900_002_900)],
    {
      reading: buildReading('2030-12-31T23:59:00.000Z', 2_900),
      error: null,
      ibiSamples,
    },
    { timezone: 'Asia/Tokyo' },
  );

  assert.deepEqual(
    earlyPayload.p_session.ibi_samples.map((s) => s.offset_ms),
    [1_000, 1_900, 2_750],
  );
  assert.deepEqual(
    earlyPayload.p_session.ibi_samples.map((s) => s.offset_ms),
    latePayload.p_session.ibi_samples.map((s) => s.offset_ms),
  );
});
