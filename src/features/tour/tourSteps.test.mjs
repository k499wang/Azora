import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tourSteps } from './tourSteps.ts';

const here = dirname(fileURLToPath(import.meta.url));

test('the app tour visits every primary tab before pointing to the Heart measurement action', () => {
  assert.deepEqual(
    tourSteps.map(({ target, destination }) => ({ target, destination })),
    [
      { target: 'dailies', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'roomProgress', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'routineAddHabit', destination: { route: 'MainTabs', screen: 'Plan' } },
      { target: 'azoraScore', destination: { route: 'MainTabs', screen: 'Insights' } },
      { target: 'planInsights', destination: { route: 'MainTabs', screen: 'Insights' } },
      { target: 'azoToolkit', destination: { route: 'MainTabs', screen: 'Explore' } },
      { target: 'measureHeart', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'startHeartMeasurement', destination: { route: 'Heart' } },
    ],
  );
});

test('the added tab stops are registered by their owning screens', () => {
  const sources = [
    ['PlanScreen.tsx', 'tourAddHabitTarget'],
    ['InsightsScreen.tsx', 'azoraScore'],
    ['InsightsScreen.tsx', 'planInsights'],
    ['RoutineLibraryScreen.tsx', 'azoToolkit'],
  ];

  for (const [file, target] of sources) {
    const source = readFileSync(join(here, '..', '..', 'screens', file), 'utf8');
    assert.match(source, new RegExp(target), `${target} is not registered by ${file}`);
  }

  const routineList = readFileSync(
    join(here, '..', 'selfCare', 'TodoListSection.tsx'),
    'utf8',
  );
  assert.match(routineList, /useTourTarget\('routineAddHabit'\)/);
});

test('the plan is one step that explains its rows and to-dos', () => {
  const dailySteps = tourSteps.filter(({ target }) => target === 'dailies');

  assert.equal(dailySteps.length, 1);
  assert.equal(
    dailySteps[0]?.body,
    'This is your plan. Tap anything to start it, or tick off a to-do when it’s done.',
  );
  assert.equal(tourSteps.some(({ target }) => target === 'todos'), false);
});

test('the room stop says what finishing the plan is for, right after it', () => {
  const targets = tourSteps.map(({ target }) => target);
  const roomStep = tourSteps.find(({ target }) => target === 'roomProgress');

  assert.equal(
    targets.indexOf('roomProgress'),
    targets.indexOf('dailies') + 1,
    'the card is what the plan is for, so it follows the plan',
  );
  assert.equal(
    roomStep?.body,
    'Finish your plan for the day to unlock a new decoration for your room.',
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

test('no stop uses a banned word or an em dash', () => {
  for (const { body } of tourSteps) {
    assert.doesNotMatch(body, /breathwork|exercise/i);
    assert.doesNotMatch(body, /—/);
  }
});

test('the final heart stop names where a reading starts without asking for a tap', () => {
  const step = tourSteps.find(({ target }) => target === 'startHeartMeasurement');
  assert.equal(step?.body, 'The plus button is where a heart-rate reading starts.');
  assert.doesNotMatch(step.body, /\btap\b/i);
});

test('the heart stop explains where to find heart readings', () => {
  const heartStep = tourSteps.find(({ target }) => target === 'measureHeart');
  assert.equal(
    heartStep?.body,
    'Your heart readings live here.',
  );
  assert.doesNotMatch(heartStep.body, /\btap\b/i);
});

test('the tour no longer points at the removed hotel shortcut', () => {
  assert.doesNotMatch(
    JSON.stringify(tourSteps.map(({ target }) => target)),
    /hotel/,
  );
});
