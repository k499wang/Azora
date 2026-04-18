import test from 'node:test';
import assert from 'node:assert/strict';
import { createMeasurementTimer } from './measurementTimer.ts';

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
