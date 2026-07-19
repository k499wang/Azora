import assert from 'node:assert/strict';
import test from 'node:test';

import { createDailyActiveClock } from './dailyActiveClock.ts';

test('daily active clock freezes while paused and resumes from the same elapsed time', () => {
  const clock = createDailyActiveClock();
  clock.start(1_000);
  assert.equal(clock.getElapsedMs(1_750), 750);

  clock.pause(1_750);
  assert.equal(clock.getElapsedMs(10_000), 750);

  clock.resume(10_000);
  assert.equal(clock.getElapsedMs(10_250), 1_000);
});

test('daily active clock excludes multiple pauses', () => {
  const clock = createDailyActiveClock();
  clock.start(1_000);
  clock.pause(1_400);
  clock.resume(2_400);
  clock.pause(2_700);
  clock.resume(5_700);

  assert.equal(clock.getElapsedMs(6_000), 1_000);
});

test('daily active clock reset cleans up state and start begins a fresh run', () => {
  const clock = createDailyActiveClock();
  clock.start(1_000);
  clock.pause(1_500);
  clock.reset();
  clock.resume(5_000);
  assert.equal(clock.getElapsedMs(8_000), 0);

  clock.start(10_000);
  assert.equal(clock.getElapsedMs(10_600), 600);
});
