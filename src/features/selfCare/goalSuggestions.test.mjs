import assert from 'node:assert/strict';
import test from 'node:test';
import { GOAL_SUGGESTION_CATEGORIES } from './goalSuggestions.ts';

test('routine suggestions repeat daily and include an appropriate daypart', () => {
  const suggestions = GOAL_SUGGESTION_CATEGORIES.flatMap(
    (category) => category.suggestions,
  );

  for (const suggestion of suggestions) {
    assert.match(suggestion.scheduledTime, /^(07|13|15|18|21):00$/);
    assert.equal(suggestion.recurrence, 'daily');
  }
});

test('routine suggestions use one unique todo icon per preset', () => {
  const icons = GOAL_SUGGESTION_CATEGORIES.flatMap(({ suggestions }) =>
    suggestions.map(({ icon }) => icon),
  );

  assert.equal(icons.length, 35);
  assert.equal(new Set(icons).size, icons.length);
  assert.ok(icons.every((icon) => icon.startsWith('todo-')));
});

test('routine browser separates support needs from cleaning areas', () => {
  assert.deepEqual(
    GOAL_SUGGESTION_CATEGORIES.map(({ id, label }) => ({ id, label })),
    [
      { id: 'adhd', label: 'ADHD' },
      { id: 'kitchen', label: 'Kitchen reset' },
      { id: 'bathroom', label: 'Bathroom reset' },
      { id: 'bedroom-laundry', label: 'Bedroom & laundry' },
      { id: 'living-entry', label: 'Living space & entry' },
      { id: 'anxiety', label: 'Anxiety' },
      { id: 'depression', label: 'Depression' },
    ],
  );
});

test('each cleaning area offers a focused set of chores', () => {
  const cleaningAreas = GOAL_SUGGESTION_CATEGORIES.filter(({ id }) => [
    'kitchen',
    'bathroom',
    'bedroom-laundry',
    'living-entry',
  ].includes(id));

  assert.equal(cleaningAreas.length, 4);
  assert.ok(cleaningAreas.every(({ suggestions }) => suggestions.length === 5));
});
