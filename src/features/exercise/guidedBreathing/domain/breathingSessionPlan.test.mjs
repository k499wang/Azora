import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCyclicBreathingPlan,
  runBreathingSessionPlan,
} from './breathingSessionPlan.ts';

test('builds the current four-phase sequence for every round', () => {
  assert.deepEqual(
    buildCyclicBreathingPlan(
      { inhale: 4, holdIn: 2, exhale: 6, holdOut: 1 },
      2,
    ),
    [
      { round: 1, phase: 'inhale', durationSeconds: 4 },
      { round: 1, phase: 'holdIn', durationSeconds: 2 },
      { round: 1, phase: 'exhale', durationSeconds: 6 },
      { round: 1, phase: 'holdOut', durationSeconds: 1 },
      { round: 2, phase: 'inhale', durationSeconds: 4 },
      { round: 2, phase: 'holdIn', durationSeconds: 2 },
      { round: 2, phase: 'exhale', durationSeconds: 6 },
      { round: 2, phase: 'holdOut', durationSeconds: 1 },
    ],
  );
});

test('keeps zero-duration phases in the plan', () => {
  const plan = buildCyclicBreathingPlan(
    { inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 },
    1,
  );

  assert.deepEqual(
    plan.map(({ phase, durationSeconds }) => [phase, durationSeconds]),
    [
      ['inhale', 5],
      ['holdIn', 0],
      ['exhale', 5],
      ['holdOut', 0],
    ],
  );
});

test('runs phases in order and announces each round once', () => {
  const phases = [];
  const rounds = [];
  let completionCount = 0;

  runBreathingSessionPlan({
    plan: buildCyclicBreathingPlan(
      { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0 },
      2,
    ),
    isActive: () => true,
    runPhase: (phase, durationSeconds, onComplete) => {
      phases.push([phase, durationSeconds]);
      onComplete();
    },
    onRoundChange: (round) => rounds.push(round),
    onComplete: () => {
      completionCount += 1;
    },
  });

  assert.deepEqual(rounds, [1, 2]);
  assert.deepEqual(phases, [
    ['inhale', 4],
    ['holdIn', 0],
    ['exhale', 6],
    ['holdOut', 0],
    ['inhale', 4],
    ['holdIn', 0],
    ['exhale', 6],
    ['holdOut', 0],
  ]);
  assert.equal(completionCount, 1);
});

test('stops before the next phase when the flow is cancelled', () => {
  const phases = [];
  let active = true;
  let completionCount = 0;

  runBreathingSessionPlan({
    plan: buildCyclicBreathingPlan(
      { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
      1,
    ),
    isActive: () => active,
    runPhase: (phase, _durationSeconds, onComplete) => {
      phases.push(phase);
      active = false;
      onComplete();
    },
    onRoundChange: () => {},
    onComplete: () => {
      completionCount += 1;
    },
  });

  assert.deepEqual(phases, ['inhale']);
  assert.equal(completionCount, 0);
});
