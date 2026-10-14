import assert from 'node:assert/strict';
import test from 'node:test';
import { ARCHETYPE_FOR_PLAN } from './onboardingArchetype.ts';

/**
 * Words the profile screen is allowed to name in what the user recognises about
 * themselves today. The plan report names who they become, so none of these can
 * appear in it — a nickname that repeats the problem is not a promise.
 */
const SELF_DESCRIPTION = /frenzy|detox|empty|spinner|overthink|clutter|doom|second-guess|slow|pressure|juggler|dodger|guesser|cooker|stuck|struggl/i;

const archetypes = Object.entries(ARCHETYPE_FOR_PLAN);

test('every plan hands the user a positive nickname of who they become', () => {
  assert.equal(archetypes.length, 9);
  for (const [planId, archetype] of archetypes) {
    const { futureName, name, tagline, planName, planPromise } = archetype;

    // The same "The …" shape the personality nickname uses, so the two phases
    // read as two moments of one story.
    assert.match(futureName, /^The [A-Z]/, `${planId}: ${futureName}`);
    assert.doesNotMatch(futureName, SELF_DESCRIPTION, planId);
    assert.doesNotMatch(futureName, /\b(not|never|no)\b/i, `${planId}: ${futureName}`);

    // It must be a nickname of the person, not the plan wearing the same shape.
    assert.notEqual(futureName, name, `${planId}: the report must not repeat the profile's name`);
    assert.notEqual(futureName, planName, planId);
    assert.ok(!futureName.includes(planName), `${planId}: ${futureName} names the plan`);
    assert.ok(!planName.includes(futureName), planId);

    // The line under it is the existing promise the plan is sold on; this change
    // is about the nickname, so only its presence is checked here.
    assert.ok(planPromise.length > 0, planId);
    assert.ok(!tagline.includes(futureName), planId);
  }
});

test('the nine nicknames are distinct, so no two plans land the user in the same place', () => {
  const names = archetypes.map(([, archetype]) => archetype.futureName);
  assert.equal(new Set(names).size, names.length, names.join(' | '));
});
