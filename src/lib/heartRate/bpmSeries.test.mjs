import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBpmSeries, summarizeBpmSeries } from './bpmSeries.ts';
import { buildBpmInsight } from './bpmInsight.ts';

function ramp(count, startBpm, stepBpm, stepMs = 1000) {
  return Array.from({ length: count }, (_, i) => ({
    offsetMs: i * stepMs,
    bpm: startBpm + i * stepBpm,
  }));
}

test('empty input yields no points and null summary', () => {
  const { points, summary } = buildBpmSeries([]);
  assert.equal(points.length, 0);
  assert.deepEqual(summary, {
    avgBpm: null,
    minBpm: null,
    maxBpm: null,
    hrDropBpm: null,
  });
});

test('summary is derived from the smoothed points, not the raw samples', () => {
  // A lone spike the graph smoothing flattens must not leak into min/max.
  const raw = [
    { offsetMs: 0, bpm: 80 },
    { offsetMs: 1000, bpm: 80 },
    { offsetMs: 2000, bpm: 200 }, // outlier
    { offsetMs: 3000, bpm: 80 },
    { offsetMs: 4000, bpm: 80 },
  ];
  const { points, summary } = buildBpmSeries(raw);
  const plottedMax = Math.max(...points.map((p) => p.bpm));
  assert.equal(summary.maxBpm, plottedMax);
  assert.ok(summary.maxBpm < 200, 'spike should be smoothed out of the summary');
});

test('out-of-range and non-finite samples are dropped', () => {
  const raw = [
    { offsetMs: 0, bpm: 10 }, // below MIN
    { offsetMs: 1000, bpm: 70 },
    { offsetMs: 2000, bpm: Number.NaN },
    { offsetMs: 3000, bpm: 300 }, // above MAX
    { offsetMs: 4000, bpm: 72 },
  ];
  const { points } = buildBpmSeries(raw);
  assert.equal(points.length, 2);
  assert.deepEqual(points.map((p) => p.bpm), [70, 72]);
});

test('samples are sorted by offset before processing', () => {
  const raw = [
    { offsetMs: 2000, bpm: 75 },
    { offsetMs: 0, bpm: 70 },
    { offsetMs: 1000, bpm: 72 },
  ];
  const { points } = buildBpmSeries(raw);
  assert.deepEqual(points.map((p) => p.offsetMs), [0, 1000, 2000]);
});

test('downsamples to at most maxPoints', () => {
  const { points } = buildBpmSeries(ramp(200, 60, 0), { maxPoints: 24 });
  assert.ok(points.length <= 24);
});

test('hrDropBpm is peak-to-trough and never negative', () => {
  const summary = summarizeBpmSeries([
    { offsetMs: 0, label: '0:00', bpm: 90 },
    { offsetMs: 1000, label: '0:01', bpm: 72 },
    { offsetMs: 2000, label: '0:02', bpm: 80 },
  ]);
  assert.equal(summary.minBpm, 72);
  assert.equal(summary.maxBpm, 90);
  assert.equal(summary.hrDropBpm, 18);
});

test('labels are formatted as m:ss', () => {
  const { points } = buildBpmSeries([
    { offsetMs: 0, bpm: 70 },
    { offsetMs: 65000, bpm: 72 },
  ]);
  assert.equal(points[0].label, '0:00');
  assert.equal(points[1].label, '1:05');
});

test('BPM insight uses saved summary fields instead of plotted extrema', () => {
  const insight = buildBpmInsight(
    [{ bpm: 70 }, { bpm: 72 }],
    { avgBpm: 81, minBpm: 61, maxBpm: 99, hrDrop: 12 },
  );

  assert.match(insight, /12 bpm drop/);
  assert.match(insight, /81 bpm/);
  assert.match(insight, /61-99 bpm/);
});

test('BPM insight preserves a saved negative HR drop as a climb', () => {
  const insight = buildBpmInsight(
    [{ bpm: 70 }, { bpm: 72 }],
    { avgBpm: 71, minBpm: 68, maxBpm: 75, hrDrop: -7 },
  );

  assert.match(insight, /climbed 7 bpm/);
  assert.doesNotMatch(insight, /7 bpm drop/);
});
