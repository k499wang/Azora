import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSuggestedTodos, suggestedTodoMeta } from './suggestedTodo.ts';

test('suggestions outside the icon picker fall back to the sparkle', () => {
  const [todo] = parseSuggestedTodos([{ title: 'Clear the desk', icon: 'flame-logo', daypart: 'evening', minutes: 10 }]);
  assert.equal(todo.icon, 'sparkle');
  assert.equal(suggestedTodoMeta(todo), 'Evening · 10 min');
});

test('malformed suggestions are dropped, odd lengths are cleared', () => {
  assert.deepEqual(parseSuggestedTodos('nope'), []);
  const todos = parseSuggestedTodos([{ title: '  ' }, { title: 'Walk', daypart: 'noon', minutes: 999 }]);
  assert.equal(todos.length, 1);
  assert.equal(todos[0].durationMinutes, null);
  assert.equal(suggestedTodoMeta(todos[0]), 'Afternoon');
});

test('a suggestion is a one-off to-do at its daypart hour', () => {
  assert.deepEqual(
    parseSuggestedTodos([{ title: 'Walk', icon: 'walk', daypart: 'start', minutes: 15 }]),
    [{ title: 'Walk', icon: 'walk', recurrence: 'once', scheduledTime: '07:00', durationMinutes: 15 }],
  );
});

test('meta reads the daypart and the length when there is one', () => {
  const [bedtime] = parseSuggestedTodos([{ title: 'Walk', icon: 'walk', daypart: 'bedtime', minutes: 5 }]);
  assert.equal(suggestedTodoMeta(bedtime), 'Bedtime · 5 min');
  assert.equal(
    suggestedTodoMeta({ title: 'Walk', icon: 'walk', recurrence: 'once', scheduledTime: '07:00', durationMinutes: null }),
    'Start the day',
  );
});

test('a suggestion keeps a later day of the coming week, and only that', () => {
  const [planned, tooFar, today] = parseSuggestedTodos([
    { title: 'Clean bathroom', daypart: 'start', minutes: 20, day: '2026-11-01' },
    { title: 'Defrost freezer', daypart: 'start', day: '2026-11-20' },
    { title: 'Call mom', daypart: 'evening', day: '2026-10-29' },
  ], '2026-10-29');
  assert.equal(planned.startsOn, '2026-11-01');
  assert.equal(suggestedTodoMeta(planned, '2026-10-29'), 'Sun, Nov 1 · Start the day · 20 min');
  assert.equal(tooFar.startsOn, undefined);
  assert.equal(today.startsOn, undefined);
  assert.equal(parseSuggestedTodos([{ title: 'X', day: '2026-11-01' }])[0].startsOn, undefined);
});
