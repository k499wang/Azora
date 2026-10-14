import assert from 'node:assert/strict';
import test from 'node:test';
import { INTENT_OPTIONS } from '../components/onboarding/data/intentOptions.ts';
import { habitPicksFor } from './onboardingHabitPicks.ts';
import { buildStarterPlan } from './onboardingStarterPlan.ts';

const answers = (intent) => ({
  intent,
  wakeEase: null,
  sleepDuration: null,
  routineHappiness: null,
  mentalHealth: [],
  procrastinationAreas: [],
  procrastinationReasons: [],
});

test('every pickable goal gets its own habits to add, none repeated from the deck', () => {
  const menus = new Set();
  for (const { id } of INTENT_OPTIONS) {
    const deck = buildStarterPlan(answers(id));
    const picks = habitPicksFor(id, deck);
    assert.ok(picks.length >= 5, id);
    assert.equal(new Set(picks.map((pick) => pick.id)).size, picks.length, id);
    for (const pick of picks) {
      assert.equal(deck.some((item) => item.id === pick.id || item.title === pick.title), false, `${id}: ${pick.title}`);
    }
    menus.add(picks.map((pick) => pick.id).join());
  }
  assert.equal(menus.size, INTENT_OPTIONS.length);
});

test('a goal without its own list falls back to general habits', () => {
  assert.ok(habitPicksFor(null, []).length > 0);
  assert.deepEqual(habitPicksFor('yoga', []), habitPicksFor('other', []));
});
