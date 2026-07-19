import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DAILY_BREATH_HOLD_PROTOCOL,
  buildDailyBreathHoldPreparationPlan,
  isBreathHoldReleaseAllowed,
} from './dailyBreathHoldProtocol.ts';
import { createDailyActiveClock } from './dailyActiveClock.ts';

test('preserves the current daily breath-hold protocol', () => {
  assert.deepEqual(DAILY_BREATH_HOLD_PROTOCOL, {
    prepCycles: 3,
    prepInhaleSeconds: 3,
    prepExhaleSeconds: 6,
    finalInhaleSeconds: 4,
    releaseGuardMs: 1_000,
  });
});

test('builds every preparation cycle followed by the final inhale', () => {
  assert.deepEqual(
    buildDailyBreathHoldPreparationPlan(DAILY_BREATH_HOLD_PROTOCOL),
    [
      { phase: 'preInhale', cycle: 1, durationSeconds: 3 },
      { phase: 'preExhale', cycle: 1, durationSeconds: 6 },
      { phase: 'preInhale', cycle: 2, durationSeconds: 3 },
      { phase: 'preExhale', cycle: 2, durationSeconds: 6 },
      { phase: 'preInhale', cycle: 3, durationSeconds: 3 },
      { phase: 'preExhale', cycle: 3, durationSeconds: 6 },
      { phase: 'inhale', cycle: 3, durationSeconds: 4 },
    ],
  );
});

test('allows release only after the hold guard has elapsed', () => {
  const input = {
    phase: 'hold',
    paused: false,
    releaseGuardMs: 1_000,
  };

  assert.equal(isBreathHoldReleaseAllowed({ ...input, activeHoldElapsedMs: 999 }), false);
  assert.equal(isBreathHoldReleaseAllowed({ ...input, activeHoldElapsedMs: 1_000 }), true);
});

test('release guard counts active hold time only and rejects while paused', () => {
  const clock = createDailyActiveClock();
  clock.start(5_000);
  clock.pause(5_600);

  assert.equal(
    isBreathHoldReleaseAllowed({
      phase: 'hold',
      paused: true,
      activeHoldElapsedMs: clock.getElapsedMs(20_000),
      releaseGuardMs: 1_000,
    }),
    false,
  );

  clock.resume(20_000);
  assert.equal(
    isBreathHoldReleaseAllowed({
      phase: 'hold',
      paused: false,
      activeHoldElapsedMs: clock.getElapsedMs(20_399),
      releaseGuardMs: 1_000,
    }),
    false,
  );
  assert.equal(
    isBreathHoldReleaseAllowed({
      phase: 'hold',
      paused: false,
      activeHoldElapsedMs: clock.getElapsedMs(20_400),
      releaseGuardMs: 1_000,
    }),
    true,
  );
});

test('does not allow release outside the hold phase', () => {
  assert.equal(
    isBreathHoldReleaseAllowed({
      phase: 'inhale',
      paused: false,
      activeHoldElapsedMs: 5_000,
      releaseGuardMs: 1_000,
    }),
    false,
  );
});
