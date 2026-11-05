import assert from 'node:assert/strict';
import test from 'node:test';
import { recordCoachingOfferVisit } from './coachingOfferVisits.ts';

const visits = (...dates) =>
  dates.reduce((previous, date) => recordCoachingOfferVisit(previous, date), null);

test('three days in a row reach the target, across a month end', () => {
  assert.equal(visits('2026-10-30', '2026-10-31', '2026-11-01').daysVisited, 3);
});

test('a second visit on the same day does not count twice', () => {
  assert.equal(visits('2026-11-01', '2026-11-01', '2026-11-01').daysVisited, 1);
});

test('days with gaps between them still count', () => {
  assert.equal(visits('2026-11-01', '2026-11-04', '2026-11-20').daysVisited, 3);
});

test('a dismissal survives later visits', () => {
  const dismissed = { ...visits('2026-11-01'), dismissed: true };
  assert.equal(recordCoachingOfferVisit(dismissed, '2026-11-02').dismissed, true);
});
