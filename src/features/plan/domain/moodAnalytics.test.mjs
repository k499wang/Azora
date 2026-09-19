import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MIN_DAYS_PER_SIDE,
  factorEffects,
  moodTrend,
  moodTrendSegments,
  resetEffect,
  toScaleMean,
} from './moodAnalytics';

const day = (n, score, tags = []) => ({
  localDate: `2026-09-${String(n).padStart(2, '0')}`,
  score,
  tags,
});
const kept = (n) => ({
  activityDate: `2026-09-${String(n).padStart(2, '0')}`,
  qualifiesForStreak: true,
});

test('a 0-100 score reads back on the five points it was answered on', () => {
  assert.equal(toScaleMean(0), 1);
  assert.equal(toScaleMean(50), 3);
  assert.equal(toScaleMean(100), 5);
});

test('the reset effect compares kept days against the rest', () => {
  // Five kept days, all okay or better; five missed days, one okay.
  const checkIns = [
    ...[1, 2, 3, 4, 5].map((n) => day(n, 75)),
    ...[6, 7, 8, 9].map((n) => day(n, 0)),
    day(10, 75),
  ];
  const effect = resetEffect(checkIns, [1, 2, 3, 4, 5].map(kept));

  assert.equal(effect.keptShare, 1);
  assert.equal(effect.missedShare, 0.2);
  assert.equal(effect.keptDays, 5);
  assert.equal(effect.missedDays, 5);
});

test('it refuses to speak when either side is thin', () => {
  const checkIns = [1, 2, 3, 4, 5, 6].map((n) => day(n, 75));
  // Every day kept, so there is nothing to compare against.
  const effect = resetEffect(checkIns, checkIns.map((_, i) => kept(i + 1)));

  assert.equal(effect, null);
  assert.ok(MIN_DAYS_PER_SIDE > 1);
});

test('it is willing to report that the kept days went worse', () => {
  const effect = resetEffect(
    [
      ...[1, 2, 3, 4, 5].map((n) => day(n, 0)),
      ...[6, 7, 8, 9, 10].map((n) => day(n, 100)),
    ],
    [1, 2, 3, 4, 5].map(kept),
  );

  assert.equal(effect.keptShare, 0);
  assert.equal(effect.missedShare, 1);
});

test('factors rank against the user own baseline, both ways', () => {
  const checkIns = [
    ...[1, 2, 3, 4].map((n) => day(n, 100, ['exercise'])),
    ...[5, 6, 7, 8].map((n) => day(n, 0, ['work'])),
  ];
  const effects = factorEffects(checkIns);

  assert.equal(effects.baseline, 3);
  assert.deepEqual(
    effects.better.map((factor) => factor.tagId),
    ['exercise'],
  );
  assert.deepEqual(
    effects.harder.map((factor) => factor.tagId),
    ['work'],
  );
  assert.equal(effects.better[0].tagMean, 5);
  assert.equal(effects.better[0].effect, 2);
  assert.equal(effects.better[0].days, 4);
});

test('a tag with too few days gets no opinion', () => {
  const checkIns = [
    ...[1, 2, 3].map((n) => day(n, 100, ['travel'])),
    ...[4, 5, 6, 7].map((n) => day(n, 0)),
  ];

  assert.equal(factorEffects(checkIns), null);
});

test('a tag that barely moves the needle is left out', () => {
  const checkIns = [
    ...[1, 2, 3, 4].map((n) => day(n, 52, ['work'])),
    ...[5, 6, 7, 8].map((n) => day(n, 48)),
  ];

  assert.equal(factorEffects(checkIns), null);
});

test('at most three factors a side, strongest first', () => {
  const checkIns = [
    ...[1, 2, 3, 4].map((n) => day(n, 100, ['exercise'])),
    ...[5, 6, 7, 8].map((n) => day(n, 90, ['outdoors'])),
    ...[9, 10, 11, 12].map((n) => day(n, 80, ['friends'])),
    ...[13, 14, 15, 16].map((n) => day(n, 70, ['family'])),
    ...[17, 18, 19, 20].map((n) => day(n, 0, ['work'])),
  ];
  const effects = factorEffects(checkIns);

  assert.equal(effects.better.length, 3);
  assert.deepEqual(
    effects.better.map((factor) => factor.tagId),
    ['exercise', 'outdoors', 'friends'],
  );
});

test('the trend keeps every day in order and leaves gaps as gaps', () => {
  const points = moodTrend([day(10, 100), day(12, 0)], '2026-09-12', 4);

  assert.deepEqual(
    points.map((point) => point.localDate),
    ['2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12'],
  );
  assert.deepEqual(
    points.map((point) => point.value),
    [null, 5, null, 1],
  );
});

test('a line is only drawn over consecutive answered days', () => {
  const points = moodTrend(
    [day(9, 50), day(10, 50), day(12, 50)],
    '2026-09-12',
    4,
  );

  assert.deepEqual(moodTrendSegments(points), [[0, 1], [3]]);
});
