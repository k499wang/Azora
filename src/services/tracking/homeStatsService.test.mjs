import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStressHistory } from './homeStatsCore.ts';
import { getStressStats } from '../../lib/heartRate/stress.ts';

test('buildStressHistory combines recent heart-rate and breath-hold stress entries', () => {
  const history = buildStressHistory(
    [
      { stress: 42, localDate: '2026-05-21' },
      { stress: null, localDate: '2026-05-20' },
    ],
    [
      { stress: 28, localDate: '2026-05-19' },
      { stress: 64, localDate: '2026-05-18' },
    ],
  );

  assert.deepEqual(history, [
    { stress: 42, localDate: '2026-05-21' },
    { stress: null, localDate: '2026-05-20' },
    { stress: 28, localDate: '2026-05-19' },
    { stress: 64, localDate: '2026-05-18' },
  ]);
});

test('stress stats count only valid stress values from the combined history', () => {
  const history = buildStressHistory(
    [
      { stress: 40, localDate: '2026-05-21' },
      { stress: null, localDate: '2026-05-20' },
      { stress: 60, localDate: '2026-05-19' },
    ],
    [
      { stress: 20, localDate: '2026-05-18' },
      { stress: 80, localDate: '2026-05-17' },
    ],
  );

  const stats = getStressStats(history);

  assert.equal(stats.count, 4);
  assert.equal(stats.avg, 50);
  assert.equal(stats.min, 20);
  assert.equal(stats.max, 80);
});
