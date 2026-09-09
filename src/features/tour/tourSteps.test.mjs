import test from 'node:test';
import assert from 'node:assert/strict';
import { tourSteps } from './tourSteps.ts';

test('the app tour visits Home before pointing to the Heart measurement action', () => {
  assert.deepEqual(
    tourSteps.map(({ target, destination }) => ({ target, destination })),
    [
      { target: 'dailies', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'extraPractice', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'seeAll', destination: { route: 'MainTabs', screen: 'Home' } },
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
