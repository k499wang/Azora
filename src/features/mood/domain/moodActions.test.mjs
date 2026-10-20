import test from 'node:test';
import assert from 'node:assert/strict';
import { moodActions } from './moodActions';
import { MOOD_FEELING_SETS } from './moodFeelings';
import { GOAL_ICON_CHOICES } from '../../selfCare/goalSuggestions';
import { normalizeSelfCareGoalTitle } from '../../selfCare/domain/selfCareGoal';

const DATE = '2026-10-19';
const all = (rating) => ({ overall: rating, energy: rating, sleep: rating });
const ids = (result) => result.actions.map((action) => action.id);

const TENSE = ['fresh-air', 'worry', 'one-thing', 'walk', 'phone-away'];
const GOOD = ['good-note', 'share-good', 'put-off', 'look-forward', 'move'];
const SLEEP = ['bedtime', 'phone-bed', 'caffeine', 'outside', 'short-nap'];

const ANSWER_SETS = [
  all(1),
  all(2),
  all(3),
  all(4),
  all(5),
  { overall: 2, energy: 1, sleep: 2 },
  { overall: 2, energy: 2, sleep: 1 },
  { overall: 3, energy: 2, sleep: 3 },
  { overall: 3, energy: 3, sleep: 2 },
];
const FEELINGS = [
  null,
  'gardening',
  ...Object.values(MOOD_FEELING_SETS).flat().map((feeling) => feeling.id),
];

function everyResult(localDate = DATE) {
  return ANSWER_SETS.flatMap((answers) =>
    FEELINGS.map((feeling) => moodActions(answers, feeling, localDate)),
  );
}

test('every band and feeling gets exactly three different actions', () => {
  for (const date of ['2026-10-19', '2026-10-20', '2026-10-21', '2027-01-01']) {
    for (const result of everyResult(date)) {
      assert.equal(result.actions.length, 3);
      assert.equal(new Set(ids(result)).size, 3, ids(result).join());
    }
  }
});

test('every action can be saved as a to-do and none is a breathing exercise', () => {
  for (const { actions } of everyResult()) {
    for (const action of actions) {
      assert.ok(GOAL_ICON_CHOICES.includes(action.icon), action.icon);
      assert.doesNotMatch(action.title, /breath/i);
      assert.equal(normalizeSelfCareGoalTitle(action.title), action.title);
    }
  }
});

test('anxious on a low day is answered mostly with tense actions', () => {
  const result = moodActions(all(1), 'anxious', DATE);
  assert.equal(result.answering, 'anxious');
  assert.ok(ids(result).filter((id) => TENSE.includes(id)).length >= 2);
});

test('a good day with no word gets only good actions', () => {
  const result = moodActions(all(5), null, DATE);
  assert.equal(result.answering, 'good');
  assert.ok(ids(result).every((id) => GOOD.includes(id)), ids(result).join());
});

test('legacy sleep answers do not drive suggestions when no feeling was chosen', () => {
  const result = moodActions({ overall: 2, energy: 2, sleep: 1 }, null, DATE);
  assert.equal(result.answering, 'low');
  assert.deepEqual(result, moodActions({ overall: 2 }, null, DATE));
});

test('an unmapped word falls back to the answers', () => {
  assert.deepEqual(
    moodActions(all(5), 'calm', DATE),
    moodActions(all(5), null, DATE),
  );
});

test('the set moves with the date and holds still within it', () => {
  const answers = { overall: 2, energy: 1, sleep: 2 };
  const days = ['2026-10-19', '2026-10-20', '2026-10-21'].map((date) =>
    ids(moodActions(answers, 'anxious', date)).join(),
  );
  assert.ok(new Set(days).size > 1);
  assert.deepEqual(
    moodActions(answers, 'anxious', DATE),
    moodActions(answers, 'anxious', DATE),
  );
});
