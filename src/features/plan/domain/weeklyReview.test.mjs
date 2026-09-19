import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compareToBefore,
  weeklyReview,
} from './weeklyReview';

/** Wednesday 2026-09-16. Last week is Sun 6th to Sat 12th. */
const TODAY = '2026-09-16';

const kept = (...dates) =>
  dates.map((activityDate) => ({ activityDate, qualifiesForStreak: true }));

test('reports the last completed week, not the one in progress', () => {
  const review = weeklyReview(
    kept('2026-09-14', '2026-09-15', '2026-09-10', '2026-09-11'),
    [],
    TODAY,
  );

  assert.equal(review.start, '2026-09-06');
  assert.equal(review.end, '2026-09-12');
  // This week's two days are not counted.
  assert.equal(review.daysKept, 2);
});

test('a day that does not qualify for the streak is not a day kept', () => {
  const review = weeklyReview(
    [
      { activityDate: '2026-09-07', qualifiesForStreak: true },
      { activityDate: '2026-09-08', qualifiesForStreak: false },
    ],
    [],
    TODAY,
  );

  assert.equal(review.daysKept, 1);
});

test('compares against the week before that', () => {
  const review = weeklyReview(
    kept('2026-09-07', '2026-09-08', '2026-09-01', '2026-08-31'),
    [],
    TODAY,
  );

  assert.equal(review.daysKept, 2);
  assert.equal(review.daysKeptBefore, 2);
});

test('a user who was not here yet gets no comparison, not a decline', () => {
  const review = weeklyReview(kept('2026-09-07'), [], TODAY);

  assert.equal(review.daysKept, 1);
  assert.equal(review.daysKeptBefore, null);
});

test('a real zero is reported once they were here for it', () => {
  const review = weeklyReview(
    kept('2026-09-07', '2026-08-25'),
    [],
    TODAY,
  );

  assert.equal(review.daysKeptBefore, 0);
});

test('mood averages onto the five points it was answered on', () => {
  const review = weeklyReview(
    [],
    [
      { localDate: '2026-09-07', score: 100 },
      { localDate: '2026-09-08', score: 50 },
      { localDate: '2026-09-09', score: 0 },
    ],
    TODAY,
  );

  assert.equal(review.mood, 3);
});

test('too few check-ins is no average at all', () => {
  const review = weeklyReview(
    [],
    [
      { localDate: '2026-09-07', score: 100 },
      { localDate: '2026-09-08', score: 100 },
    ],
    TODAY,
  );

  assert.equal(review.mood, null);
});

test('direction reads flat inside the deadband and is absent without a prior', () => {
  assert.equal(compareToBefore(5, 3), 'up');
  assert.equal(compareToBefore(3, 5), 'down');
  assert.equal(compareToBefore(3, 3), 'same');
  assert.equal(compareToBefore(3.2, 3.1, 0.2), 'same');
  assert.equal(compareToBefore(5, null), null);
});
