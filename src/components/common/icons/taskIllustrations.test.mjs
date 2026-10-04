import assert from 'node:assert/strict';
import test from 'node:test';
import { GOAL_ICON_CHOICES, GOAL_SUGGESTION_CATEGORIES } from '../../../features/selfCare/goalSuggestions.ts';
import { HABIT_ILLUSTRATIONS } from './habitIllustrations.ts';
import { TODO_ILLUSTRATIONS } from './todoIllustrations.ts';

const illustrations = { ...HABIT_ILLUSTRATIONS, ...TODO_ILLUSTRATIONS };

test('every selectable habit icon has its own illustration', () => {
  const bodies = GOAL_ICON_CHOICES.map((name) => {
    assert.ok(illustrations[name], `Missing habit illustration: ${name}`);
    return illustrations[name];
  });
  assert.equal(new Set(bodies).size, GOAL_ICON_CHOICES.length);
});

test('every todo preset has distinct artwork', () => {
  const names = GOAL_SUGGESTION_CATEGORIES.flatMap(({ suggestions }) => suggestions.map(({ icon }) => icon));
  for (const name of names) assert.ok(TODO_ILLUSTRATIONS[name], `Missing preset illustration: ${name}`);
  assert.equal(new Set(names.map((name) => TODO_ILLUSTRATIONS[name])).size, names.length);
});
