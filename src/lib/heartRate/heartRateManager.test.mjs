import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptivePeakThreshold,
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

function makeSaturatedFrame(timestamp) {
  return {
    timestamp,
    rois: [
      {
        id: 'roi-0',
        r: 255,
        g: 255,
        b: 255,
        saturatedPct: 0.95,
        darkPct: 0,
        variance: 1,
      },
    ],
  };
}

function makeBrightTorchFrame(timestamp, weighted, saturatedPct = 0.7) {
  const g = 45 + (weighted - BASELINE_WEIGHTED) * 0.15;
  const b = 8;
  const r = (weighted - g * 0.33) / 0.67;
  return {
    timestamp,
    rois: [
      {
        id: 'roi-0',
        r,
        g,
        b,
        saturatedPct,
        darkPct: 0,
        variance: 100,
      },
    ],
  };
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

test('adaptivePeakThreshold: starts stricter then decays toward lower threshold', () => {
  const amplitude = 0.02;
  const expectedIbiMs = 800;

  const immediate = adaptivePeakThreshold(amplitude, 0, expectedIbiMs);
  const beforeExpectedWindow = adaptivePeakThreshold(amplitude, 400, expectedIbiMs);
  const afterExpectedWindow = adaptivePeakThreshold(amplitude, 1600, expectedIbiMs);
  const longAfterPeak = adaptivePeakThreshold(amplitude, 2400, expectedIbiMs);

  assert.equal(immediate, amplitude * 0.3);
  assert.equal(beforeExpectedWindow, amplitude * 0.3);
  assert.ok(
    afterExpectedWindow < immediate,
    `threshold should decay after the expected beat window, got ${afterExpectedWindow} >= ${immediate}`,
  );
  assert.ok(
    longAfterPeak < afterExpectedWindow,
    `threshold should continue decaying when beats slow, got ${longAfterPeak} >= ${afterExpectedWindow}`,
  );
  assert.ok(
    longAfterPeak > amplitude * 0.2,
    `threshold should approach the amplitude floor, got ${longAfterPeak}`,
  );
});

test('adaptivePeakThreshold: falls back to fixed startup factor for invalid timing', () => {
  assert.equal(adaptivePeakThreshold(0.02, -1, 800), 0.02 * 0.3);
  assert.equal(adaptivePeakThreshold(0.02, 500, 0), 0.02 * 0.3);
  assert.equal(adaptivePeakThreshold(0, 500, 800), 0);
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

test('HeartRateManager: a steady regular pulse never reports excessive motion', () => {
  const manager = new HeartRateManager();
  // One long, continuous, regular ~792ms beat train: warm up then feed many
  // aligned beats and confirm the excursion detector never mistakes the sharp
  // pulse peaks for movement once the pulse is established.
  let t = 0;
  for (let i = 0; i < WARMUP_FRAMES; i++) {
    manager.processFrame(makeFrame(t, BASELINE_WEIGHTED));
    t += FRAME_SPACING_MS;
  }

  const statuses = new Set();
  const totalFrames = 24 * 12;
  for (let i = 0; i < totalFrames; i++) {
    const weighted = i % 24 === 0 ? BEAT_WEIGHTED : BASELINE_WEIGHTED;
    const status = manager.processFrame(makeFrame(t, weighted)).signalStatus;
    // Only judge once the pulse has had time to lock (past the first few beats).
    if (i >= 24 * 4) statuses.add(status);
    t += FRAME_SPACING_MS;
  }

  assert.ok(
    !statuses.has('excessive_motion'),
    `steady pulse should not flag motion, saw ${JSON.stringify([...statuses])}`,
  );
});

function warmAndLock(manager) {
  let t = 0;
  for (let i = 0; i < WARMUP_FRAMES; i++) {
    manager.processFrame(makeFrame(t, BASELINE_WEIGHTED));
    t += FRAME_SPACING_MS;
  }
  for (let i = 0; i < 24 * 6; i++) {
    manager.processFrame(makeFrame(t, i % 24 === 0 ? BEAT_WEIGHTED : BASELINE_WEIGHTED));
    t += FRAME_SPACING_MS;
  }
  return t;
}

test('HeartRateManager: erratic in-place signal reports motion while placement stays good', () => {
  const manager = new HeartRateManager();
  let t = warmAndLock(manager);

  // Finger stays fully on the lens (placement never leaves "good"), but the
  // luminance jumps around frame-to-frame — the erratic trace you see when the
  // phone is moved. This must trip motion via the raw/reversal detector, not
  // placement churn.
  let seed = 1;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const placements = new Set();
  let sawMotion = false;
  for (let i = 0; i < 40; i++) {
    const frameState = manager.processFrame(makeFrame(t, 70 + rnd() * 60));
    placements.add(frameState.fingerPlacement);
    if (frameState.signalStatus === 'excessive_motion') sawMotion = true;
    t += FRAME_SPACING_MS;
  }

  assert.ok(sawMotion, 'erratic in-place signal should report excessive_motion');
  assert.deepEqual([...placements], ['good'], 'placement should stay good');
});

test('HeartRateManager: slow luminance drift reports motion while placement stays good', () => {
  const manager = new HeartRateManager();
  let t = warmAndLock(manager);

  // A slow reposition: brightness ramps steadily away from the baseline while
  // the finger keeps full coverage. The baseline is too slow to chase it, so the
  // raw-deviation detector should flag it.
  const placements = new Set();
  let sawMotion = false;
  for (let i = 0; i < 40; i++) {
    const frameState = manager.processFrame(makeFrame(t, BASELINE_WEIGHTED + i * 1.2));
    placements.add(frameState.fingerPlacement);
    if (frameState.signalStatus === 'excessive_motion') sawMotion = true;
    t += FRAME_SPACING_MS;
  }

  assert.ok(sawMotion, 'slow drift should report excessive_motion');
  assert.deepEqual([...placements], ['good'], 'placement should stay good');
});

test('HeartRateManager: PPG graph stops gathering samples during motion', () => {
  const manager = new HeartRateManager();
  let t = warmAndLock(manager);

  let seed = 1;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const feedErratic = (frames) => {
    for (let i = 0; i < frames; i++) {
      manager.processFrame(makeFrame(t, 70 + rnd() * 60));
      t += FRAME_SPACING_MS;
    }
  };

  // Enter and hold motion, then confirm the graph feed has frozen: no new live
  // signal samples are appended while movement continues.
  feedErratic(20);
  const frozenTimestamp = manager.getLatestLiveSignalTimestamp();
  const frozenCount = manager.getLiveSignalSamples().length;

  feedErratic(20);
  assert.equal(
    manager.getLatestLiveSignalTimestamp(),
    frozenTimestamp,
    'no new samples should be gathered during sustained motion',
  );
  assert.equal(manager.getLiveSignalSamples().length, frozenCount);
});

test('HeartRateManager: repeated finger lift/reseat reports excessive motion', () => {
  const manager = new HeartRateManager();
  // Warm up on a clean signal so the manager is initialized and measuring.
  runBeatTrain(manager, [24, 48, 72, 96, 120]);

  // Simulate the finger repeatedly lifting off the lens: short good contact then
  // an off-period longer than the 500ms grace window, so each cycle commits a
  // real good->lost->good transition (not the flicker grace absorbs).
  let t = 30_000;
  const statuses = new Set();
  for (let cycle = 0; cycle < 5; cycle++) {
    manager.processFrame(makeFrame(t, BASELINE_WEIGHTED));
    t += FRAME_SPACING_MS;
    for (let i = 0; i < 17; i++) {
      statuses.add(manager.processFrame(makeNoFingerFrame(t)).signalStatus);
      t += FRAME_SPACING_MS;
    }
  }

  assert.ok(
    statuses.has('excessive_motion'),
    `expected excessive_motion from repeated lifts, saw ${JSON.stringify([...statuses])}`,
  );
});

test('HeartRateManager: withholds live BPM after the finger is removed', () => {
  const manager = new HeartRateManager();
  runBeatTrain(manager, [24, 48, 72, 96, 120]);
  assert.equal(manager.getCurrentBpm(), 76);

  // Finger off for well past the bad-placement grace window.
  let t = 30_000;
  for (let i = 0; i < 40; i++) {
    manager.processFrame(makeNoFingerFrame(t));
    t += FRAME_SPACING_MS;
  }

  assert.equal(manager.getCurrentBpm(), null);
});

function makeContinuousBeatFeeder(manager) {
  let t = 0;
  for (let i = 0; i < WARMUP_FRAMES; i++) {
    manager.processFrame(makeFrame(t, BASELINE_WEIGHTED));
    t += FRAME_SPACING_MS;
  }
  let frame = 0;
  const beatEvery = 24;
  return function feed(beatCount, skipBeatIndices = new Set()) {
    const endFrame = frame + beatCount * beatEvery;
    for (; frame < endFrame; frame++) {
      const beatIndex = frame / beatEvery;
      const isBeat = frame % beatEvery === 0 && !skipBeatIndices.has(beatIndex);
      manager.processFrame(makeFrame(t, isBeat ? BEAT_WEIGHTED : BASELINE_WEIGHTED));
      t += FRAME_SPACING_MS;
    }
  };
}

test('HeartRateManager: a missed beat holds the live BPM instead of nulling', () => {
  const manager = new HeartRateManager();
  const feed = makeContinuousBeatFeeder(manager);
  feed(6);
  const locked = manager.getCurrentBpm();
  assert.ok(locked != null, 'expected a locked BPM before the missed beat');

  // Drop several beats so a single over-long gap (> MAX_IBI_MS) really occurs.
  // The last real BPM must hold across the gap rather than blanking and
  // rebuilding four intervals from scratch (the pre-fix behavior).
  feed(8, new Set([7, 8, 9]));
  assert.equal(
    manager.getCurrentBpm(),
    locked,
    'a missed beat should hold the last BPM, not blank',
  );
});

test('HeartRateManager: waits for enough intervals before publishing live BPM', () => {
  const manager = new HeartRateManager();
  runBeatTrain(manager, [24, 48, 72]);
  assert.equal(manager.getCurrentBpm(), null);

  runBeatTrain(manager, [24, 48, 72, 96, 120], 20_000);
  assert.equal(manager.getCurrentBpm(), 76);
});

test('HeartRateManager: beginMeasurementWindow clears persisted IBIs and restarts live BPM smoothing', () => {
  const manager = new HeartRateManager();
  runBeatTrain(manager, [11, 22, 33, 44, 55, 66, 77, 88]);
  assert.equal(manager.getCurrentBpm(), 165);

  manager.beginMeasurementWindow(15_000);
  assert.equal(manager.getCurrentBpm(), null);
  assert.deepEqual(manager.getIbiSamples(), []);

  runBeatTrain(manager, [24, 48, 72, 96, 120, 144, 168], 15_000);
  assert.equal(manager.getCurrentBpm(), 76);
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

test('HeartRateManager: fast legitimate rhythm is captured after cold start', () => {
  const manager = new HeartRateManager();
  runBeatTrain(manager, [11, 22, 33, 44, 55, 66, 77, 88, 99, 110]);
  const samples = manager.getIbiSamples();

  assert.ok(
    samples.length >= 7,
    `expected fast rhythm to populate samples, got ${JSON.stringify(samples)}`,
  );
  for (const s of samples) {
    assert.ok(
      Math.abs(s.ibiMs - 11 * FRAME_SPACING_MS) < 50,
      `expected ~363ms IBI, got ${s.ibiMs}`,
    );
  }
  assert.equal(manager.getCurrentBpm(), 165);
});

test('HeartRateManager: ectopic beats emit live ticks but stay out of IBI history', () => {
  const manager = new HeartRateManager();
  const beatFrames = [24, 48, 72, 96, 108, 120, 144, 168];
  const beatSet = new Set(beatFrames);
  let t = 0;
  let beatTicks = 0;

  for (let i = 0; i < WARMUP_FRAMES; i++) {
    const state = manager.processFrame(makeFrame(t, BASELINE_WEIGHTED));
    if (state.beatDetected) beatTicks += 1;
    t += FRAME_SPACING_MS;
  }

  const totalPostWarmupFrames = Math.max(...beatFrames) + 15;
  for (let i = 0; i < totalPostWarmupFrames; i++) {
    const weighted = beatSet.has(i) ? BEAT_WEIGHTED : BASELINE_WEIGHTED;
    const state = manager.processFrame(makeFrame(t, weighted));
    if (state.beatDetected) beatTicks += 1;
    t += FRAME_SPACING_MS;
  }

  // Every refractory-passed peak should emit a visual tick — the live tick
  // path must reflect what the heart actually did, not the HRV-stats gate.
  assert.equal(
    beatTicks,
    beatFrames.length,
    'every distinct refractory-passed peak should emit a live tick',
  );

  // Doublet defenses (amplitude + refractory + arm-disarm) gate the tick;
  // Malik gates only the stored IBI history. The short-IBI ectopic between
  // frames 96 and 108 must not appear in the stored samples.
  const samples = manager.getIbiSamples();
  const shortEctopic = samples.find((s) => Math.abs(s.ibiMs - 12 * FRAME_SPACING_MS) < 50);
  assert.equal(
    shortEctopic,
    undefined,
    `Malik-rejected short IBI must not enter ibiSamples, got ${JSON.stringify(samples)}`,
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

test('HeartRateManager: transient bad placement does not force beat warmup', () => {
  const manager = new HeartRateManager();
  let t = runBeatTrain(manager, [24, 48, 72, 96, 120, 144]);
  assert.equal(manager.getCurrentBpm(), 76);

  for (let i = 0; i < 10; i++) {
    const state = manager.processFrame(makeNoFingerFrame(t));
    assert.equal(state.beatDetected, false);
    t += FRAME_SPACING_MS;
  }

  let resumedBeatTicks = 0;
  for (let i = 0; i < 50; i++) {
    const weighted = [24, 48].includes(i) ? BEAT_WEIGHTED : BASELINE_WEIGHTED;
    const state = manager.processFrame(makeFrame(t, weighted));
    if (state.beatDetected) resumedBeatTicks += 1;
    t += FRAME_SPACING_MS;
  }

  assert.ok(
    resumedBeatTicks > 0,
    'beats should resume without waiting for a full warmup after a transient bad placement',
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

test('HeartRateManager: saturated frames do not feed live beat detection', () => {
  const manager = new HeartRateManager();
  let t = runBeatTrain(manager, [24, 48, 72, 96, 120, 144]);
  const beforeSamples = manager.getIbiSamples().length;
  assert.equal(manager.getCurrentBpm(), 76);

  let saturatedTicks = 0;
  for (let i = 0; i < 40; i++) {
    const state = manager.processFrame(makeSaturatedFrame(t));
    if (state.beatDetected) saturatedTicks += 1;
    t += FRAME_SPACING_MS;
  }

  assert.equal(saturatedTicks, 0, 'clipped frames should not emit live beat ticks');
  assert.equal(
    manager.getIbiSamples().length,
    beforeSamples,
    'clipped frames should not append IBIs',
  );
  assert.equal(manager.getCurrentBpm(), null, 'sustained clipping should stop live BPM publishing');
});

test('HeartRateManager: bright torch partial saturation still tracks clear weighted beats', () => {
  const manager = new HeartRateManager();
  let t = 0;
  let beatTicks = 0;
  const periodMs = 24 * FRAME_SPACING_MS;

  for (let i = 0; i < 300; i++) {
    const weighted = BASELINE_WEIGHTED + 10 * Math.sin((2 * Math.PI * t) / periodMs);
    const state = manager.processFrame(makeBrightTorchFrame(t, weighted));
    assert.equal(state.fingerPlacement, 'good');
    if (state.beatDetected) beatTicks += 1;
    t += FRAME_SPACING_MS;
  }

  assert.ok(beatTicks >= 4, `expected live beats under partial torch saturation, got ${beatTicks}`);
  assert.equal(manager.getCurrentBpm(), 76);
});

test('HeartRateManager: emitted bright torch beats populate live BPM history', () => {
  const manager = new HeartRateManager();
  let t = 0;
  let beatTicks = 0;
  let firstBpmAtTick = 0;
  const periodMs = 24 * FRAME_SPACING_MS;

  for (let i = 0; i < 360; i++) {
    const weighted = BASELINE_WEIGHTED + 10 * Math.sin((2 * Math.PI * t) / periodMs);
    const state = manager.processFrame(makeBrightTorchFrame(t, weighted));
    if (state.beatDetected) {
      beatTicks += 1;
      if (firstBpmAtTick === 0 && manager.getCurrentBpm() != null) {
        firstBpmAtTick = beatTicks;
      }
    }
    t += FRAME_SPACING_MS;
  }

  assert.ok(beatTicks >= 7, `expected enough emitted beats, got ${beatTicks}`);
  assert.ok(
    firstBpmAtTick > 0 && firstBpmAtTick <= 7,
    `expected live BPM soon after enough emitted beats, got tick ${firstBpmAtTick}`,
  );
  assert.equal(manager.getCurrentBpm(), 76);
});

test('HeartRateManager: very high torch saturation does not stall live BPM when weighted pulse is clear', () => {
  const manager = new HeartRateManager();
  let t = 0;
  let beatTicks = 0;
  const periodMs = 24 * FRAME_SPACING_MS;

  for (let i = 0; i < 360; i++) {
    const weighted = BASELINE_WEIGHTED + 10 * Math.sin((2 * Math.PI * t) / periodMs);
    const state = manager.processFrame(makeBrightTorchFrame(t, weighted, 0.92));
    assert.equal(state.fingerPlacement, 'good');
    if (state.beatDetected) beatTicks += 1;
    t += FRAME_SPACING_MS;
  }

  assert.ok(beatTicks >= 7, `expected enough beats under very high torch saturation, got ${beatTicks}`);
  assert.equal(manager.getCurrentBpm(), 76);
});

function makeBrownSurfaceFrame(timestamp) {
  return {
    timestamp,
    rois: [
      { id: 'roi-0', r: 95, g: 55, b: 25, saturatedPct: 0, darkPct: 0.05, variance: 5 },
    ],
  };
}

test('HeartRateManager: brown-surface frames are not classified as good', () => {
  const manager = new HeartRateManager();
  let t = 0;
  let goodCount = 0;
  for (let i = 0; i < 90; i++) {
    const state = manager.processFrame(makeBrownSurfaceFrame(t));
    if (state.fingerPlacement === 'good') goodCount += 1;
    t += FRAME_SPACING_MS;
  }
  assert.equal(goodCount, 0, 'a brown table should never register as a finger');
});

test('HeartRateManager: locked-in finger that goes flat is invalidated', () => {
  const manager = new HeartRateManager();
  let t = runBeatTrain(manager, [24, 48, 72, 96, 120, 144]);
  assert.equal(manager.getCurrentBpm(), 76);

  let sawLost = false;
  for (let i = 0; i < 240; i++) {
    const state = manager.processFrame(makeFrame(t, BASELINE_WEIGHTED));
    if (state.fingerPlacement === 'lost') sawLost = true;
    t += FRAME_SPACING_MS;
  }
  assert.ok(sawLost, 'sustained flat signal after lock-in should force a lost state');
});
