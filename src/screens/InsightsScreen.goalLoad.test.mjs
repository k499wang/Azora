import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./InsightsScreen.tsx', import.meta.url), 'utf8');
const expression = source.match(/const savedGoalUnavailable = ([\s\S]*?);/)[1];
const unavailable = new Function('needsSavedGoal', 'savedProfile', `return ${expression};`);

test('starting a plan waits for a failed goal read rather than silently selecting stress', () => {
  assert.equal(unavailable(true, { isError: true, data: undefined }), true);
  assert.equal(unavailable(true, { isError: false, data: undefined }), false);
  assert.equal(unavailable(true, { isError: false, data: null }), false);
  assert.equal(unavailable(true, { isError: true, data: { onboardingGoal: 'I keep overthinking everything' } }), false);
  assert.equal(unavailable(false, { isError: true, data: undefined }), false);
  assert.match(source, /\{savedGoalUnavailable && !previewFinishedPlan \? \([\s\S]*?savedProfile\.refetch\(\)[\s\S]*?\) : previewFinishedPlan \|\| \(showFinished/);
});
