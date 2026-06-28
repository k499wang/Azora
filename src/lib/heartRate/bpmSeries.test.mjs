import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBpmSeries, summarizeBpmSeries } from './bpmSeries.ts';
import {
  buildBpmInsight,
  buildBpmLockedInsightPlaceholder,
} from './bpmInsight.ts';

function ramp(count, startBpm, stepBpm, stepMs = 1000) {
  return Array.from({ length: count }, (_, i) => ({
    offsetMs: i * stepMs,
    bpm: startBpm + i * stepBpm,
  }));
}

const WIM_HOF_PROFILE = { name: 'Wim Hof', response: 'energize' };
const RELAXING_PROFILE = { name: 'Relaxing Breath', response: 'downshift' };
const RESONANCE_PROFILE = { name: 'Resonance', response: 'resonance' };

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

test('BPM insight prefers plotted graph values over saved summary fields', () => {
  const insight = buildBpmInsight(
    [{ bpm: 70 }, { bpm: 72 }, { bpm: 78 }],
    { avgBpm: 81, minBpm: 61, maxBpm: 99, hrDrop: 12 },
  );

  assert.match(insight, /climbed 8 bpm/);
  assert.match(insight, /73 bpm/);
  assert.doesNotMatch(insight, /12 bpm drop/);
  assert.doesNotMatch(insight, /61-99 bpm/);
});

test('BPM insight falls back to saved summary when graph values are unavailable', () => {
  const insight = buildBpmInsight(
    [],
    { avgBpm: 71, minBpm: 68, maxBpm: 75, hrDrop: -7 },
  );

  assert.match(insight, /climbed 7 bpm/);
  assert.doesNotMatch(insight, /7 bpm drop/);
});

test('BPM insight explains a pronounced breath-hold diving reflex', () => {
  const insight = buildBpmInsight(
    [{ bpm: 82 }, { bpm: 63 }],
    { avgBpm: 72, minBpm: 61, maxBpm: 84, hrDrop: 16 },
    'breath-hold',
  );

  assert.match(insight, /pronounced diving-reflex response/);
  assert.match(insight, /parasympathetic engagement/);
  assert.match(insight, /63 to 82 bpm/);
  assert.doesNotMatch(insight, /resting rate/);
});

test('BPM insight contextualizes minimal breath-hold slowing', () => {
  const insight = buildBpmInsight(
    [{ bpm: 75 }, { bpm: 74 }],
    { avgBpm: 74, minBpm: 73, maxBpm: 76, hrDrop: 1 },
    'breath-hold',
  );

  assert.match(insight, /changed very little/);
  assert.match(insight, /look for a pattern across several sessions/);
});

test('BPM insight explains a breathing exercise graph downshift', () => {
  const insight = buildBpmInsight(
    [{ bpm: 82 }, { bpm: 76 }, { bpm: 70 }],
    undefined,
    'breathing-exercise',
  );

  assert.match(insight, /breathing graph/);
  assert.match(insight, /eased by 12 bpm/);
  assert.match(insight, /parasympathetic engagement/);
  assert.doesNotMatch(insight, /resting rate/);
});

test('BPM insight explains a breathing exercise graph increase', () => {
  const insight = buildBpmInsight(
    [{ bpm: 68 }, { bpm: 74 }, { bpm: 79 }],
    undefined,
    'breathing-exercise',
  );

  assert.match(insight, /rose 11 bpm/);
  assert.match(insight, /breathing graph/);
  assert.match(insight, /rhythm is challenging/);
});

test('BPM insight treats a Wim Hof heart-rate increase as intended activation', () => {
  const insight = buildBpmInsight(
    [{ bpm: 68 }, { bpm: 74 }, { bpm: 80 }],
    undefined,
    'breathing-exercise',
    WIM_HOF_PROFILE,
  );

  assert.match(insight, /Wim Hof/);
  assert.match(insight, /energizing intent/);
  assert.match(insight, /rather than a failed calming response/);
  assert.doesNotMatch(insight, /rhythm is challenging/);
});

test('BPM insight treats Relaxing Breath heart-rate drop as technique-specific downshift', () => {
  const insight = buildBpmInsight(
    [{ bpm: 82 }, { bpm: 76 }, { bpm: 70 }],
    undefined,
    'breathing-exercise',
    RELAXING_PROFILE,
  );

  assert.match(insight, /Relaxing Breath/);
  assert.match(insight, /down-regulating intent/);
  assert.match(insight, /longer exhale pattern/);
});

test('BPM insight explains steady resonance breathing as coherent breathing', () => {
  const insight = buildBpmInsight(
    [{ bpm: 70 }, { bpm: 71 }, { bpm: 70 }],
    undefined,
    'breathing-exercise',
    RESONANCE_PROFILE,
  );

  assert.match(insight, /Resonance/);
  assert.match(insight, /coherent breathing/);
});

test('BPM insight falls back to generic breathing copy without a technique profile', () => {
  const insight = buildBpmInsight(
    [{ bpm: 68 }, { bpm: 74 }, { bpm: 79 }],
    undefined,
    'breathing-exercise',
    null,
  );

  assert.match(insight, /rhythm is challenging/);
  assert.doesNotMatch(insight, /future-technique/);
});

test('locked BPM placeholder uses technique-specific breathing copy', () => {
  const insight = buildBpmLockedInsightPlaceholder('breathing-exercise', WIM_HOF_PROFILE);

  assert.match(insight, /Wim Hof/);
  assert.match(insight, /heart-rate rise/);
  assert.doesNotMatch(insight, /resting heart rate/);
});

test('BPM insight mentions repeated breathing exercise graph swings', () => {
  const insight = buildBpmInsight(
    [{ bpm: 70 }, { bpm: 76 }, { bpm: 71 }, { bpm: 77 }, { bpm: 72 }, { bpm: 78 }],
    undefined,
    'breathing-exercise',
  );

  assert.match(insight, /moved up and down several times/);
  assert.match(insight, /breathing rhythm/);
});

test('BPM insight mentions repeated breath-hold graph swings', () => {
  const insight = buildBpmInsight(
    [{ bpm: 82 }, { bpm: 75 }, { bpm: 80 }, { bpm: 74 }, { bpm: 79 }, { bpm: 73 }],
    undefined,
    'breath-hold',
  );

  assert.match(insight, /repeated up-and-down swings/);
  assert.match(insight, /diving-reflex response comes in waves/);
});

test('BPM insight ignores tiny graph wiggles', () => {
  const insight = buildBpmInsight(
    [{ bpm: 70 }, { bpm: 72 }, { bpm: 69 }, { bpm: 71 }, { bpm: 68 }, { bpm: 70 }],
    undefined,
    'breathing-exercise',
  );

  assert.doesNotMatch(insight, /moved up and down several times/);
  assert.doesNotMatch(insight, /one smooth trend/);
});
