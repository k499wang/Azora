import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveBreathingExerciseDescription } from './breathingExerciseDescription.ts';

const technique = { description: 'Breathe in for four counts, then breathe out for six.' };
const intents = [
  'stress_relief', 'calm_fast', 'sleep', 'focus', 'energy', 'self_acceptance',
  'emotional_balance', 'self_care', 'spiritual', 'yoga', 'heart_health',
  'cleaning', 'daily_habit',
];

test('each specific goal adds context while preserving the technique instructions', () => {
  const descriptions = intents.map((intent) => {
    const description = resolveBreathingExerciseDescription(technique, intent);
    assert.ok(description.endsWith(`\n\n${technique.description}`), intent);
    assert.ok(description.length > technique.description.length, intent);
    return description;
  });
  assert.equal(new Set(descriptions).size, intents.length);
});

test('focus and self-acceptance use the language of the selected goal', () => {
  assert.match(resolveBreathingExerciseDescription(technique, 'focus'), /focused task/);
  assert.match(resolveBreathingExerciseDescription(technique, 'self_acceptance'), /without needing to change it/);
});

test('missing, general, or unrecognized goals preserve the original description', () => {
  for (const intent of [null, undefined, 'other', 'unknown']) {
    assert.equal(resolveBreathingExerciseDescription(technique, intent), technique.description);
  }
});
