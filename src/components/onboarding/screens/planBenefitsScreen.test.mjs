import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { onboardingPlanBenefits } from '../../../lib/onboardingPlanBenefits.ts';
import { onboardingPresetFor } from '../../../lib/onboardingPreset.ts';
import {
  INTENT_OPTIONS,
  chosenGoalPhrase,
  intentGoalPhrase,
} from '../data/intentOptions.ts';

const source = readFileSync(new URL('./PlanBenefitsScreen.tsx', import.meta.url), 'utf8');

/**
 * The screen's own sentences, run as written: the goal phrase it capitalises,
 * the headline it builds from it, and the highlights cut out of that headline.
 */
const copy = source.match(/const goalSentence =[\s\S]*?const highlights =[^;]*;\n/)[0];

function render(phase, benefits) {
  return new Function(
    'phase',
    'benefits',
    `${copy}\nreturn { headline, highlights };`,
  )(phase, benefits);
}

/** Every goal that has a phrase of its own, with the plan that goal resolves to. */
const goals = INTENT_OPTIONS.map(({ id }) => id).filter((id) => intentGoalPhrase(id) != null);

test('the plan sentence opens with the goal, capitalised, for every goal', () => {
  assert.ok(goals.length > 0);
  for (const id of goals) {
    const goalPhrase = chosenGoalPhrase(id, [id]);
    // Authored to read mid-sentence, so the capital has to come from the screen.
    assert.match(goalPhrase, /^[a-z]/, id);
    const benefits = onboardingPlanBenefits(onboardingPresetFor(id), id, goalPhrase);
    const { headline, highlights } = render('personalization', benefits);

    assert.match(headline, /^We built a plan around you\. [A-Z]/, `${id}: ${headline}`);
    assert.ok(
      headline.includes(`${goalPhrase[0].toUpperCase()}${goalPhrase.slice(1)}`),
      `${id}: ${headline}`,
    );
    assert.ok(highlights.every((phrase) => headline.includes(phrase)), `${id}: highlights`);
  }
});

test('the outcome sentence keeps its benefit mid-sentence and out of the capital', () => {
  for (const id of goals) {
    const benefits = onboardingPlanBenefits(
      onboardingPresetFor(id),
      id,
      chosenGoalPhrase(id, [id]),
    );
    const { headline, highlights } = render('outcome', benefits);

    assert.match(headline, /^In \d+ days, you’ll feel /, id);
    assert.ok(headline.includes(benefits.outcome), `${id}: ${headline}`);
    assert.equal(headline.endsWith(`${benefits.outcome}.`), true, id);
    assert.ok(highlights.every((phrase) => headline.includes(phrase)), `${id}: highlights`);
  }
  // A goal the user typed with its own capital is left alone rather than lowercased.
  const { headline } = render('personalization', {
    days: 28,
    goal: 'Declutter my closet',
    outcome: 'more in control of your day',
  });
  assert.equal(headline, 'We built a plan around you. Declutter my closet.');
});
