import assert from 'node:assert/strict';
import test from 'node:test';
import { ROUTINE_TEMPLATES, routineTemplateDrafts } from './routineLibrary.ts';

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
