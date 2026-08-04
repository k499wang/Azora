import assert from 'node:assert/strict';
import test from 'node:test';
import {
  matchesDailyExerciseSearch,
  matchesExerciseSearch,
  normalizeExerciseSearch,
} from './exerciseSearch.ts';

test('normalizes exercise searches with trimming and locale lowercase', () => {
  assert.equal(normalizeExerciseSearch('  SLEEP & Calm  '), 'sleep & calm');
});

test('matches technique, category, and group text by substring', () => {
  assert.equal(matchesExerciseSearch('box', ['Box Breathing', 'Balance']), true);
  assert.equal(matchesExerciseSearch('energy', ['Bellows Breath', 'Energy']), true);
  assert.equal(matchesExerciseSearch('sleep', ['Sleep & Calm']), true);
  assert.equal(matchesExerciseSearch('missing', ['Box Breathing', 'Balance']), false);
});

test('daily breath hold aliases include generic breath and branded copy', () => {
  for (const query of [
    '',
    'breath',
    'daily breath hold',
    'breathhold',
    'Azora’s',
    "Azora's breathhold exercise",
    'check-in',
    'original',
  ]) {
    assert.equal(matchesDailyExerciseSearch(query), true, query);
  }

  assert.equal(matchesDailyExerciseSearch('sleep'), false);
});
