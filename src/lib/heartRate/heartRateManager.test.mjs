import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HeartRateManager,
  interpolatePeakTimestamp,
  medianOfRecent,
} from './heartRateManager.ts';

const FRAME_SPACING_MS = 33;
const WARMUP_FRAMES = 60;
const BASELINE_WEIGHTED = 100;
const BEAT_WEIGHTED = 140;

function makeFrame(timestamp, weighted) {
  const g = Math.max(1, weighted * 0.1);
  const b = Math.max(1, weighted * 0.05);
  const r = (weighted - g * 0.33) / 0.67;
  return {
    timestamp,
    rois: [
      { id: 'roi-0', r, g, b, saturatedPct: 0, darkPct: 0, variance: 100 },
    ],
  };
}

function makeNoFingerFrame(timestamp) {
  return { timestamp, rois: [] };
}

function runBeatTrain(manager, beatFrameOffsets, startTime = 0) {
  const beatSet = new Set(beatFrameOffsets);
  let t = startTime;
  for (let i = 0; i < WARMUP_FRAMES; i++) {
    manager.processFrame(makeFrame(t, BASELINE_WEIGHTED));
    t += FRAME_SPACING_MS;
  }
  const lastBeat = Math.max(...beatFrameOffsets, 0);
  const totalPostWarmupFrames = lastBeat + 15;
  for (let i = 0; i < totalPostWarmupFrames; i++) {
    const weighted = beatSet.has(i) ? BEAT_WEIGHTED : BASELINE_WEIGHTED;
    manager.processFrame(makeFrame(t, weighted));
    t += FRAME_SPACING_MS;
  }
  return t;
}

test('interpolatePeakTimestamp: symmetric peak returns t2', () => {
  const peakTs = interpolatePeakTimestamp(0.5, 1.0, 0.5, 0, 33, 66);
  assert.equal(peakTs, 33);
});

test('interpolatePeakTimestamp: asymmetric peak shifts toward larger side', () => {
  const peakTs = interpolatePeakTimestamp(0.8, 1.0, 0.6, 0, 33, 66);
  const denom = 0.8 - 2 * 1.0 + 0.6;
  const offset = (0.5 * (0.8 - 0.6)) / denom;
  const expected = 33 + offset * ((66 - 0) / 2);
  assert.ok(Math.abs(peakTs - expected) < 1e-9);
  assert.ok(peakTs < 33, 'peak should shift toward t1 side when y1 > y3');
});

test('interpolatePeakTimestamp: flat denom falls back to t2', () => {
  const peakTs = interpolatePeakTimestamp(1.0, 1.0, 1.0, 0, 33, 66);
  assert.equal(peakTs, 33);
});

test('interpolatePeakTimestamp: wrong-sign denom falls back to t2', () => {
  const peakTs = interpolatePeakTimestamp(0.5, 0.4, 0.5, 0, 33, 66);
  assert.equal(peakTs, 33);
});

test('interpolatePeakTimestamp: clamps offset to [-1, 1]', () => {
  const peakTs = interpolatePeakTimestamp(10, 1.01, 1.0, 0, 33, 66);
  assert.ok(peakTs >= 0 && peakTs <= 66);
});

test('interpolatePeakTimestamp: non-finite inputs fall back to t2', () => {
  assert.equal(interpolatePeakTimestamp(NaN, 1, 0, 0, 33, 66), 33);
  assert.equal(interpolatePeakTimestamp(0, Infinity, 0, 0, 33, 66), 33);
});

test('medianOfRecent: odd window', () => {
  assert.equal(medianOfRecent([1, 5, 3], 5), 3);
});

test('medianOfRecent: even window averages middle pair', () => {
  assert.equal(medianOfRecent([1, 2, 3, 4], 4), 2.5);
});

test('medianOfRecent: uses only the last `window` values', () => {
  assert.equal(medianOfRecent([99, 99, 99, 800, 820, 810], 3), 810);
});

test('HeartRateManager: produces ~800ms IBIs from a regular beat train', () => {
  const manager = new HeartRateManager();
  runBeatTrain(manager, [24, 48, 72, 96, 120]);
  const samples = manager.getIbiSamples();
  assert.ok(samples.length >= 4, `expected >=4 IBIs, got ${samples.length}`);
  for (const s of samples) {
    assert.ok(
      Math.abs(s.ibiMs - 24 * FRAME_SPACING_MS) < 40,
      `ibi ${s.ibiMs} outside tolerance of ${24 * FRAME_SPACING_MS}`,
    );
  }
});

test('HeartRateManager: rejects ectopic IBI without advancing anchor', () => {
  const manager = new HeartRateManager();
  // Regular beats every 24 frames (~800ms), then a spurious beat 12 frames
  // after beat #5 (split-beat scenario), then normal beats resume.
  runBeatTrain(manager, [24, 48, 72, 96, 120, 132, 156, 180, 204]);
  const samples = manager.getIbiSamples();

  // The spurious beat at frame 132 should be dropped by Malik.
  // With anchor preserved, the beat at frame 156 measures back to frame 120
  // (~36 frames * 33ms ~= 1188ms) which itself exceeds the 20% Malik band
  // and is ALSO dropped. The beat at frame 180 measures back to frame 120
  // (~60 frames ~= 1980ms), which exceeds MAX_IBI_MS=1500, triggering reset
  // and advancing the anchor to 180 without pushing. Then 204->180 (~24
  // frames ~= 800ms) is accepted. Net: we get 4 normal IBIs from the first
  // run plus 1 post-recovery IBI.
  const normalIbiCount = samples.filter(
    (s) => Math.abs(s.ibiMs - 24 * FRAME_SPACING_MS) < 40,
  ).length;
  assert.ok(
    normalIbiCount >= 4,
    `expected >=4 normal IBIs, got ${normalIbiCount} (samples: ${JSON.stringify(samples)})`,
  );
  const spuriousIbiPushed = samples.some(
    (s) => s.ibiMs < 24 * FRAME_SPACING_MS - 100,
  );
  assert.equal(
    spuriousIbiPushed,
    false,
    `no IBI shorter than ~692ms should be pushed, got ${JSON.stringify(samples)}`,
  );
});

test('HeartRateManager: split-beat anchor preservation recovers rhythm', () => {
  const manager = new HeartRateManager();
  // 4 clean beats, then a split at frame 108 (12 frames after beat 4),
  // then clean beats resume at frames 120, 144, 168 — all 24 frames apart
  // from their true predecessor. Expected: split is rejected, rhythm
  // recovers because anchor stays at frame 96.
  runBeatTrain(manager, [24, 48, 72, 96, 108, 120, 144, 168]);
  const samples = manager.getIbiSamples();
  const normalCount = samples.filter(
    (s) => Math.abs(s.ibiMs - 24 * FRAME_SPACING_MS) < 40,
  ).length;
  assert.ok(
    normalCount >= 5,
    `expected >=5 normal IBIs after split-beat recovery, got ${normalCount} (samples: ${JSON.stringify(samples)})`,
  );
});

test('HeartRateManager: short-gap (<1s) keeps ibiHistory and anchor', () => {
  const manager = new HeartRateManager();
  runBeatTrain(manager, [24, 48, 72, 96]);
  const beforeSamples = manager.getIbiSamples().length;
  assert.ok(beforeSamples >= 3, 'should have collected IBIs before gap');

  // Inject 15 no-finger frames (~500ms gap at 33ms spacing) below REINIT_GAP_MS.
  let t = 10_000;
  for (let i = 0; i < 15; i++) {
    manager.processFrame(makeNoFingerFrame(t));
    t += FRAME_SPACING_MS;
  }

  // Resume beats. Anchor (lastPeakTs) was preserved. If the next real beat
  // lands more than MAX_IBI_MS (1500ms) after the previous peak, the history
  // will be cleared by the MAX path — which is fine for this test since
  // we're checking that persisted samples survive the short gap.
  for (let i = 0; i < 120; i++) {
    const weighted = [24, 48, 72].includes(i) ? BEAT_WEIGHTED : BASELINE_WEIGHTED;
    manager.processFrame(makeFrame(t, weighted));
    t += FRAME_SPACING_MS;
  }

  const afterSamples = manager.getIbiSamples();
  assert.ok(
    afterSamples.length >= beforeSamples,
    'persisted IBI samples should not be dropped across a short gap',
  );
});

test('HeartRateManager: short-gap recovery does not add transient bogus IBIs', () => {
  const manager = new HeartRateManager();
  runBeatTrain(manager, [24, 48, 72, 96]);
  const beforeCount = manager.getIbiSamples().length;

  let t = 20_000;
  for (let i = 0; i < 15; i++) {
    manager.processFrame(makeNoFingerFrame(t));
    t += FRAME_SPACING_MS;
  }

  for (let i = 0; i < 140; i++) {
    const weighted = [24, 48, 72, 96].includes(i) ? BEAT_WEIGHTED : BASELINE_WEIGHTED;
    manager.processFrame(makeFrame(t, weighted));
    t += FRAME_SPACING_MS;
  }

  const resumedSamples = manager.getIbiSamples().slice(beforeCount);
  const tooShortTransient = resumedSamples.some((sample) => sample.ibiMs < 650);
  assert.equal(
    tooShortTransient,
    false,
    `expected no transient short IBIs after gap, got ${JSON.stringify(resumedSamples)}`,
  );
});

test('HeartRateManager: long-gap (>1s) reinits but preserves sessionStart and samples', () => {
  const manager = new HeartRateManager();
  runBeatTrain(manager, [24, 48, 72, 96]);
  const beforeSamples = manager.getIbiSamples();
  assert.ok(beforeSamples.length >= 3);
  const firstOffsetMs = beforeSamples[0].offsetMs;

  // Long gap: jump timestamp forward 3s with good frames (no-finger).
  let t = 100_000;
  for (let i = 0; i < 10; i++) {
    manager.processFrame(makeNoFingerFrame(t));
    t += FRAME_SPACING_MS;
  }

  // Resume with a fresh beat train. This runs WARMUP_FRAMES of baseline
  // which will trigger the reinit branch (gap > REINIT_GAP_MS).
  runBeatTrain(manager, [24, 48, 72, 96], t);

  const afterSamples = manager.getIbiSamples();
  assert.ok(
    afterSamples.length > beforeSamples.length,
    'new IBIs should be appended after reinit',
  );

  // Offsets should be monotonic and anchored to the ORIGINAL session start,
  // so post-reinit offsets must be larger than pre-reinit offsets.
  for (let i = 1; i < afterSamples.length; i++) {
    assert.ok(
      afterSamples[i].offsetMs >= afterSamples[i - 1].offsetMs,
      `offsetMs should be monotonic across reinit, got ${afterSamples[i - 1].offsetMs} -> ${afterSamples[i].offsetMs}`,
    );
  }
  const newSamples = afterSamples.slice(beforeSamples.length);
  for (const s of newSamples) {
    assert.ok(
      s.offsetMs > firstOffsetMs + 1000,
      `post-reinit offsets should reflect original session start, got ${s.offsetMs}`,
    );
  }
});

test('HeartRateManager: reset() clears sessionStartTs so next capture re-anchors', () => {
  const manager = new HeartRateManager();
  runBeatTrain(manager, [24, 48, 72, 96]);
  assert.ok(manager.getIbiSamples().length >= 3);

  manager.reset();
  assert.equal(manager.getIbiSamples().length, 0);

  runBeatTrain(manager, [24, 48, 72, 96], 500_000);
  const samples = manager.getIbiSamples();
  assert.ok(samples.length >= 3);
  // Offset of the first IBI should be small (close to first beat offset),
  // not relative to the 500_000 absolute timestamp.
  assert.ok(
    samples[0].offsetMs < 5000,
    `first IBI offsetMs should be re-anchored after reset, got ${samples[0].offsetMs}`,
  );
});

test('HeartRateManager: populates signalQuality in [0, 1]', () => {
  const manager = new HeartRateManager();
  runBeatTrain(manager, [24, 48, 72, 96, 120]);
  const samples = manager.getIbiSamples();
  assert.ok(samples.length > 0);
  for (const s of samples) {
    assert.ok(
      typeof s.signalQuality === 'number',
      'signalQuality should be a number',
    );
    assert.ok(
      s.signalQuality >= 0 && s.signalQuality <= 1,
      `signalQuality should be clamped to [0, 1], got ${s.signalQuality}`,
    );
  }
});
