import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTINE_TASK_HUES, routineTaskHue } from './routineTaskHue.ts';
import { GOAL_ICON_CHOICES } from '../goalSuggestions.ts';

test('every pickable to-do icon has a deliberate hue', () => {
  const unmapped = GOAL_ICON_CHOICES.filter((icon) => !ROUTINE_TASK_HUES.has(icon));
  assert.deepEqual(unmapped, []);
});

test('an icon outside the picker falls back to sky', () => {
  assert.equal(routineTaskHue('not-an-icon'), 'sky');
});

test('icons are grouped by what the line is about', () => {
  assert.equal(routineTaskHue('sunrise'), 'amber');
  assert.equal(routineTaskHue('moon'), 'violet');
  assert.equal(routineTaskHue('todo-breath'), 'teal');
});
