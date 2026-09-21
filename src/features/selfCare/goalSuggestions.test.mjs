import assert from 'node:assert/strict';
import test from 'node:test';
import { GOAL_SUGGESTION_CATEGORIES } from './goalSuggestions.ts';

test('routine suggestions include an appropriate repeat and daypart', () => {
  const suggestions = GOAL_SUGGESTION_CATEGORIES.flatMap(
    (category) => category.suggestions,
  );

  for (const suggestion of suggestions) {
    assert.match(suggestion.scheduledTime, /^(07|13|15|18|21):00$/);
    assert.ok(['daily', 'weekdays', 'once'].includes(suggestion.recurrence));
  }

  assert.ok(suggestions.some(({ recurrence }) => recurrence === 'weekdays'));
  assert.ok(suggestions.every(({ recurrence }) => recurrence !== 'once'));
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
