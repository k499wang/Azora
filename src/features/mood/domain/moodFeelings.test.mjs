import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOOD_FEELING_MAX_LENGTH,
  MOOD_FEELING_SETS,
  moodFeelingLabel,
  moodFeelingSet,
  moodFeelingChoices,
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

test('mood alone supplies a starting group, without energy or sleep', () => {
  assert.equal(moodFeelingSet({ overall: 1 }), 'low');
  assert.equal(moodFeelingSet({ overall: 3 }), 'mixed');
  assert.equal(moodFeelingSet({ overall: 5 }), 'bright');
  assert.equal(moodFeelingSet({}), null);
  assert.equal(moodFeelingSet({ overall: 4, energy: 1, sleep: 1 }), 'bright');
});

test('suggestions cover both tense and low feelings, and calm and bright feelings', () => {
  const low = moodFeelingChoices({ overall: 2 }).map(({ id }) => id);
  assert.ok(low.includes('sad'));
  assert.ok(low.includes('anxious'));
  const good = moodFeelingChoices({ overall: 4 }).map(({ id }) => id);
  assert.ok(good.includes('happy'));
  assert.ok(good.includes('calm'));
  assert.deepEqual(moodFeelingChoices({}), []);
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
