import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGraphBpmValuePointsFromIbis,
  createBpmPresentationFilter,
} from './bpmSmoothing.ts';

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

  assert.deepEqual(points.map((point) => point.value), [75, 75, 75, 78, 81]);
});
