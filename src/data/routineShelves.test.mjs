import assert from 'node:assert/strict';
import test from 'node:test';
import { GOAL_SUGGESTION_CATEGORIES } from '../features/selfCare/goalSuggestions.ts';
import { ROUTINE_TEMPLATES } from './routineLibrary.ts';
import { ROUTINE_SHELVES, isRoutineAdded, routineShelfTemplates } from './routineShelves.ts';

test('every routine sits on exactly one shelf', () => {
  const shelved = ROUTINE_SHELVES.flatMap((shelf) => routineShelfTemplates(shelf).map((entry) => entry.id));
  assert.deepEqual([...shelved].sort(), ROUTINE_TEMPLATES.map((entry) => entry.id).sort());
});

test('every need and room category sits on exactly one shelf', () => {
  const shelved = ROUTINE_SHELVES.flatMap((shelf) => shelf.categoryIds);
  assert.deepEqual([...shelved].sort(), GOAL_SUGGESTION_CATEGORIES.map((category) => category.id).sort());
});

const routine = {
  tasks: [
    { title: 'Shine the sink', recurrence: 'daily' },
    { title: 'Wipe the counters', recurrence: 'daily' },
  ],
};

test('a routine is added only when all of its tasks are on the list', () => {
  assert.equal(isRoutineAdded(routine, [{ title: 'shine the sink ', recurrence: 'daily' }]), false);
  assert.equal(isRoutineAdded(routine, [
    { title: 'Shine the sink', recurrence: 'daily' },
    { title: 'Wipe the counters', recurrence: 'daily' },
    { title: 'Something else', recurrence: 'once' },
  ]), true);
});

test('the same title on another repeat is a different to-do', () => {
  assert.equal(isRoutineAdded(routine, [
    { title: 'Shine the sink', recurrence: 'weekly' },
    { title: 'Wipe the counters', recurrence: 'daily' },
  ]), false);
});
