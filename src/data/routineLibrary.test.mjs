import assert from 'node:assert/strict';
import test from 'node:test';
import { ROUTINE_TEMPLATES, routineRunPlan, routineTemplateDrafts } from './routineLibrary.ts';

test('routine ids are unique, and task ids are unique within a routine', () => {
  assert.equal(new Set(ROUTINE_TEMPLATES.map((entry) => entry.id)).size, ROUTINE_TEMPLATES.length);
  for (const entry of ROUTINE_TEMPLATES) {
    assert.equal(new Set(entry.tasks.map((task) => task.id)).size, entry.tasks.length, entry.id);
  }
});

test('every new routine stays together in one part of the day', () => {
  const painted = new Set(['morning-reset', 'focus-reset', 'evening-wind-down', 'bedtime-routine', 'weekly-home-reset', 'small-clean']);
  for (const entry of ROUTINE_TEMPLATES.filter(({ id }) => !painted.has(id))) {
    assert.equal(new Set(entry.tasks.map((task) => task.scheduledTime)).size, 1, entry.id);
    assert.equal(new Set(entry.tasks.map((task) => task.recurrence)).size, 1, entry.id);
  }
});

test('the whole-home hour takes one hour', () => {
  const hour = ROUTINE_TEMPLATES.find((entry) => entry.id === 'whole-home-hour');
  assert.equal(hour.tasks.reduce((total, task) => total + task.durationMinutes, 0), 60);
  assert.equal(routineTemplateDrafts(hour.tasks).length, 7);
});

test('a routine run plan keeps only the chosen steps, in routine order, with their icons', () => {
  const close = ROUTINE_TEMPLATES.find((entry) => entry.id === 'kitchen-close');
  const plan = routineRunPlan(close, ['trash', 'do-dishes']);
  assert.deepEqual(plan.objects.map((item) => item.name), ['Wash or load the dishes', 'Take out the trash if it is full']);
  assert.equal(plan.objects[0].minutes, 10);
  assert.equal(plan.objects[0].icon, 'todo-dishes');
  assert.equal(plan.title, 'Kitchen close');
});
