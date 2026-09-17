import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { tourSteps } from './tourSteps.ts';
import {
  activationStopFor,
  activationStopNumber,
  activationStops,
  TOTAL_TOUR_STOPS,
} from './activationStops.ts';

const store = readFileSync(new URL('./firstSessionActivationStore.ts', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('./FirstSessionActivationOverlay.tsx', import.meta.url), 'utf8');
const session = readFileSync(
  new URL('../exercise/guidedBreathing/GuidedBreathingSessionScreen.tsx', import.meta.url),
  'utf8',
);
const home = readFileSync(new URL('../../screens/HomeScreen.tsx', import.meta.url), 'utf8');
const owner = readFileSync(new URL('./useAppTour.ts', import.meta.url), 'utf8');
const steps = readFileSync(new URL('./tourSteps.ts', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../../screens/SettingsScreen.tsx', import.meta.url), 'utf8');

test('activation queues behind the unchanged informational tour', () => {
  assert.match(store, /setFirstSessionActivation\(userId, techniqueId\)/);
  assert.match(store, /phase: 'queued'/);
  assert.match(owner, /hydrate\(userId, activationTechniqueId, seen\)/);
  assert.match(owner, /status !== 'finished'[\s\S]*promoteQueued\(\)/);
  assert.match(store, /replayFullFirstSessionFlow[\s\S]*useTourStore\.getState\(\)\.start\(\)/);
});

test('canonical save clears durable activation before opening the result', () => {
  assert.match(store, /setFirstSessionActivation\(userId, null\)/);
  assert.match(store, /finish: \(\) => set\(STOOD_DOWN\)/);
  // The dismissal guard reads the phase this clears, so the result cannot be
  // opened before the clear has landed.
  assert.match(
    session,
    /completePersistence\(\)\s*\.then\(openResult\)/,
  );
});

test('pending activation is isolated to its authenticated account', () => {
  const preference = readFileSync(
    new URL('../../services/preferences/tourSeenPreference.ts', import.meta.url),
    'utf8',
  );
  const navigator = readFileSync(
    new URL('../../app/navigation/RootNavigator.tsx', import.meta.url),
    'utf8',
  );

  assert.match(preference, /FIRST_SESSION_ACTIVATION_KEY_PREFIX/);
  assert.match(preference, /FIRST_SESSION_ACTIVATION_KEY_PREFIX\}\$\{userId\}/);
  assert.match(owner, /loadFirstSessionActivation\(userId\)/);
  assert.match(owner, /beginCheck\(userId\)/);
  assert.match(owner, /hydrate\(userId, activationTechniqueId, seen\)/);
  assert.match(home, /activationUserId === user\?\.id/);
  assert.match(session, /activationUserId === userId/);
  assert.match(navigator, /activationUserId === currentUserId/);
});

test('the action coach leaves only the measured real control interactive', () => {
  assert.equal((overlay.match(/<Pressable onPress=\{\(\) => \{\}\}/g) ?? []).length, 4);
  assert.match(overlay, /if \(measured == null\) \{[\s\S]*setTimeout\(place, RETRY_MS\)/);
});

test('the cutout is a hole for touches, not only for light', () => {
  const spotlight = readFileSync(new URL('./TourSpotlight.tsx', import.meta.url), 'utf8');
  const cutout = spotlight.slice(
    spotlight.indexOf('export function TourCutout'),
    spotlight.indexOf('interface TourClusterProps'),
  );

  // RNSVGSvgView hit-tests its own children and ignores the pointerEvents it
  // was handed, so the masked scrim rect still covers the whole screen for
  // touch. Without a real RN view around it nothing on the app is pressable.
  assert.match(cutout, /<View pointerEvents="none" style=\{StyleSheet\.absoluteFill\}>\s*<Svg/);
  assert.doesNotMatch(cutout, /<Svg pointerEvents/);
});

test('an unplaced stop covers nothing, so the real control stays pressable', () => {
  // The scrim used to go up while the stop was still being measured, over the
  // very button it was about to point at.
  assert.doesNotMatch(overlay, /Preparing your first exercise/);
  assert.doesNotMatch(overlay, /Getting your first reset ready/);
  assert.match(overlay, /if \(stop == null \|\| rect == null\) return null;/);
});

test('a stop that can never be placed stands the run down', () => {
  // Everything gated on the first session ending waits on this phase, so a
  // missing element must not hold it open.
  assert.match(overlay, /PLACEMENT_TIMEOUT_MS/);
  assert.match(overlay, /abandon\(\);?\s*\n?\s*\}, PLACEMENT_TIMEOUT_MS\)/);
  // Re-armed after a placed element is lost, so the retry loop is bounded too.
  assert.match(overlay, /const place = \(\) => \{\s*armGiveUp\(\);/);
  assert.match(store, /abandon: \(\) => set\(STOOD_DOWN\)/);
  // Standing down leaves the durable flag alone, so it replays next launch.
  const abandonLine = store.slice(store.indexOf('abandon: () =>'));
  assert.doesNotMatch(abandonLine.slice(0, 120), /setFirstSessionActivation/);
});

test('the run walks one ordered list of stops, ending on the plan', () => {
  assert.deepEqual(
    activationStops.map(({ phase, target, interaction }) => ({ phase, target, interaction })),
    [
      { phase: 'daily', target: 'firstDailyPlay', interaction: 'press-through' },
      { phase: 'start', target: 'firstSessionStart', interaction: 'press-through' },
      { phase: 'result', target: 'resultDone', interaction: 'press-through' },
      { phase: 'plan', target: 'dailies', interaction: 'dismiss' },
    ],
  );

  // Only the last stop is a message rather than a control, because dismissing
  // one ends the whole run.
  const dismissable = activationStops.filter((s) => s.interaction === 'dismiss');
  assert.equal(dismissable.length, 1);
  assert.equal(dismissable[0], activationStops[activationStops.length - 1]);
});

test('every stop continues the tour’s numbering and points at a real target', () => {
  assert.equal(TOTAL_TOUR_STOPS, tourSteps.length + activationStops.length);
  assert.deepEqual(
    activationStops.map(activationStopNumber),
    activationStops.map((_, i) => tourSteps.length + i),
  );
  for (const { target } of activationStops) {
    assert.match(steps, new RegExp(`'${target}'`), `${target} is not a tour target`);
  }
  assert.equal(activationStopFor('running'), null);
  assert.equal(activationStopFor('queued'), null);
  assert.equal(activationStopFor('result')?.target, 'resultDone');
});

test('the closing result screen hands over to the plan stop', () => {
  const result = readFileSync(
    new URL('../../screens/SessionCompleteScreen.tsx', import.meta.url),
    'utf8',
  );

  assert.match(result, /useTourTarget\('resultDone'\)/);
  // Home's list is already mounted under this screen, so the stop can only be
  // opened once the screen above it has finished closing.
  assert.match(
    result,
    /subscribeToClosingTransitionEnd\([\s\S]*resultPressed\(\)/,
  );
  assert.doesNotMatch(result, /getState\(\)\.finish\(\)/);
  assert.match(store, /resultPressed: \(\) => \{\s*if \(get\(\)\.phase === 'result'\) set\(\{ phase: 'plan' \}\);/);
});

test('the run can always be skipped, and a skip does not come back', () => {
  const session = readFileSync(
    new URL('../exercise/guidedBreathing/GuidedBreathingSessionScreen.tsx', import.meta.url),
    'utf8',
  );

  // Every stop the user has not finished offers a way out; the last one is
  // already a tap-anywhere dismissal.
  assert.match(overlay, /interaction === 'press-through' \? \(\s*<TourSkipButton/);
  assert.match(overlay, /hardwareBackPress[\s\S]*skip\(\)/);

  // Mid-session too: the close button is no longer hidden while it runs, and
  // pressing it clears the phase the dismissal guard reads.
  assert.doesNotMatch(session, /activationPhase === 'running' \? null/);
  assert.match(session, /if \(requiredActivation\) useFirstSessionActivationStore\.getState\(\)\.skip\(\);/);

  // A skipped first Reset is not offered again on the next launch.
  const skipStart = store.indexOf('skip: () => {');
  const skipBlock = store.slice(skipStart, store.indexOf('abandon:', skipStart));
  assert.match(skipBlock, /set\(STOOD_DOWN\)/);
  assert.match(skipBlock, /setFirstSessionActivation\(userId, null\)/);
  assert.ok(
    skipBlock.indexOf('set(STOOD_DOWN)') < skipBlock.indexOf('setFirstSessionActivation'),
    'the phase moves before the write, so leaving never waits on storage',
  );
});

test('both presenters offer the same way out', () => {
  const tour = readFileSync(new URL('./TourOverlay.tsx', import.meta.url), 'utf8');
  const spotlight = readFileSync(new URL('./TourSpotlight.tsx', import.meta.url), 'utf8');

  assert.match(spotlight, /export function TourSkipButton/);
  assert.match(tour, /<TourSkipButton disabled=\{!hasActiveStep\} onPress=\{skipTour\} \/>/);
  assert.match(overlay, /<TourSkipButton/);
});

test('the plan stop closes the run and motivates the next one', () => {
  const planStop = activationStops[activationStops.length - 1];

  assert.match(planStop.body, /today’s plan/);
  assert.match(planStop.body, /tomorrow/);
  // Azo is friendly here, and no stop's copy uses an em dash.
  for (const { body } of activationStops) {
    assert.doesNotMatch(body, /—/, `${body} uses an em dash`);
  }
  assert.match(overlay, /onPress=\{\(\) => useFirstSessionActivationStore\.getState\(\)\.finish\(\)\}/);
});

test('the tour counts the pending first session into its own numbering', () => {
  const tour = readFileSync(new URL('./TourOverlay.tsx', import.meta.url), 'utf8');

  assert.match(tour, /totalStops =\s*\n?\s*tourSteps\.length \+ activationStopCount\(/);
  assert.match(tour, /isLast = presentedStep\.stepIndex === totalStops - 1/);
  assert.match(tour, /<TourCounter index=\{presentedStep\.stepIndex\} total=\{totalStops\} \/>/);
});

test('the daily action advances only when normal feature access accepts launch', () => {
  const launch = home.slice(
    home.indexOf('onPressGuidedExercise:'),
    home.indexOf('onPressHandPickedExercise:'),
  );
  assert.match(launch, /activationPhase === 'daily'[\s\S]*accessAllowed/);
  assert.ok(launch.indexOf('dailyPressed()') < launch.indexOf("start('guided')"));
});

test('the first reset finishes into the ordinary result screen', () => {
  // It used to hold the user on the session screen until the write came back,
  // with a retry button if it failed. The save now runs behind the result, the
  // way every other session saves.
  assert.doesNotMatch(session, /Try saving again/);
  assert.doesNotMatch(session, /activationSaveError/);
  assert.doesNotMatch(session, /isSavingActivation/);
  assert.match(session, /firstSessionActivation: true/);

  const completion = session.slice(
    session.indexOf('const openResult = () =>'),
    session.indexOf('const startSessionFlow'),
  );
  assert.match(completion, /mutateAsync\(persistenceInput\)/);
  assert.match(completion, /captureException\(error/);
  assert.ok(
    completion.indexOf('completePersistence()') <
      completion.indexOf('mutateAsync(persistenceInput)'),
    'the result opens without waiting on the network save',
  );
});

test('the first reset cannot be swiped away by accident, only left on purpose', () => {
  // The guards stay: a back-swipe still cannot drop the user out of it. What
  // gets them out is pressing close, which skips first.
  assert.match(session, /navigation\.setOptions\(\{ gestureEnabled: !requiredActivation \}\)/);
  assert.match(session, /navigation\.addListener\('beforeRemove'/);
});

test('the dev preview opens the last two stops without touching real state', () => {
  assert.match(settings, /Preview first-Reset ending \(dev\)/);
  assert.match(settings, /previewFirstSessionEnding\(user\.id\)/);
  assert.match(settings, /firstSessionActivation: true/);

  const preview = store.slice(
    store.indexOf('export function previewFirstSessionEnding'),
    store.indexOf('export async function replayFullFirstSessionFlow'),
  );
  assert.match(preview, /phase: 'result'/);
  // A preview must not decide whether the real first Reset has happened.
  assert.doesNotMatch(preview, /setFirstSessionActivation/);
  assert.doesNotMatch(preview, /setTourSeen/);
});

test('dev replay uses the saved validated technique and warns about the real session', () => {
  assert.match(settings, /useUserDefaultTechniqueQuery\(user\?\.id \?\? null\)/);
  assert.match(settings, /isTechniqueId\(techniqueId\)/);
  assert.match(settings, /records a real breathing session for this account/);
  assert.match(settings, /Replay full first-session flow \(dev\)/);
  assert.match(settings, /subscribeToClosingTransitionEnd[\s\S]*replayFullFirstSessionFlow/);
  assert.doesNotMatch(settings, /replayAppTour/);
});
