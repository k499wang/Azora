import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeSelfCareGoalTitle,
  sortSelfCareGoals,
} from './selfCareGoal.ts';

test('normalizes a goal title and rejects invalid values', () => {
  assert.equal(normalizeSelfCareGoalTitle('  Drink water  '), 'Drink water');
  assert.equal(normalizeSelfCareGoalTitle('   '), null);
  assert.equal(normalizeSelfCareGoalTitle('a'.repeat(121)), null);
});

test('sorts incomplete goals first and newest first within each group', () => {
  const goals = [
    { id: 'old-done', title: 'A', createdAt: '2026-01-01', updatedAt: '2026-01-01', completedToday: true },
    { id: 'new-open', title: 'B', createdAt: '2026-01-04', updatedAt: '2026-01-04', completedToday: false },
    { id: 'old-open', title: 'C', createdAt: '2026-01-02', updatedAt: '2026-01-02', completedToday: false },
    { id: 'new-done', title: 'D', createdAt: '2026-01-03', updatedAt: '2026-01-03', completedToday: true },
  ];

  assert.deepEqual(
    sortSelfCareGoals(goals).map((goal) => goal.id),
    ['new-open', 'old-open', 'new-done', 'old-done'],
  );
});
