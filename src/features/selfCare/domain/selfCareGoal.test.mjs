import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completedGoalsSummary,
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

test('completedGoalsSummary counts one goal in the singular', () => {
  assert.equal(completedGoalsSummary(1), '1 goal completed today!');
  assert.equal(completedGoalsSummary(4), '4 goals completed today!');
});
