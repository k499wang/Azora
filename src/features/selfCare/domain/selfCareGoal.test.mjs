import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completedGoalsSummary,
  isSelfCareGoalDueOn,
  normalizeSelfCareGoalTitle,
  sortSelfCareGoals,
  COMPLETED_COLLAPSE_THRESHOLD,
  planSelfCareGoalList,
} from './selfCareGoal.ts';

test('normalizes a goal title and rejects invalid values', () => {
  assert.equal(normalizeSelfCareGoalTitle('  Drink water  '), 'Drink water');
  assert.equal(normalizeSelfCareGoalTitle('   '), null);
  assert.equal(normalizeSelfCareGoalTitle('a'.repeat(121)), null);
});

test('scheduled goals run earliest first, untimed ones sink below', () => {
  const timed = (id, scheduledTime, createdAt) => ({
    id,
    title: id,
    createdAt,
    updatedAt: createdAt,
    completedToday: false,
    scheduledTime,
  });

  const goals = [
    timed('untimed-old', null, '2026-01-01'),
    timed('evening', '19:30', '2026-01-01'),
    timed('untimed-new', null, '2026-01-04'),
    timed('morning', '07:15', '2026-01-02'),
    timed('noon', '12:00', '2026-01-03'),
  ];

  assert.deepEqual(
    sortSelfCareGoals(goals).map((goal) => goal.id),
    ['morning', 'noon', 'evening', 'untimed-new', 'untimed-old'],
  );
});

test('sorts newest first and leaves completed goals where they are', () => {
  const goals = [
    { id: 'old-done', title: 'A', createdAt: '2026-01-01', updatedAt: '2026-01-01', completedToday: true },
    { id: 'new-open', title: 'B', createdAt: '2026-01-04', updatedAt: '2026-01-04', completedToday: false },
    { id: 'old-open', title: 'C', createdAt: '2026-01-02', updatedAt: '2026-01-02', completedToday: false },
    { id: 'new-done', title: 'D', createdAt: '2026-01-03', updatedAt: '2026-01-03', completedToday: true },
  ];

  assert.deepEqual(
    sortSelfCareGoals(goals).map((goal) => goal.id),
    ['new-open', 'new-done', 'old-open', 'old-done'],
  );
});

const goal = (id, completedToday) => ({
  id,
  title: id,
  createdAt: id,
  updatedAt: id,
  completedToday,
});

test('a few completed goals stay on the rail, in place', () => {
  const list = planSelfCareGoalList([goal('a', true), goal('b', false)]);
  assert.deepEqual(
    list.rail.map((entry) => entry.id),
    ['b', 'a'],
  );
  assert.deepEqual(list.drawer, []);
});

test('completed goals collapse into the drawer past the threshold', () => {
  const completed = Array.from(
    { length: COMPLETED_COLLAPSE_THRESHOLD + 1 },
    (_, index) => goal(`done-${index}`, true),
  );
  const list = planSelfCareGoalList([...completed, goal('open', false)]);
  assert.deepEqual(
    list.rail.map((entry) => entry.id),
    ['open'],
  );
  assert.equal(list.drawer.length, COMPLETED_COLLAPSE_THRESHOLD + 1);
});

test('completedGoalsSummary counts one to-do in the singular', () => {
  assert.equal(completedGoalsSummary(1), '1 to-do done today!');
  assert.equal(completedGoalsSummary(4), '4 to-dos done today!');
});

const recurring = (recurrence) => ({
  id: recurrence,
  title: recurrence,
  recurrence,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  completedToday: false,
});

test('a daily to-do is due every day', () => {
  assert.equal(isSelfCareGoalDueOn(recurring('daily'), '2026-09-05', false), true);
  assert.equal(isSelfCareGoalDueOn(recurring('daily'), '2026-09-06', false), true);
});

test('a weekdays to-do skips Saturday and Sunday', () => {
  const weekdays = recurring('weekdays');
  assert.equal(isSelfCareGoalDueOn(weekdays, '2026-09-04', false), true);
  assert.equal(isSelfCareGoalDueOn(weekdays, '2026-09-05', false), false);
  assert.equal(isSelfCareGoalDueOn(weekdays, '2026-09-06', false), false);
  assert.equal(isSelfCareGoalDueOn(weekdays, '2026-09-07', false), true);
});

test('a once to-do stays until it is finished, then leaves', () => {
  const once = recurring('once');
  assert.equal(isSelfCareGoalDueOn(once, '2026-09-04', false), true);
  assert.equal(isSelfCareGoalDueOn(once, '2026-09-05', true), false);
});

test('an unreadable date shows the to-do rather than losing it', () => {
  assert.equal(isSelfCareGoalDueOn(recurring('weekdays'), 'not-a-date', false), true);
});
