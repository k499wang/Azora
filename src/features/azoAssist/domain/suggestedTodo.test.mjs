import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSuggestedTodos, suggestedTodoDraft, suggestedTodoMeta } from './suggestedTodo.ts';

test('suggestions outside the icon picker fall back to the sparkle', () => {
  const [todo] = parseSuggestedTodos([{ title: 'Clear the desk', icon: 'flame-logo', daypart: 'evening', minutes: 10 }]);
  assert.equal(todo.icon, 'sparkle');
  assert.equal(todo.daypart, 'evening');
});

test('malformed suggestions are dropped, odd lengths are cleared', () => {
  assert.deepEqual(parseSuggestedTodos('nope'), []);
  const todos = parseSuggestedTodos([{ title: '  ' }, { title: 'Walk', daypart: 'noon', minutes: 999 }]);
  assert.deepEqual(todos, [{ title: 'Walk', icon: 'sparkle', daypart: 'afternoon', minutes: null }]);
});

test('a kept suggestion is a one-off to-do at its daypart hour', () => {
  assert.deepEqual(
    suggestedTodoDraft({ title: 'Walk', icon: 'walk', daypart: 'start', minutes: 15 }),
    { title: 'Walk', icon: 'walk', recurrence: 'once', scheduledTime: '07:00', durationMinutes: 15 },
  );
});

test('meta reads the daypart and the length when there is one', () => {
  assert.equal(suggestedTodoMeta({ title: 'Walk', icon: 'walk', daypart: 'bedtime', minutes: 5 }), 'Bedtime · 5 min');
  assert.equal(suggestedTodoMeta({ title: 'Walk', icon: 'walk', daypart: 'start', minutes: null }), 'Start the day');
});
