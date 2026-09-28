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
      { target: 'roomProgress', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'dailies', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'roomPiece', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'routineOverview', destination: { route: 'MainTabs', screen: 'Plan' } },
      { target: 'routineAddHabit', destination: { route: 'MainTabs', screen: 'Plan' } },
      { target: 'azoraScore', destination: { route: 'MainTabs', screen: 'Insights' } },
      { target: 'planWeeks', destination: { route: 'MainTabs', screen: 'Insights' } },
      { target: 'azoToolkit', destination: { route: 'MainTabs', screen: 'Explore' } },
      { target: 'measureHeart', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'startHeartMeasurement', destination: { route: 'Heart' } },
      { target: 'firstLesson', destination: { route: 'MainTabs', screen: 'Home' } },
    ],
  );
});

test('the added tab stops are registered by their owning screens', () => {
  const sources = [
    ['PlanScreen.tsx', 'tourAddHabitTarget'],
    ['InsightsScreen.tsx', "useTourTarget\\('planWeeks'\\)"],
    ['InsightsScreen.tsx', 'azoraScore'],
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
  assert.match(routineList, /useTourTarget\('routineOverview'\)/);
});

test('the plan is one step that explains its path', () => {
  const dailySteps = tourSteps.filter(({ target }) => target === 'dailies');

  assert.equal(dailySteps.length, 1);
  assert.equal(
    dailySteps[0]?.body,
    'This is your plan! Every step you finish fills in the path.',
  );
  assert.equal(tourSteps.some(({ target }) => target === 'todos'), false);
});

test('Home walks down the page: start button, then the path, then the room piece it ends on', () => {
  const targets = tourSteps.map(({ target }) => target);
  const dailies = targets.indexOf('dailies');

  assert.equal(targets.indexOf('roomProgress'), dailies - 1);
  assert.equal(targets.indexOf('roomPiece'), dailies + 1);
  assert.equal(
    tourSteps.find(({ target }) => target === 'roomProgress')?.body,
    'Start my plan always takes you to your next step.',
  );
  assert.equal(
    tourSteps.find(({ target }) => target === 'roomPiece')?.body,
    'Finish the whole path to unlock a new piece for your room!',
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
    assert.match(home, new RegExp(`useTourTarget\\(\\s*'${target}'`));
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
  assert.equal(step?.body, 'Every heart reading starts with this plus button.');
  assert.doesNotMatch(step.body, /\btap\b/i);
});

test('the heart stop explains where to find heart readings', () => {
  const heartStep = tourSteps.find(({ target }) => target === 'measureHeart');
  assert.equal(
    heartStep?.body,
    'Your heart readings live right here.',
  );
  assert.doesNotMatch(heartStep.body, /\btap\b/i);
});

test('the tour no longer points at the removed hotel shortcut', () => {
  assert.doesNotMatch(
    JSON.stringify(tourSteps.map(({ target }) => target)),
    /hotel/,
  );
});

test('only the last stop is finished on its control', () => {
  const pressStops = tourSteps.filter((step) => step.finishOn === 'press');
  assert.deepEqual(pressStops.map((step) => step.target), ['firstLesson']);
  assert.equal(tourSteps.at(-1)?.finishOn, 'press');
});
