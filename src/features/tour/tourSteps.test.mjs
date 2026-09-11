import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tourSteps } from './tourSteps.ts';

const here = dirname(fileURLToPath(import.meta.url));

test('the app tour visits Home before pointing to the Heart measurement action', () => {
  assert.deepEqual(
    tourSteps.map(({ target, destination }) => ({ target, destination })),
    [
      { target: 'dailies', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'roomProgress', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'measureHeart', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'startHeartMeasurement', destination: { route: 'Heart' } },
    ],
  );
});

test("today's list is one step that explains dailies and to-dos", () => {
  const dailySteps = tourSteps.filter(({ target }) => target === 'dailies');

  assert.equal(dailySteps.length, 1);
  assert.equal(
    dailySteps[0]?.body,
    'Tap a daily to start it, or tick off a to-do when it’s done.',
  );
  assert.equal(tourSteps.some(({ target }) => target === 'todos'), false);
});

test('the room stop says what finishing the list is for, right after it', () => {
  const targets = tourSteps.map(({ target }) => target);
  const roomStep = tourSteps.find(({ target }) => target === 'roomProgress');

  assert.equal(
    targets.indexOf('roomProgress'),
    targets.indexOf('dailies') + 1,
    'the card is what the list is for, so it follows the list',
  );
  assert.equal(
    roomStep?.body,
    'Finish everything on today’s list to unlock a new decoration for your room.',
  );
});

test('every stop on Home is one the Home scroller can reach', () => {
  const home = readFileSync(
    join(here, '..', '..', 'screens', 'HomeScreen.tsx'),
    'utf8',
  );
  const listStart = home.indexOf('const TOUR_TARGETS: TourTargetId[] = [');
  const list = home.slice(listStart, home.indexOf('];', listStart));

  // A stop the scroller does not know about is measured where it happens to
  // sit rather than scrolled to where the tour needs it.
  for (const { target, destination } of tourSteps) {
    if (destination.route !== 'MainTabs' || destination.screen !== 'Home') continue;
    assert.match(list, new RegExp(`'${target}'`), `${target} is not registered`);
    assert.match(home, new RegExp(`useTourTarget\\('${target}'\\)`));
  }
});

test('the final heart stop explains how to start a reading', () => {
  const step = tourSteps.find(({ target }) => target === 'startHeartMeasurement');
  assert.equal(step?.body, 'Tap the plus button to start a heart-rate reading.');
});

test('the heart stop explains where to find heart readings', () => {
  const heartStep = tourSteps.find(({ target }) => target === 'measureHeart');
  assert.equal(
    heartStep?.body,
    'Tap the heart to open your Heart page and see your readings.',
  );
});

test('the tour no longer points at the removed hotel shortcut', () => {
  assert.doesNotMatch(
    JSON.stringify(tourSteps.map(({ target }) => target)),
    /hotel/,
  );
});
