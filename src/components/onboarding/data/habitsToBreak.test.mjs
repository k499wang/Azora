import assert from 'node:assert/strict';
import test from 'node:test';
import { habitsToBreakFor } from './habitsToBreak.ts';
import { OPTION_ICON_PATHS } from '../../common/icons/optionIconPaths.ts';
import { ONBOARDING_ILLUSTRATION_CATALOG } from '../../common/icons/onboardingIllustrationCatalog.ts';

/** Both catalogs `OnboardingOptionIcon` draws from, which it checks in this order. */
function isDrawnIcon(name) {
  return Object.hasOwn(ONBOARDING_ILLUSTRATION_CATALOG, name)
    || Object.hasOwn(OPTION_ICON_PATHS, name);
}
import { INTENT_OPTIONS } from './intentOptions.ts';

const ACTIVE = INTENT_OPTIONS.map((option) => option.id);

/** Goals a new user can no longer pick, but a saved profile can still carry. */
const RETIRED = ['self_acceptance', 'self_care', 'spiritual', 'yoga', 'heart_health'];

test('every pickable goal gets its own five habits to break', () => {
  assert.equal(ACTIVE.length, 7);
  for (const intent of ACTIVE) {
    const rows = habitsToBreakFor(intent);
    assert.equal(rows.length, 5, intent);
    assert.equal(new Set(rows.map(({ id }) => id)).size, rows.length, `${intent}: ids repeat`);
    assert.equal(new Set(rows.map(({ title }) => title)).size, rows.length, `${intent}: titles repeat`);
    for (const { title, icon } of rows) {
      assert.ok(title.length > 0, intent);
      // The drawn set the question lists use, so no row falls back to a Material glyph.
      assert.ok(isDrawnIcon(icon), `${intent}: “${icon}” is not an app icon`);
    }
  }
});

test('the goal decides the habits, so no two goals read the same', () => {
  const sets = new Map();
  for (const intent of ACTIVE) {
    const key = habitsToBreakFor(intent).map(({ title }) => title).join(' | ');
    assert.equal(sets.has(key), false, `${intent} duplicates ${sets.get(key)}`);
    sets.set(key, intent);
  }
});

test('the cleaning set is the five the question was drawn with', () => {
  assert.deepEqual(
    habitsToBreakFor('cleaning').map(({ title }) => title),
    [
      'Piling up dishes',
      'Leaving laundry around',
      'Letting clutter grow',
      'Skipping cleaning',
      'All-or-nothing cleaning',
    ],
  );
});

test('a goal without its own set gets the neutral one, which names no goal', () => {
  const neutral = habitsToBreakFor('other').map(({ title }) => title);
  for (const intent of [...RETIRED, 'other']) {
    assert.deepEqual(habitsToBreakFor(intent).map(({ title }) => title), neutral, intent);
  }
  for (const intent of ACTIVE) {
    assert.notDeepEqual(habitsToBreakFor(intent).map(({ title }) => title), neutral, intent);
  }
  // Nothing goal-shaped leaks into the fallback.
  assert.doesNotMatch(neutral.join(' '), /dish|laundry|sleep|scroll|focus|caffeine|dishes/i);
});
