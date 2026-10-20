import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOOD_FEELING_MAX_LENGTH,
  MOOD_FEELING_SETS,
  moodFeelingLabel,
  moodFeelingSet,
  sanitizeMoodFeeling,
} from './moodFeelings';

const allFeelings = Object.values(MOOD_FEELING_SETS).flat();

test('every set offers six words, and no word is in two sets', () => {
  for (const [set, words] of Object.entries(MOOD_FEELING_SETS)) {
    assert.equal(words.length, 6, set);
  }
  const ids = allFeelings.map((feeling) => feeling.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('ids are stable kebab-case and fit the column', () => {
  for (const { id } of allFeelings) {
    assert.match(id, /^[a-z]+(-[a-z]+)*$/, id);
    assert.ok(id.length <= MOOD_FEELING_MAX_LENGTH, id);
  }
});

test('the set is read off how pleasant the day was and how much energy there was', () => {
  assert.equal(moodFeelingSet({ overall: 2, energy: 3 }), 'tense');
  assert.equal(moodFeelingSet({ overall: 1, energy: 5 }), 'tense');
  assert.equal(moodFeelingSet({ overall: 2, energy: 2 }), 'low');
  assert.equal(moodFeelingSet({ overall: 3, energy: 1 }), 'mixed');
  assert.equal(moodFeelingSet({ overall: 3, energy: 5 }), 'mixed');
  assert.equal(moodFeelingSet({ overall: 4, energy: 3 }), 'bright');
  assert.equal(moodFeelingSet({ overall: 5, energy: 2 }), 'easy');
});

test('sleep plays no part, and nothing is offered before both answers exist', () => {
  assert.equal(
    moodFeelingSet({ overall: 4, energy: 4, sleep: 1 }),
    moodFeelingSet({ overall: 4, energy: 4, sleep: 5 }),
  );
  assert.equal(moodFeelingSet({ overall: 4 }), null);
  assert.equal(moodFeelingSet({ energy: 4 }), null);
  assert.equal(moodFeelingSet({}), null);
});

test('a word this build does not offer reads as no word', () => {
  assert.equal(sanitizeMoodFeeling('on-edge'), 'on-edge');
  assert.equal(sanitizeMoodFeeling('On edge'), null);
  assert.equal(sanitizeMoodFeeling('gardening'), null);
  assert.equal(sanitizeMoodFeeling(42), null);
  assert.equal(sanitizeMoodFeeling(undefined), null);
  assert.equal(moodFeelingLabel('on-edge'), 'On edge');
  assert.equal(moodFeelingLabel(null), null);
});
