import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BREATH_EXERCISE_PLACEMENT_FALLBACK_DELAY_MS,
  BREATH_EXERCISE_PLACEMENT_LOCKED_DELAY_MS,
  CAPTURE_CAMERA_CHECK_FRAME_FRESHNESS_MS,
  CAPTURE_PLACEMENT_FALLBACK_DELAY_MS,
  CAPTURE_PULSE_LOCKED_DELAY_MS,
  createMeasurementTimer,
  getBreathExercisePlacementStartDelayMs,
  getCaptureStartDeadlineMs,
  isCaptureStartEligible,
  isCaptureStartFrameFresh,
} from './measurementTimer.ts';

function placementDelay(overrides = {}) {
  return getBreathExercisePlacementStartDelayMs({
    fingerPlacement: 'good',
    signalStatus: 'warming_up',
    bpmLocked: false,
    ...overrides,
  });
}

test('breath exercise placement uses the fallback until a BPM locks', () => {
  assert.equal(BREATH_EXERCISE_PLACEMENT_FALLBACK_DELAY_MS, 20000);
  assert.equal(BREATH_EXERCISE_PLACEMENT_LOCKED_DELAY_MS, 250);
  assert.equal(
    placementDelay(),
    BREATH_EXERCISE_PLACEMENT_FALLBACK_DELAY_MS,
  );
  assert.equal(
    placementDelay({ signalStatus: 'measuring', bpmLocked: true }),
    BREATH_EXERCISE_PLACEMENT_LOCKED_DELAY_MS,
  );
});

test('breath exercise placement pauses for motion and restarts the fallback after recovery', () => {
  assert.equal(
    placementDelay({ signalStatus: 'excessive_motion', bpmLocked: true }),
    null,
  );
  assert.equal(
    placementDelay({ signalStatus: 'warming_up' }),
    BREATH_EXERCISE_PLACEMENT_FALLBACK_DELAY_MS,
  );
});

test('breath exercise placement pauses for finger removal and restarts after replacement', () => {
  assert.equal(
    placementDelay({
      fingerPlacement: 'lost',
      signalStatus: 'signal_lost',
      bpmLocked: true,
    }),
    null,
  );
  assert.equal(
    placementDelay({ fingerPlacement: 'no_finger', signalStatus: 'no_finger' }),
    null,
  );
  assert.equal(
    placementDelay({ fingerPlacement: 'good', signalStatus: 'warming_up' }),
    BREATH_EXERCISE_PLACEMENT_FALLBACK_DELAY_MS,
  );
});

test('breath exercise placement blocks invalid coverage but keeps the no-pulse fallback', () => {
  assert.equal(
    placementDelay({ fingerPlacement: 'partial', signalStatus: 'partial_coverage' }),
    null,
  );
  assert.equal(
    placementDelay({
      fingerPlacement: 'too_much_pressure',
      signalStatus: 'too_much_pressure',
    }),
    null,
  );
  assert.equal(
    placementDelay({ signalStatus: 'no_pulse' }),
    BREATH_EXERCISE_PLACEMENT_FALLBACK_DELAY_MS,
  );
});

test('published BPM can start immediately after motion or finger recovery', () => {
  assert.equal(
    placementDelay({ signalStatus: 'measuring', bpmLocked: true }),
    BREATH_EXERCISE_PLACEMENT_LOCKED_DELAY_MS,
  );
});

class FakeClock {
  nowMs = 0;
  nextId = 1;
  intervals = new Map();

  now = () => this.nowMs;

  setInterval = (callback, delayMs) => {
    const id = this.nextId++;
    this.intervals.set(id, {
      callback,
      delayMs,
      nextAt: this.nowMs + delayMs,
    });
    return id;
  };

  clearInterval = (id) => {
    this.intervals.delete(id);
  };

  advanceBy(ms) {
    const targetMs = this.nowMs + ms;

    while (true) {
      const next = [...this.intervals.entries()]
        .filter(([, interval]) => interval.nextAt <= targetMs)
        .sort((a, b) => a[1].nextAt - b[1].nextAt)[0];

      if (next == null) break;

      const [id, interval] = next;
      this.nowMs = interval.nextAt;
      interval.callback();

      if (this.intervals.has(id)) {
        interval.nextAt += interval.delayMs;
      }
    }

    this.nowMs = targetMs;
  }
}

test('measurement timer advances countdown without camera samples', () => {
  const clock = new FakeClock();
  const ticks = [];
  let completeCount = 0;

  const timer = createMeasurementTimer({
    durationMs: 15000,
    intervalMs: 200,
    now: clock.now,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    onTick: (elapsedMs) => ticks.push(elapsedMs),
    onComplete: () => {
      completeCount += 1;
    },
  });

  timer.start();
  assert.equal(ticks.at(-1), 0);

  clock.advanceBy(5000);
  assert.equal(ticks.at(-1), 5000);
  assert.equal(completeCount, 0);
  assert.equal(timer.isRunning(), true);

  clock.advanceBy(10000);
  assert.equal(ticks.at(-1), 15000);
  assert.equal(completeCount, 1);
  assert.equal(timer.isRunning(), false);
});

function eligible(overrides = {}) {
  return isCaptureStartEligible({
    fingerPlacement: 'good',
    signalStatus: 'measuring',
    ...overrides,
  });
}

test('standalone capture only trusts a recent camera-check frame', () => {
  const nowMs = 10_000;

  assert.equal(
    isCaptureStartFrameFresh({ lastFrameReceivedAtMs: nowMs, nowMs }),
    true,
  );
  assert.equal(
    isCaptureStartFrameFresh({
      lastFrameReceivedAtMs: nowMs - CAPTURE_CAMERA_CHECK_FRAME_FRESHNESS_MS,
      nowMs,
    }),
    true,
  );
  assert.equal(
    isCaptureStartFrameFresh({
      lastFrameReceivedAtMs: nowMs - CAPTURE_CAMERA_CHECK_FRAME_FRESHNESS_MS - 1,
      nowMs,
    }),
    false,
  );
  assert.equal(
    isCaptureStartFrameFresh({ lastFrameReceivedAtMs: null, nowMs }),
    false,
  );
  assert.equal(
    isCaptureStartFrameFresh({ lastFrameReceivedAtMs: nowMs + 1, nowMs }),
    false,
  );
});

test('standalone capture waits while the finger is not placed well', () => {
  assert.equal(eligible(), true);
  assert.equal(eligible({ fingerPlacement: 'partial' }), false);
  assert.equal(eligible({ fingerPlacement: 'no_finger' }), false);
  assert.equal(eligible({ signalStatus: 'excessive_motion' }), false);
  assert.equal(eligible({ signalStatus: 'signal_lost' }), false);
});

test('standalone capture starts promptly once a pulse is locked', () => {
  const placementSinceMs = 1_000;
  const pulseLockedSinceMs = 4_000;

  assert.equal(
    getCaptureStartDeadlineMs({ placementSinceMs, pulseLockedSinceMs }),
    pulseLockedSinceMs + CAPTURE_PULSE_LOCKED_DELAY_MS,
  );
});

test('standalone capture falls back to starting without a locked pulse', () => {
  assert.equal(
    getCaptureStartDeadlineMs({ placementSinceMs: 1_000, pulseLockedSinceMs: null }),
    1_000 + CAPTURE_PLACEMENT_FALLBACK_DELAY_MS,
  );
});

test('standalone capture has no deadline until placement is usable', () => {
  assert.equal(
    getCaptureStartDeadlineMs({ placementSinceMs: null, pulseLockedSinceMs: null }),
    null,
  );
});

test('a flickering pulse lock never pushes the fallback deadline back', () => {
  const placementSinceMs = 1_000;
  const fallbackDeadlineMs = placementSinceMs + CAPTURE_PLACEMENT_FALLBACK_DELAY_MS;

  // Lock appears late, drops, and reappears later still. The fallback is
  // anchored to placement, so none of that can delay the start past it.
  for (const pulseLockedSinceMs of [null, 9_000, null, 14_000, null]) {
    assert.ok(
      getCaptureStartDeadlineMs({ placementSinceMs, pulseLockedSinceMs }) <=
        fallbackDeadlineMs,
    );
  }
});

test('a pulse locked close to the fallback never delays the start', () => {
  const placementSinceMs = 1_000;
  const fallbackDeadlineMs = placementSinceMs + CAPTURE_PLACEMENT_FALLBACK_DELAY_MS;

  assert.equal(
    getCaptureStartDeadlineMs({
      placementSinceMs,
      pulseLockedSinceMs: fallbackDeadlineMs - 10,
    }),
    fallbackDeadlineMs,
  );
});
