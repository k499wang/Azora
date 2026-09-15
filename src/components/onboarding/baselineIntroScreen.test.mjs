import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const intro = readFileSync(
  new URL('./screens/BaselineIntroScreen.tsx', import.meta.url),
  'utf8',
);
const imageCache = readFileSync(
  new URL('../../services/images/onboardingImageCache.ts', import.meta.url),
  'utf8',
);

test('heart-reading intro uses the trusted mascot and baseline copy', () => {
  assert.match(intro, /getOnboardingImageSource\('heartHealthMascot'\)/);
  assert.match(intro, /Let’s get to know your heart\./);
  assert.match(
    intro,
    /A quick camera reading estimates your current heart rate and gives\s+you a personal baseline to follow over time\./,
  );
  assert.match(intro, /label="Read my heart"/);
  assert.doesNotMatch(intro, /heart age|case off|warm your hands/i);

  const imageIndex = intro.indexOf("source={getOnboardingImageSource('heartHealthMascot')}");
  const titleIndex = intro.indexOf('Let’s get to know your heart.');
  const subtitleIndex = intro.indexOf('A quick camera reading estimates');
  assert.ok(imageIndex < titleIndex, 'mascot should render before the title');
  assert.ok(titleIndex < subtitleIndex, 'title should render before the subtitle');
});

test('heart-health mascot is loaded through the onboarding image cache', () => {
  assert.match(
    imageCache,
    /heartHealthMascot: require\('\.\.\/\.\.\/\.\.\/assets\/app\/heart_health_mascot_VERIFIED_TRANSPARENT\.png'\)/,
  );
  assert.match(imageCache, /heartHealthMascot: \{ maxWidth: 900 \}/);
});
