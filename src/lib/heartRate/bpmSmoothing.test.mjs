import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGraphBpmValuePointsFromIbis,
  createBreathExerciseBpmPresentationFilter,
  createLiveBpmPresentationFilter,
  createBpmPresentationFilter,
  isExerciseBpmSnapshotReady,
} from './bpmSmoothing.ts';

test('exercise BPM startup accepts the first concrete manager snapshot above the quality gate', () => {
  assert.equal(isExerciseBpmSnapshotReady(null), false);
  assert.equal(
    isExerciseBpmSnapshotReady({ timestamp: 1_000, bpm: 82, signalQuality: 0.04 }),
    false,
  );
  assert.equal(
    isExerciseBpmSnapshotReady({ timestamp: 1_000, bpm: 82, signalQuality: 0.05 }),
    true,
  );
});

function visibleLiveBpmSequence(samples) {
  const filter = createLiveBpmPresentationFilter();
  let visible = null;

  return samples.map((bpm, index) => {
    const next = filter.update({
      elapsedMs: index * 1_000,
      bpm,
    });
    if (next != null) {
      visible = next;
    }
    return visible;
  });
}

function visibleBreathExerciseBpmSequence(samples) {
  const filter = createBreathExerciseBpmPresentationFilter();
  let visible = null;
  if (samples.length > 0) {
    filter.update({ elapsedMs: -2_000, bpm: samples[0] });
    filter.update({ elapsedMs: -1_000, bpm: samples[0] });
  }

  return samples.map((bpm, index) => {
    const next = filter.update({
      elapsedMs: index * 1_000,
      bpm,
    });
    if (next != null) {
      visible = next;
    }
    return visible;
  });
}

function seedBreathExerciseFilter(filter, bpm, elapsedMs = 0) {
  assert.equal(filter.update({ elapsedMs: elapsedMs - 2_000, bpm }), null);
  assert.equal(filter.update({ elapsedMs: elapsedMs - 1_000, bpm }), null);
  assert.equal(filter.update({ elapsedMs, bpm }), bpm);
}

test('breath exercise hides settling-high startup estimates until the rhythm stabilizes low', () => {
  const filter = createBreathExerciseBpmPresentationFilter();
  const readings = [118, 109, 98, 82, 74, 72, 71];
  const shown = readings.map((bpm, index) =>
    filter.update({ elapsedMs: index * 1_000, bpm }));

  assert.deepEqual(shown, [null, null, null, null, null, null, 71]);
});

test('breath exercise accepts a genuinely stable high startup rhythm', () => {
  const filter = createBreathExerciseBpmPresentationFilter();
  assert.equal(filter.update({ elapsedMs: 0, bpm: 118 }), null);
  assert.equal(filter.update({ elapsedMs: 500, bpm: 120 }), null);
  assert.equal(filter.update({ elapsedMs: 1_000, bpm: 119 }), 119);
});

test('BpmPresentationFilter hides startup readings until the recent window is stable', () => {
  const filter = createBpmPresentationFilter({
    warmupMs: 5_000,
    minStableReadings: 3,
    stableRangeBpm: 8,
  });

  assert.equal(filter.update({ elapsedMs: 1_000, bpm: 104 }), null);
  assert.equal(filter.update({ elapsedMs: 5_200, bpm: 96 }), null);
  assert.equal(filter.update({ elapsedMs: 6_200, bpm: 87 }), null);
  assert.equal(filter.update({ elapsedMs: 7_200, bpm: 84 }), null);
  assert.equal(filter.update({ elapsedMs: 8_200, bpm: 83 }), 83);
});

test('BpmPresentationFilter caps confirmed display movement without flattening it', () => {
  const filter = createBpmPresentationFilter({
    warmupMs: 0,
    minStableReadings: 1,
    maxStepBpm: 4,
    spikeThresholdBpm: 20,
  });

  assert.equal(filter.update({ elapsedMs: 0, bpm: 82 }), 82);
  assert.equal(filter.update({ elapsedMs: 1_000, bpm: 86 }), 86);
  assert.equal(filter.update({ elapsedMs: 2_000, bpm: 96 }), 90);
  assert.equal(filter.update({ elapsedMs: 3_000, bpm: 99 }), 94);
});

test('BpmPresentationFilter rejects isolated spikes but accepts sustained jumps gradually', () => {
  const filter = createBpmPresentationFilter({
    warmupMs: 0,
    minStableReadings: 1,
    maxStepBpm: 5,
    spikeThresholdBpm: 12,
    spikeConfirmationBpm: 5,
  });

  assert.equal(filter.update({ elapsedMs: 0, bpm: 84 }), 84);
  assert.equal(filter.update({ elapsedMs: 1_000, bpm: 110 }), null);
  assert.equal(filter.update({ elapsedMs: 2_000, bpm: 85 }), 85);
  assert.equal(filter.update({ elapsedMs: 3_000, bpm: 106 }), null);
  assert.equal(filter.update({ elapsedMs: 4_000, bpm: 108 }), 90);
});

test('Live BPM presentation filter uses the onboarding baseline display response', () => {
  assert.deepEqual(
    visibleLiveBpmSequence([101, 92, 84, 82, 83, 84]),
    [101, 99, 99, 97, 97, 95],
  );
});

test('Live BPM presentation filter holds through isolated collapse and rebound noise', () => {
  assert.deepEqual(
    visibleLiveBpmSequence([100, 101, 100, 99, 100, 50, 80, 101]),
    [100, 100, 100, 100, 100, 100, 100, 100],
  );
});

test('Live BPM presentation filter accepts sustained changes slowly', () => {
  assert.deepEqual(
    visibleLiveBpmSequence([80, 81, 80, 80, 96, 97, 98, 99, 100]),
    [80, 80, 80, 80, 80, 82, 82, 84, 84],
  );
});

test('breath exercise BPM presentation filter caps isolated upward jumps', () => {
  assert.deepEqual(
    visibleBreathExerciseBpmSequence([76, 77, 76, 87, 76, 77]),
    [76, 76, 76, 76, 76, 76],
  );
});

test('breath exercise BPM presentation filter lets sustained increases rise gradually', () => {
  assert.deepEqual(
    visibleBreathExerciseBpmSequence([76, 77, 76, 87, 88, 89, 90, 91]),
    [76, 76, 76, 76, 79, 82, 85, 88],
  );
});

test('breath exercise BPM presentation filter holds very large spikes for confirmation', () => {
  assert.deepEqual(
    visibleBreathExerciseBpmSequence([76, 77, 76, 96, 76, 77, 96, 98]),
    [76, 76, 76, 76, 76, 76, 76, 79],
  );
});

test('buildGraphBpmValuePointsFromIbis trims high startup lock-on noise', () => {
  const points = buildGraphBpmValuePointsFromIbis(
    [550, 560, 840, 830, 825, 820, 815, 810].map((ibiMs, index) => ({
      offsetMs: (index + 1) * 1000,
      ibiMs,
    })),
    (sample) => `${sample.offsetMs}`,
  );

  assert.deepEqual(
    points.map(({ label, value }) => ({ label, value })),
    [
    { label: '5000', value: 73 },
    { label: '6000', value: 73 },
    { label: '7000', value: 73 },
    { label: '8000', value: 73 },
    ],
  );
});

test('buildGraphBpmValuePointsFromIbis preserves sustained changes without full beat-to-beat jumps', () => {
  const points = buildGraphBpmValuePointsFromIbis(
    [800, 805, 810, 620, 615, 610, 605, 600, 595, 590].map((ibiMs, index) => ({
      offsetMs: (index + 1) * 1000,
      ibiMs,
    })),
    (sample) => `${sample.offsetMs}`,
  );

  assert.deepEqual(points.map((point) => point.value), [97, 98, 98, 98, 99, 99]);
});

test('buildGraphBpmValuePointsFromIbis keeps startup IBIs for short graph series', () => {
  const points = buildGraphBpmValuePointsFromIbis(
    [800, 805, 810, 815, 820].map((ibiMs, index) => ({
      offsetMs: (index + 1) * 1000,
      ibiMs,
    })),
    (sample) => `${sample.offsetMs}`,
  );

  assert.equal(points[0]?.label, '3000');
});

test('breath exercise deadband holds small physiological variation steady', () => {
  const filter = createBreathExerciseBpmPresentationFilter();
  seedBreathExerciseFilter(filter, 70);

  // Breathing-driven wiggle within the deadband must not move the number.
  const shown = [71, 69, 72, 68, 70].map((bpm, index) =>
    filter.update({ elapsedMs: (index + 1) * 1_000, bpm }));
  assert.deepEqual(shown, [70, 70, 70, 70, 70]);
});

test('presentation filter: deadband still tracks a genuine trend', () => {
  const filter = createBreathExerciseBpmPresentationFilter();
  seedBreathExerciseFilter(filter, 70);

  // A sustained real drop keeps exceeding the deadband and the display
  // follows at the decrease rate, settling within the deadband of the target.
  const shown = [];
  for (const [i, bpm] of [64, 62, 60, 60, 60, 60].entries()) {
    shown.push(filter.update({ elapsedMs: (i + 1) * 1_000, bpm }));
  }
  assert.deepEqual(shown, [67, 64, 61, 61, 61, 61]);
});

test('breath exercise applies rate-limited movement at irregular update intervals', () => {
  const filter = createBreathExerciseBpmPresentationFilter();
  seedBreathExerciseFilter(filter, 70);
  assert.equal(filter.update({ elapsedMs: 500, bpm: 82 }), null);
  // Confirmation arrives 250ms later, allowing 0.75 BPM upward (3 BPM/s).
  assert.equal(filter.update({ elapsedMs: 750, bpm: 83 }), 71);
  assert.equal(filter.update({ elapsedMs: 1_250, bpm: 58 }), null);
  // Downward confirmation arrives 500ms later, allowing 1.5 BPM.
  assert.equal(filter.update({ elapsedMs: 1_750, bpm: 57 }), 69);
});

test('breath exercise presentation moves at three BPM per second', () => {
  const rising = createBreathExerciseBpmPresentationFilter();
  const falling = createBreathExerciseBpmPresentationFilter();
  seedBreathExerciseFilter(rising, 70);
  seedBreathExerciseFilter(falling, 90);

  // A typical 75 BPM cadence is one snapshot every 800ms rather than on exact
  // one-second boundaries. Three BPM/s permits 2.4-BPM internal movement per
  // update in either direction (rounded only for display).
  assert.equal(rising.update({ elapsedMs: 800, bpm: 79 }), 72);
  assert.equal(falling.update({ elapsedMs: 800, bpm: 81 }), 88);
  assert.equal(rising.update({ elapsedMs: 1_600, bpm: 79 }), 75);
  assert.equal(falling.update({ elapsedMs: 1_600, bpm: 81 }), 85);
});

test('breath exercise rejected spikes do not bank presentation catch-up time', () => {
  const filter = createBreathExerciseBpmPresentationFilter();
  seedBreathExerciseFilter(filter, 70);
  assert.equal(filter.update({ elapsedMs: 4_000, bpm: 90 }), null);
  assert.equal(filter.update({ elapsedMs: 4_200, bpm: 91 }), 71);
});

test('breath exercise retains fractional movement internally', () => {
  const filter = createBreathExerciseBpmPresentationFilter();
  seedBreathExerciseFilter(filter, 70);
  assert.equal(filter.update({ elapsedMs: 100, bpm: 75 }), 70);
  assert.equal(filter.update({ elapsedMs: 200, bpm: 75 }), 71);
});

test('breath exercise re-anchors immediately after elapsed time moves backwards', () => {
  const filter = createBreathExerciseBpmPresentationFilter();
  seedBreathExerciseFilter(filter, 70, 5_000);
  assert.equal(filter.update({ elapsedMs: 0, bpm: 75 }), 70);
  assert.equal(filter.update({ elapsedMs: 1_000, bpm: 75 }), 73);
});
