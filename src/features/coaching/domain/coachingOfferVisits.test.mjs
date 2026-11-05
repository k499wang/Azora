import assert from 'node:assert/strict';
import test from 'node:test';
import { recordCoachingOfferVisit } from './coachingOfferVisits.ts';

const visits = (...dates) =>
  dates.reduce((previous, date) => recordCoachingOfferVisit(previous, date), null);

test('three consecutive local days reach the target, across a month end', () => {
  assert.equal(visits('2026-10-30', '2026-10-31', '2026-11-01').consecutiveDays, 3);
});

test('a second visit on the same day does not count twice', () => {
  assert.equal(visits('2026-11-01', '2026-11-01', '2026-11-01').consecutiveDays, 1);
});

test('a missed day restarts the run', () => {
  assert.equal(visits('2026-11-01', '2026-11-02', '2026-11-04').consecutiveDays, 1);
});

test('a missed day after reaching the target keeps the offer', () => {
  assert.equal(visits('2026-11-01', '2026-11-02', '2026-11-03', '2026-11-20').consecutiveDays, 3);
});

test('a dismissal survives later visits', () => {
  const dismissed = { ...visits('2026-11-01'), dismissed: true };
  assert.equal(recordCoachingOfferVisit(dismissed, '2026-11-02').dismissed, true);
});
