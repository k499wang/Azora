import assert from 'node:assert/strict';
import test from 'node:test';
import { INTENT_OPTIONS } from '../components/onboarding/data/intentOptions.ts';
import { habitPicksFor } from './onboardingHabitPicks.ts';
import { recommendedStarterHabit } from './onboardingStarterPlan.ts';

const answers = (intent) => ({
  intent,
  wakeEase: null,
  sleepDuration: null,
  routineHappiness: null,
  mentalHealth: [],
  procrastinationAreas: [],
  procrastinationReasons: [],
});

test('every pickable goal leads with its recommended habit, then its own habits to add', () => {
  const menus = new Set();
  for (const { id } of INTENT_OPTIONS) {
    const recommended = recommendedStarterHabit(answers(id));
    const picks = habitPicksFor(id, recommended);
    assert.ok(recommended != null, id);
    assert.equal(picks[0], recommended, id);
    assert.ok(picks.length >= 6, id);
    assert.equal(new Set(picks.map((pick) => pick.id)).size, picks.length, id);
    assert.equal(new Set(picks.map((pick) => pick.title)).size, picks.length, id);
    menus.add(picks.map((pick) => pick.id).join());
  }
  assert.equal(menus.size, INTENT_OPTIONS.length);
});

test('a goal without its own list falls back to general habits', () => {
  assert.ok(habitPicksFor(null, null).length > 0);
  assert.deepEqual(habitPicksFor('yoga', null), habitPicksFor('other', null));
});
