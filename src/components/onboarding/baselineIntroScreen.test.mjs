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
  assert.match(intro, /image="heartHealthMascot"/);
  assert.match(intro, /title="Let’s get to know your heart\."/);
  assert.match(
    intro,
    /subtitle="A quick camera reading estimates your current heart rate and gives you a personal baseline to follow over time\."/,
  );
  assert.match(intro, /label="Read my heart"/);
  assert.doesNotMatch(intro, /heart age|case off|warm your hands/i);

  // The stage itself — illustration, then title, then subtitle — belongs to
  // OnboardingVisualIntro, which every screen of this shape shares.
  assert.match(intro, /<OnboardingVisualIntro/);
  const imageIndex = intro.indexOf('image="heartHealthMascot"');
  const titleIndex = intro.indexOf('title="Let’s get to know your heart."');
  const subtitleIndex = intro.indexOf('subtitle="A quick camera reading estimates');
  assert.ok(imageIndex < titleIndex, 'mascot should render before the title');
  assert.ok(titleIndex < subtitleIndex, 'title should render before the subtitle');
});

test('every visual intro screen shares one stage', () => {
  const screens = [
    'BaselineIntroScreen',
    'SleepInsightScreen',
  ];

  for (const name of screens) {
    const source = readFileSync(
      new URL(`./screens/${name}.tsx`, import.meta.url),
      'utf8',
    );
    assert.match(source, /<OnboardingVisualIntro/, `${name} uses the shared stage`);
    // No screen may size its own illustration or restate the type scale.
    assert.doesNotMatch(source, /scaleVisual\(/, `${name} sizes its own visual`);
    assert.doesNotMatch(source, /fontSize:/, `${name} restates the type scale`);
  }
});

test('heart-health mascot is loaded through the onboarding image cache', () => {
  assert.match(
    imageCache,
    /heartHealthMascot: require\('\.\.\/\.\.\/\.\.\/assets\/app\/heart_health_mascot_VERIFIED_TRANSPARENT\.png'\)/,
  );
  assert.match(imageCache, /heartHealthMascot: \{ maxWidth: 900 \}/);
});
