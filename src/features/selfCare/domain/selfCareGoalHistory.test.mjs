import assert from 'node:assert/strict';
import test from 'node:test';
import { selfCareGoalHistory, shiftSelfCareLocalDate } from './selfCareGoalHistory.ts';

const goal = (recurrence, createdAt = '2026-01-01T12:00:00') => ({
  recurrence,
  recurrenceAnchorDate: '2026-10-05',
  createdAt,
});

test('shifts local dates across month ends', () => {
  assert.equal(shiftSelfCareLocalDate('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftSelfCareLocalDate('2026-12-31', 1), '2027-01-01');
});

test('runs oldest to newest over the window, today pending', () => {
  const days = selfCareGoalHistory(goal('daily'), ['2026-10-14'], '2026-10-16');
  assert.equal(days.length, 30);
  assert.equal(days[0].date, '2026-09-17');
  assert.deepEqual(days.slice(-3).map((day) => day.state), ['done', 'missed', 'pending']);
});

test('today done reads done', () => {
  const days = selfCareGoalHistory(goal('daily'), new Set(['2026-10-16']), '2026-10-16', 1);
  assert.deepEqual(days, [{ date: '2026-10-16', state: 'done' }]);
});

test('days before the habit was written are before-start', () => {
  const days = selfCareGoalHistory(goal('daily', '2026-10-15T12:00:00'), [], '2026-10-16', 3);
  assert.deepEqual(days.map((day) => day.state), ['before-start', 'missed', 'pending']);
});

test('weekdays skip the weekend, but a weekend completion still counts', () => {
  const days = selfCareGoalHistory(goal('weekdays'), ['2026-10-11'], '2026-10-12', 3);
  assert.deepEqual(days.map((day) => day.state), ['not-due', 'done', 'pending']);
});

test('weekly is due only on its anchor weekday', () => {
  const days = selfCareGoalHistory(goal('weekly'), [], '2026-10-12', 8);
  assert.deepEqual(
    days.map((day) => day.state),
    ['missed', 'not-due', 'not-due', 'not-due', 'not-due', 'not-due', 'not-due', 'pending'],
  );
});

test('a one-off is not due after the day it was done', () => {
  const days = selfCareGoalHistory(goal('once'), ['2026-10-14'], '2026-10-16', 3);
  assert.deepEqual(days.map((day) => day.state), ['done', 'not-due', 'not-due']);
});
