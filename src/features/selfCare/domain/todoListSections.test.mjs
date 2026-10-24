import test from 'node:test';
import assert from 'node:assert/strict';
import {
  todoListGoalOrder,
  todoListGoalSlots,
  todoListRows,
} from './todoListSections.ts';
import { currentSelfCareGoalDaypart } from './selfCareGoal.ts';

const goal = (id, scheduledTime, completedToday = false) => ({
  id,
  scheduledTime,
  completedToday,
  createdAt: '2026-01-01',
});

test('rows keep the given order within each part of the day, untimed last', () => {
  const rows = todoListRows(
    [goal('free', null), goal('late', '21:00'), goal('b', '07:00'), goal('a', '08:00')],
    new Set(),
  );
  assert.deepEqual(rows.map((row) => row.id), [
    'daypart:start', 'b', 'a', 'daypart:bedtime', 'late', 'daypart:anytime', 'free',
  ]);
  assert.equal(rows[0].label, 'Start the day');
  assert.equal(rows[5].label, 'Any time');
});

test('a part whose every goal is leaving marks its header leaving', () => {
  const rows = todoListRows([goal('a', '07:00'), goal('b', '21:00')], new Set(['b']));
  assert.deepEqual(rows.map((row) => row.id), ['daypart:start', 'a', 'daypart:bedtime', 'b']);
  assert.equal(rows[0].leaving, false);
  assert.equal(rows[2].leaving, true);
});

test('a reorder within a part is taken as the goal order', () => {
  const rows = todoListRows([goal('a', '07:00'), goal('b', '08:00'), goal('c', '21:00')], new Set());
  assert.deepEqual(
    todoListGoalOrder(rows, ['daypart:start', 'b', 'a', 'daypart:bedtime', 'c']),
    ['b', 'a', 'c'],
  );
});

test('a reorder across a header is refused', () => {
  const rows = todoListRows([goal('a', '07:00'), goal('c', '21:00')], new Set());
  assert.equal(todoListGoalOrder(rows, ['daypart:start', 'daypart:bedtime', 'a', 'c']), null);
  assert.equal(todoListGoalOrder(rows, ['a', 'daypart:start', 'daypart:bedtime', 'c']), null);
  assert.equal(todoListGoalOrder(rows, ['daypart:start', 'a', 'daypart:bedtime', 'x']), null);
});

test('a leaving part does not block a reorder elsewhere', () => {
  const rows = todoListRows([goal('a', '07:00'), goal('b', '08:00'), goal('c', '21:00')], new Set(['c']));
  assert.deepEqual(
    todoListGoalOrder(rows, ['daypart:start', 'b', 'a', 'daypart:bedtime', 'c']),
    ['b', 'a', 'c'],
  );
});

test('a goal drags only within its own part of the day', () => {
  const rows = todoListRows([goal('a', '07:00'), goal('b', '08:00'), goal('c', '21:00')], new Set());
  assert.deepEqual(todoListGoalSlots(rows, 1), { first: 1, last: 2 });
  assert.deepEqual(todoListGoalSlots(rows, 2), { first: 1, last: 2 });
  assert.deepEqual(todoListGoalSlots(rows, 4), { first: 4, last: 4 });
});

test('the current part of the day follows local hours', () => {
  assert.equal(currentSelfCareGoalDaypart(new Date(2026, 9, 16, 8)), 'start');
  assert.equal(currentSelfCareGoalDaypart(new Date(2026, 9, 16, 14)), 'afternoon');
  assert.equal(currentSelfCareGoalDaypart(new Date(2026, 9, 16, 19)), 'evening');
  assert.equal(currentSelfCareGoalDaypart(new Date(2026, 9, 16, 23)), 'bedtime');
});
