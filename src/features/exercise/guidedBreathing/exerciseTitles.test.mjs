/**
 * The names the app calls its exercises when it speaks to the user.
 *
 * They are read on Home, on the plan screen and in onboarding's handover, and
 * they live in a lookup table nobody reads as copy — which is exactly how two
 * of them once came to contain the one word this app does not say about
 * itself. See `feedback_banned_words_breathwork`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { exerciseTitleForTechniqueId } from './exerciseTitles.ts';

// Every technique the catalogue can hand a row. Listed here rather than
// imported: `techniques.ts` loads image assets through Metro's `require`,
// which no Node test can execute.
const TECHNIQUE_IDS = [
  'box', '478', 'wimhof', 'resonance', 'relaxing', 'belly', 'extended-exhale',
  'sitali', 'triangle', 'deep-box', 'bhastrika', 'morning-charge',
  'night-settle', 'sleep-descent', 'coherent-6',
];

test('every technique has a name the app can show', () => {
  for (const id of TECHNIQUE_IDS) {
    const title = exerciseTitleForTechniqueId(id);
    assert.equal(typeof title, 'string', id);
    assert.ok(title.length > 0, id);
  }
});

test('no name uses a word the app has banned', () => {
  for (const id of TECHNIQUE_IDS) {
    const title = exerciseTitleForTechniqueId(id).toLowerCase();
    assert.equal(title.includes('exercise'), false, id);
    assert.equal(title.includes('breathwork'), false, id);
  }
});

test('no two techniques share a name', () => {
  // A row named the same as another row is a row the user cannot tell apart
  // from it, on a plan screen that lists several of them in a week.
  const titles = TECHNIQUE_IDS.map(exerciseTitleForTechniqueId);
  assert.equal(new Set(titles).size, titles.length);
});
