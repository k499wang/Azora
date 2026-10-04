import assert from 'node:assert/strict';
import test from 'node:test';
import * as routineOptions from '../../onboarding/data/routineOptions.ts';
import { INTENT_ICONS } from '../../onboarding/data/intentOptionIcons.ts';
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

test('every onboarding intent has custom artwork', () => {
  for (const name of Object.values(INTENT_ICONS)) assertIllustrated(name);
});

test('gender and non-brand acquisition answers have custom artwork', () => {
  for (const name of ['gender-female', 'gender-male', 'gender-non-binary', 'help-circle-outline', 'account-group-outline', 'dots-horizontal-circle-outline']) {
    assertIllustrated(name);
  }
});
