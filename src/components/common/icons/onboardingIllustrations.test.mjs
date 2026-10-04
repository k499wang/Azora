import assert from 'node:assert/strict';
import test from 'node:test';
import * as routineOptions from '../../onboarding/data/routineOptions.ts';
import { INTENT_ICONS } from '../../onboarding/data/intentOptionIcons.ts';
import { intentFollowUpsFor } from '../../onboarding/data/intentFollowUps.ts';
import { ONBOARDING_ILLUSTRATION_CATALOG } from './onboardingIllustrationCatalog.ts';

function assertIllustrated(name) {
  assert.ok(ONBOARDING_ILLUSTRATION_CATALOG[name], `Missing onboarding illustration: ${name}`);
}

test('all illustrated routine onboarding answers have custom artwork', () => {
  for (const value of Object.values(routineOptions)) {
    if (!Array.isArray(value)) continue;
    for (const option of value) {
      if (option.icon) assertIllustrated(option.icon);
    }
  }
});

test('answers within each routine question have distinct artwork', () => {
  for (const [name, value] of Object.entries(routineOptions)) {
    if (!Array.isArray(value)) continue;
    const pictures = value.filter((option) => option.icon).map((option) => ONBOARDING_ILLUSTRATION_CATALOG[option.icon]);
    assert.equal(new Set(pictures).size, pictures.length, `Repeated answer artwork in ${name}`);
  }
});

test('intent follow-up answers are illustrated and distinct within each question', () => {
  for (const intent of Object.keys(INTENT_ICONS)) {
    for (const question of intentFollowUpsFor(intent)) {
      const pictures = question.options.map(({ icon }) => {
        assertIllustrated(icon);
        return ONBOARDING_ILLUSTRATION_CATALOG[icon];
      });
      assert.equal(new Set(pictures).size, pictures.length, `Repeated answer artwork in ${intent}/${question.id}`);
    }
  }
});

test('every onboarding intent has custom artwork', () => {
  for (const name of Object.values(INTENT_ICONS)) assertIllustrated(name);
  const pictures = Object.values(INTENT_ICONS).map((name) => ONBOARDING_ILLUSTRATION_CATALOG[name]);
  assert.equal(new Set(pictures).size, pictures.length);
});

test('gender and non-brand acquisition answers have custom artwork', () => {
  for (const name of ['gender-female', 'gender-male', 'gender-non-binary', 'help-circle-outline', 'account-group-outline', 'dots-horizontal-circle-outline']) {
    assertIllustrated(name);
  }
});

test('time, referral, and halfway choices have custom artwork', () => {
  for (const name of ['walk', 'run', 'streak', 'rocket-launch', 'stethoscope', 'close-circle-outline', 'body-outline', 'refresh-circle-outline']) {
    assertIllustrated(name);
  }
});
