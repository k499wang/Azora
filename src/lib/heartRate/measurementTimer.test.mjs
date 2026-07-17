import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BREATH_EXERCISE_PLACEMENT_FALLBACK_DELAY_MS,
  BREATH_EXERCISE_PLACEMENT_LOCKED_DELAY_MS,
  createMeasurementTimer,
  getBreathExercisePlacementStartDelayMs,
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
