import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

test('TourOverlay owns placing and following a stop as one lifecycle', () => {
  const overlay = readFileSync(join(here, 'TourOverlay.tsx'), 'utf8');
  const ownerStart = overlay.indexOf('// Place one target, then follow it');
  const ownerEnd = overlay.indexOf('const presentedStep', ownerStart);
  const owner = overlay.slice(ownerStart, ownerEnd);

  assert.notEqual(ownerStart, -1);
  assert.notEqual(ownerEnd, -1);
  assert.equal(owner.match(/useLayoutEffect\(\(\) => \{/g)?.length, 1);
  assert.doesNotMatch(owner, /useEffect\(\(\) => \{/);
  assert.equal(owner.match(/trackTourTarget\(/g)?.length, 1);
  assert.doesNotMatch(overlay, /measurementGenerationRef|layoutGenerationRef/);

  assert.match(
    owner,
    /const isCurrentStep = \(\) =>\s*isActive && useTourStore\.getState\(\)\.stepIndex === measuringIndex/,
  );
  assert.match(
    owner,
    /current\?\.stepIndex === measuringIndex \? null : current/,
  );

  const measure = owner.indexOf('await measureTourTarget(');
  const guard = owner.indexOf('if (!isCurrentStep()) return null;', measure);
  const publish = owner.indexOf(
    'setPositionedRect({ stepIndex: measuringIndex, rect: measured });',
    guard,
  );
  const startTracking = owner.indexOf('untrack = trackTourTarget(', publish);
  assert.ok(measure < guard);
  assert.ok(guard < publish);
  assert.ok(publish < startTracking);

  // A stop that cannot be placed stands the tour down instead of advancing:
  // `next` past the last step calls `stop`, which marks the tour seen forever.
  assert.match(owner, /useTourStore\.getState\(\)\.abort\(\);/);
  assert.doesNotMatch(owner, /useTourStore\.getState\(\)\.next\(\)/);

  // A tracked move that leaves the viewport re-runs the whole placement,
  // scroll included, rather than dropping the stop.
  assert.match(
    owner,
    /stopTracking\(\);\s*clearCurrentRect\(\);\s*void run\(\);/,
  );
  assert.match(
    owner,
    /if \(untrack == null\) return;[\s\S]*?untrack = null;[\s\S]*?stop\(\)/,
  );
  assert.match(
    owner,
    /return \(\) => \{\s*isActive = false;\s*stopTracking\(\);/,
  );

  // Keyed on whether there is a rect, never on the rect itself: following a
  // placed stop as it moves must not restart its entrance.
  assert.match(overlay, /const clusterOpacity = useTourFadeIn\(rect != null\)/);
  assert.doesNotMatch(overlay, /useTourFadeIn\(rect\)/);
});

test('the overlay stays away until a stop has actually been placed', () => {
  const overlay = readFileSync(join(here, 'TourOverlay.tsx'), 'utf8');

  assert.match(
    overlay,
    /const shouldShowOverlay = hasActiveStep && hasPlacedAnyStep;/,
  );
  // The scrim follows placement, not the bare existence of a step — otherwise
  // a dark screen with no Azo, no bubble and no arrow is what measuring looks
  // like, and it lands over the intro splash.
  assert.match(overlay, /if \(shouldShowOverlay\) \{/);
  assert.doesNotMatch(overlay, /if \(hasActiveStep\) \{\s*modalVisibleRef/);
  assert.match(overlay, /setHasPlacedAnyStep\(true\);/);
  assert.match(overlay, /setHasPlacedAnyStep\(false\);/);
});

test('nothing that covers the app starts before the intro splash is gone', () => {
  const app = readFileSync(join(here, '..', '..', '..', 'App.tsx'), 'utf8');
  const navigator = readFileSync(
    join(here, '..', '..', 'app', 'navigation', 'RootNavigator.tsx'),
    'utf8',
  );

  assert.match(app, /<RootNavigator isIntroComplete=\{!introVisible\} \/>/);
  assert.match(
    navigator,
    /showBootPaywall=\{isIntroComplete\}\s*tourEnabled=\{isIntroComplete\}/,
  );
  assert.doesNotMatch(navigator, /tourEnabled\s*\/>/);
});

test('a tour stop is followed by measurement, never by a layout event', () => {
  const targets = readFileSync(join(here, 'tourTargets.ts'), 'utf8');

  // Anything growing above a target moves it without changing its own layout,
  // so onLayout never fires for it and the cutout is left behind. What the
  // polling itself does is covered for real in tourSampling.test.mjs.
  assert.doesNotMatch(targets, /watchTourTargetLayout|layoutListeners/);
  assert.match(targets, /return \{ ref, collapsable: false \} as const;/);
  assert.match(targets, /export function trackTourTarget\(/);
  assert.match(targets, /trackMovement\(/);

  // An unstable target is not a guess to draw around.
  assert.match(targets, /if \(!initial\.stable \|\| initial\.rect == null\) return null;/);
});

test('the room progress card reserves its height while it loads', () => {
  const cardSource = readFileSync(
    join(here, '..', 'room', 'RoomProgressCard.tsx'),
    'utf8',
  );

  assert.match(cardSource, /if \(isLoading\) \{\s*return <RoomProgressCardPlaceholder \/>;/);
  assert.doesNotMatch(cardSource, /if \(isLoading\) \{\s*return null;/);
  // Built from the same pieces at the same sizes, so nothing below it moves
  // when the real card replaces it.
  assert.match(cardSource, /height=\{HEADLINE_ICON_SIZE\}/);
  assert.match(cardSource, /height=\{TITLE_LINE_HEIGHT\}/);
  assert.match(cardSource, /height=\{BAR_HEIGHT\}/);
  assert.match(cardSource, /lineHeight: TITLE_LINE_HEIGHT/);
});

test('the required activation targets the real primary daily play button', () => {
  const home = readFileSync(
    join(here, '..', '..', 'screens', 'HomeScreen.tsx'),
    'utf8',
  );
  const rows = readFileSync(
    join(here, '..', '..', 'components', 'home', 'TodaysDailiesSection.tsx'),
    'utf8',
  );

  assert.match(home, /useTourTarget\('firstDailyPlay'\)/);
  assert.match(home, /dailyRows\.session\.actionTarget = firstDailyPlayTarget/);
  assert.match(rows, /<View \{\.\.\.actionTarget\}>\s*<Pressable/);
  assert.match(home, /useTourTarget\('dailies'\)/);
});

test('the heart tour target belongs to the Home heart button', () => {
  const home = readFileSync(
    join(here, '..', '..', 'screens', 'HomeScreen.tsx'),
    'utf8',
  );
  const targetStart = home.indexOf('<View {...measureHeartTarget}>');
  const targetEnd = home.indexOf('</View>', targetStart);
  const target = home.slice(targetStart, targetEnd);

  assert.notEqual(targetStart, -1);
  assert.notEqual(targetEnd, -1);
  assert.match(target, /accessibilityLabel="Open heart statistics"/);
  assert.match(target, /name="heart"/);
});

test('the tour no longer stops on the Explore tab', () => {
  const explore = readFileSync(
    join(here, '..', '..', 'screens', 'RoutineLibraryScreen.tsx'),
    'utf8',
  );

  assert.doesNotMatch(explore, /useTourTarget/);
});

test('the Heart measurement target wraps the native plus button', () => {
  const heart = readFileSync(
    join(here, '..', '..', 'screens', 'HeartScreen.tsx'),
    'utf8',
  );
  const targetStart = heart.indexOf('<View\n        {...startHeartMeasurementTarget}');
  const targetEnd = heart.indexOf('</View>', targetStart);
  const target = heart.slice(targetStart, targetEnd);

  assert.notEqual(targetStart, -1);
  assert.notEqual(targetEnd, -1);
  assert.match(target, /accessibilityLabel="Measure heart rate"/);
  assert.match(target, /name="plus"/);
  assert.match(target, /styles\.stickyAction/);
});

test('the tour routes each typed destination and closes through returnToHome', () => {
  const owner = readFileSync(join(here, 'useAppTour.ts'), 'utf8');

  assert.match(owner, /step\.destination\.route === 'MainTabs'/);
  assert.match(
    owner,
    /navigation\.navigate\('MainTabs', \{ screen: step\.destination\.screen \}\)/,
  );
  assert.match(owner, /navigation\.navigate\(step\.destination\.route\)/);
  assert.match(owner, /if \(!enabled \|\| status !== 'closing'\) return;\s*returnToHome\(navigation\);/);
});

test('MainTabs stays live only while the tour is running or closing', () => {
  const navigator = readFileSync(
    join(here, '..', '..', 'app', 'navigation', 'RootNavigator.tsx'),
    'utf8',
  );

  assert.match(
    navigator,
    /const keepMainTabsLive = tourStatus === 'running' \|\| tourStatus === 'closing';/,
  );
  assert.match(
    navigator,
    /name="MainTabs"[\s\S]*?options=\{\{ freezeOnBlur: !keepMainTabsLive \}\}/,
  );
});
