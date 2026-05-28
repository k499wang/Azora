import test from 'node:test';
import assert from 'node:assert/strict';
import { createBeatTickScheduler } from './beatTickScheduler.ts';

class FakeTimers {
  nowMs = 0;
  nextId = 1;
  timers = new Map();

  setTimeout = (callback, delayMs) => {
    const id = this.nextId++;
    this.timers.set(id, { callback, fireAt: this.nowMs + delayMs });
    return id;
  };

  clearTimeout = (id) => {
    this.timers.delete(id);
  };

  advanceBy(ms) {
    const target = this.nowMs + ms;
    while (true) {
      let next = null;
      for (const [id, timer] of this.timers) {
        if (timer.fireAt <= target && (next == null || timer.fireAt < next.timer.fireAt)) {
          next = { id, timer };
        }
      }
      if (next == null) break;
      this.nowMs = next.timer.fireAt;
      this.timers.delete(next.id);
      next.timer.callback();
    }
    this.nowMs = target;
  }
}

function makeScheduler(timers, overrides = {}) {
  const beats = [];
  const scheduler = createBeatTickScheduler({
    onBeat: () => beats.push(timers.nowMs),
    setTimeout: timers.setTimeout,
    clearTimeout: timers.clearTimeout,
    targetLatencyMs: 180,
    maxDelayMs: 220,
    ...overrides,
  });
  return { scheduler, beats };
}

test('emits the tick at a constant offset after the peak, removing detection jitter', () => {
  const timers = new FakeTimers();
  const { scheduler, beats } = makeScheduler(timers);

  // Two beats one IBI (800ms) apart. Detection latency differs per beat
  // (90ms then 140ms) the way frame quantization makes it vary in practice.
  timers.nowMs = 1090;
  scheduler.schedule(1000, 1090); // beat age 90 -> delay 90 -> fires at 1180
  timers.advanceBy(1000);

  timers.nowMs = 1940;
  scheduler.schedule(1800, 1940); // beat age 140 -> delay 40 -> fires at 1980
  timers.advanceBy(1000);

  // Peaks were 800ms apart; ticks come out 800ms apart despite uneven latency.
  assert.deepEqual(beats, [1180, 1980]);
  assert.equal(beats[1] - beats[0], 800);
});

test('fires immediately when the beat is already older than the target latency', () => {
  const timers = new FakeTimers();
  const { scheduler, beats } = makeScheduler(timers);

  timers.nowMs = 1300;
  scheduler.schedule(1000, 1300); // beat age 300 > target 180 -> delay 0
  assert.deepEqual(beats, []);
  timers.advanceBy(0);
  assert.deepEqual(beats, [1300]);
});

test('clamps the wait so a tick never overruns the next beat interval', () => {
  const timers = new FakeTimers();
  const { scheduler, beats } = makeScheduler(timers);

  timers.nowMs = 1000;
  scheduler.schedule(1000, 1000); // beat age 0 -> raw delay 180, under cap
  timers.advanceBy(220);
  assert.deepEqual(beats, [1180]);
});

test('reset cancels a queued tick', () => {
  const timers = new FakeTimers();
  const { scheduler, beats } = makeScheduler(timers);

  timers.nowMs = 1090;
  scheduler.schedule(1000, 1090);
  scheduler.reset();
  timers.advanceBy(1000);
  assert.deepEqual(beats, []);
});

test('flushes a still-queued tick before scheduling the next so no beat is dropped', () => {
  const timers = new FakeTimers();
  const { scheduler, beats } = makeScheduler(timers);

  timers.nowMs = 1090;
  scheduler.schedule(1000, 1090); // queued, would fire at 1180
  // A second beat arrives before the first fired (degenerate, but must not drop).
  scheduler.schedule(1050, 1100); // flush first immediately, queue second
  timers.advanceBy(1000);
  assert.equal(beats.length, 2);
});
