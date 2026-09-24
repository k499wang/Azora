import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const overlay = read('./TourOverlay.tsx');
const targets = read('./tourTargets.ts');
const lesson = read('../../screens/LessonScreen.tsx');
const navigator = read('../../app/navigation/RootNavigator.tsx');
const settings = read('../../screens/SettingsScreen.tsx');
const spotlight = read('./TourSpotlight.tsx');

test('the whole run is one overlay, so its scrim never changes hands', () => {
  // The lesson stop used to be drawn by a second presenter over the live app,
  // and the hand-over between the two showed the bare app for a moment.
  assert.doesNotMatch(navigator, /FirstSessionActivationOverlay/);
  assert.equal((navigator.match(/<TourOverlay/g) ?? []).length, 0);
  assert.match(read('../../app/navigation/MainTabs.tsx'), /<TourOverlay \/>/);
});

test('the press stop answers only on its highlighted control', () => {
  // Tap-anywhere is off, and so is its hint.
  assert.match(overlay, /disabled=\{!canContinue \|\| finishesOnPress\}/);
  assert.match(overlay, /canContinue && !finishesOnPress \? \(\s*<TourTopHint/);
  // The hole itself is the button, laid exactly over the control.
  assert.match(
    overlay,
    /finishesOnPress && canContinue && hole != null \? \(\s*<Pressable[\s\S]*?onPress=\{pressStop\}[\s\S]*?left: hole\.x, top: hole\.y, width: hole\.width, height: hole\.height/,
  );
});

test('pressing it runs the control’s own action, then hands the run off', () => {
  const press = overlay.slice(overlay.indexOf('const pressStop = () => {'));
  // A second tap before the run has closed must not open the lesson twice.
  assert.ok(press.indexOf('live.handedOff ||') < press.indexOf('pressTourTarget('));
  assert.ok(press.indexOf('triggerTapHaptic()') < press.indexOf('pressTourTarget('));
  assert.match(
    press,
    /if \(pressTourTarget\(presentedStep\.step\.target\)\) \{\s*useTourStore\.getState\(\)\.finishByPress\(\);\s*\} else \{\s*useTourStore\.getState\(\)\.next\(\);\s*\}/,
  );
  // The action is whatever the element registered, kept current across renders.
  assert.match(targets, /latestPress\.current = onPress;/);
  assert.match(targets, /register\(pressHandlers, id, owner, \(\) => latestPress\.current\?\.\(\)\)/);
});

test('the run ends only once the lesson is off the screen', () => {
  assert.match(
    lesson,
    /useAfterScreenClosed\(navigation, \(\) => \{\s*useTourStore\.getState\(\)\.endHandoff\(readToEnd\.current\);/,
  );
  const afterClosed = read('../../app/navigation/useAfterScreenClosed.ts');
  assert.match(afterClosed, /addListener\('beforeRemove'[\s\S]*?subscribeToClosingTransitionEnd\(/);
});

test('nothing waiting on the tour presents while its lesson is open', () => {
  assert.match(
    navigator,
    /const tourDone = canPresentAfterTour\([\s\S]*?\) && !tourHandedOff;/,
  );
  // And not over the celebration it ends on, nor over a screen the user opened.
  assert.match(navigator, /celebrationsClear = tourDone && !firstWinShowing && !tourCelebrating/);
  assert.match(navigator, /exitOfferPending && canPresent && appOnTop \? \(/);
});

test('the tour keeps one way out, and it ends everything', () => {
  assert.match(spotlight, /export function TourSkipButton/);
  assert.match(overlay, /<TourSkipButton disabled=\{!hasActiveStep\} onPress=\{skipTour\} \/>/);
  assert.match(overlay, /onRequestClose=\{skipTour\}/);
});

test('dev replay returns Home and starts the tour without a breathing session', () => {
  assert.match(settings, /Replay Azo tour \(dev\)/);
  assert.match(settings, /Replay post-onboarding flow \(dev\)/);
  assert.match(settings, /setTourSeen\(false\)/);
  assert.match(settings, /prepareTourDestinations\(\s*queryClient,\s*user\?\.id \?\? null,\s*todayLocalDate,/);
  assert.match(settings, /subscribeToClosingTransitionEnd[\s\S]*void destinationPreparation;[\s\S]*useTourStore\.getState\(\)\.start\(\)/);
  assert.match(settings, /will not start or record a breathing session/);
  assert.doesNotMatch(settings, /Preview first-Reset ending/);
});
