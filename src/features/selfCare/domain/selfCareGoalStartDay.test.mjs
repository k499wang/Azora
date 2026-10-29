import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selfCareGoalExistedOnLocalDate } from '../../../services/selfCare/selfCareGoalDate.ts';
import {
  selfCareGoalStartDayLabel,
  selfCareGoalStartDays,
  selfCareGoalStartIso,
  selfCareGoalStartsOn,
} from './selfCareGoalStartDay.ts';

const today = '2026-10-29';

test('the picker offers today and the six days after it, across a month end', () => {
  assert.deepEqual(selfCareGoalStartDays(today), [
    '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04',
  ]);
});

test('days read as Today, Tomorrow, then a short date', () => {
  assert.equal(selfCareGoalStartDayLabel(null, today), 'Today');
  assert.equal(selfCareGoalStartDayLabel(today, today), 'Today');
  assert.equal(selfCareGoalStartDayLabel('2026-10-30', today), 'Tomorrow');
  assert.equal(selfCareGoalStartDayLabel('2026-11-01', today), 'Sun, Nov 1');
});

test('a planned to-do is hidden before its day and shown from it, by the rule every build already uses', () => {
  const row = { created_at: selfCareGoalStartIso('2026-11-01'), archived_at: null };
  assert.equal(selfCareGoalExistedOnLocalDate(row, '2026-10-31'), false);
  assert.equal(selfCareGoalExistedOnLocalDate(row, '2026-11-01'), true);
  assert.equal(selfCareGoalExistedOnLocalDate(row, '2026-11-05'), true);
});

test('only a later start counts as planned', () => {
  assert.equal(selfCareGoalStartsOn({ createdAt: selfCareGoalStartIso('2026-11-01') }, today), '2026-11-01');
  assert.equal(selfCareGoalStartsOn({ createdAt: selfCareGoalStartIso(today) }, today), null);
  assert.equal(selfCareGoalStartsOn({ createdAt: '2026-10-01T12:00:00Z' }, today), null);
});
