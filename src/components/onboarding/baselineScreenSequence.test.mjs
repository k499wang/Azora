import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const screen = readFileSync(
  new URL('./screens/BaselineScreen.tsx', import.meta.url),
  'utf8',
);
const carousel = readFileSync(
  new URL('./baseline/HeartRatePlacementCarousel.tsx', import.meta.url),
  'utf8',
);
const imageCache = readFileSync(
  new URL('../../services/images/onboardingImageCache.ts', import.meta.url),
  'utf8',
);

test('a completed capture analyzes before revealing the BPM result', () => {
  assert.match(screen, /type Phase = [^;]*'analyzing'[^;]*'result'/);
  assert.match(
    screen,
    /onResultCaptured\(completedResult\);[\s\S]*?setResult\(completedResult\);[\s\S]*?setPhase\('analyzing'\)/,
  );
  assert.match(screen, /label="Heart reading"/);
  assert.match(screen, /onDone=\{\(\) => setPhase\('result'\)\}/);
});

test('the reading analyzes on the same pacing rule and carries a fact', () => {
  // Same machinery as the question-block screens: more material, longer bar.
  assert.match(screen, /import \{ analyzeDurationMs, countAnswered \}/);
  assert.match(
    screen,
    /durationMs=\{analyzeDurationMs\([\s\S]*?countAnswered\(\[result\?\.avgBpm, result\?\.earlyBpm, result\?\.lateBpm\]\)/,
  );
  assert.match(screen, /fact=\{\{[\s\S]*?headline:[\s\S]*?body:[\s\S]*?emoji:/);
  assert.doesNotMatch(screen, /POST_READING_ANALYSIS_MS/);
});

test('the BPM page lands whole, with a way back and no reveal animation', () => {
  const result = readFileSync(
    new URL('./baseline/BaselineHeartRateResult.tsx', import.meta.url),
    'utf8',
  );

  assert.match(result, /onBack: \(\) => void/);
  assert.match(result, /onBack=\{onBack\}/);
  assert.match(screen, /<BaselineHeartRateResult[\s\S]*?onBack=\{onBack\}/);

  // No sweep up the dial, no counting number, no fade in behind it.
  assert.doesNotMatch(
    result,
    /withTiming|useSharedValue|useAnimatedReaction|useDerivedValue|Animated|isCalibrating/,
  );
  assert.doesNotMatch(result, /gaugeCalibration|calibrationDurationMs/);
  assert.match(result, /gaugeArcPath\(restingHeartRateGaugeFill\(avgBpm\)\)/);
  assert.match(result, /<Text style=\{styles\.gaugeValue\}>\{avgBpm\}<\/Text>/);
});

test('the BPM page reads the number against the person and the flow feeds it', () => {
  const result = readFileSync(
    new URL('./baseline/BaselineHeartRateResult.tsx', import.meta.url),
    'utf8',
  );

  // The band decides the dial colour, so the verdict is visible, not just read.
  assert.match(result, /const bandColor = BAND_COLOR\[context\.band\]/);
  assert.match(result, /color=\{bandColor\}/);
  // The screen owns forwarding; the flow owns the answers.
  assert.match(screen, /age: number;/);
  assert.match(screen, /gender: GenderOption\['id'\] \| null;/);
  assert.match(
    screen,
    /<BaselineHeartRateResult[\s\S]*?result=\{result\}[\s\S]*?age=\{age\}[\s\S]*?gender=\{gender\}/,
  );
});

test('an existing result restores the BPM result without re-analyzing', () => {
  assert.match(screen, /initialResult \? 'result' : 'intro'/);
  assert.match(
    screen,
    /useState<CompletedOnboardingBaselineResult \| null>\(initialResult\)/,
  );
});

test('preparation uses three exact, manually paged steps', () => {
  assert.match(carousel, /Warm your hands/);
  assert.match(carousel, /Rub your hands together for about 30 seconds\. If your case overlaps the camera or flash, remove it\./);
  assert.match(carousel, /Cover the camera lens/);
  assert.match(carousel, /Place the soft pad of your index finger flat over the highlighted lens\. Keep the flash uncovered\./);
  assert.match(carousel, /Hold lightly and stay still/);
  assert.match(carousel, /Rest your elbows on a table or your knees\. Keep gentle contact, breathe normally, and don’t talk or adjust your grip\./);
  assert.match(carousel, /pagingEnabled/);
  assert.match(carousel, /<PagerDots/);
});

test('the hand steps use one cached, downscaled image each', () => {
  const assets = [
    ['heartRateWarmHands', 'heart-rate-warm-hands.png'],
    ['heartRateHoldStill', 'heart-rate-hold-still.png'],
  ];

  for (const [key, path] of assets) {
    assert.match(imageCache, new RegExp(`\\| '${key}'`));
    assert.match(imageCache, new RegExp(`${key}: require\\('\\.\\.\\/\\.\\.\\/\\.\\.\\/assets\\/onboarding\\/${path.replace('.', '\\.')}\\'\\)`));
    assert.match(imageCache, new RegExp(`${key}: \\{ maxWidth: 870 \\}`));
    assert.match(carousel, new RegExp(`key: '${key}'`));
  }

  assert.match(carousel, /source=\{getOnboardingImageSource\(step\.visual\.key\)\}/);
  assert.match(carousel, /contentFit="contain"/);
  assert.match(carousel, /cachePolicy="memory-disk"/);
  assert.match(carousel, /transition=\{0\}/);
  assert.match(carousel, /accessible=\{false\}/);
});

test('the lens step draws this phone\u2019s own cameras, not a fixed photo', () => {
  assert.match(carousel, /visual: \{ kind: 'lensPlacement' \}/);
  assert.match(
    carousel,
    /import \{ HeartRatePlacementIllustration \}[\s\S]*?<HeartRatePlacementIllustration size=\{VISUAL_SIZE\} \/>/,
  );
  // A generic camera photo points at a lens most phones do not measure from.
  assert.doesNotMatch(imageCache, /heartRateCoverCamera/);
  assert.doesNotMatch(carousel, /'heartRateCoverCamera'|<Icon/);
});

test('step art is drawn at the onboarding illustration size', () => {
  assert.match(carousel, /scaleVisual\(290\)/);
  assert.match(carousel, /ONBOARDING_VISUAL_MAX_WIDTH/);
  assert.match(carousel, /height: VISUAL_SIZE/);
});

test('paging slides, and each step has a transition and a buzz', () => {
  // Next/Back moves the pager instead of cutting to the next page.
  assert.match(carousel, /scrollTo\(\{ x: index \* pageWidth, animated: true \}\)/);
  // Copy motion is driven by the scroll offset, so it tracks a swipe too.
  assert.match(carousel, /onScroll=\{Animated\.event\(/);
  assert.match(carousel, /useNativeDriver: true/);
  assert.match(carousel, /outputRange: \[0, 1, 0\]/);
  // Both labels are the same button, and it is no longer silenced.
  assert.match(screen, /\? 'Start my reading'[\s\S]*?: 'Next'/);
  assert.doesNotMatch(screen, /enableHaptics=\{false\}/);
});

test('Next and Back page locally, and camera access is gated by the final action', () => {
  assert.match(screen, /prepStep > 0[\s\S]*?setPrepStep\(\(current\) => current - 1\)[\s\S]*?onBack\(\)/);
  assert.match(screen, /prepStep < HEART_RATE_PREP_STEPS\.length - 1[\s\S]*?setPrepStep\(\(current\) => current \+ 1\)[\s\S]*?void handleStart\(\)/);
  assert.match(screen, /\? 'Start my reading'[\s\S]*?: 'Next'/);
  assert.match(screen, /const handleStart = async \(\) => \{[\s\S]*?stream\.requestPermission\(\)/);
});
