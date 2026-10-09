import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tourSteps } from './tourSteps.ts';

const here = dirname(fileURLToPath(import.meta.url));

test('the app tour has three Home stops: next step, room reward, and first lesson', () => {
  assert.deepEqual(
    tourSteps.map(({ target, destination }) => ({ target, destination })),
    [
      { target: 'roomProgress', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'roomPiece', destination: { route: 'MainTabs', screen: 'Home' } },
      { target: 'firstLesson', destination: { route: 'MainTabs', screen: 'Home' } },
    ],
  );
});

test('the first two stops explain the next step and its room reward', () => {
  assert.equal(
    tourSteps.find(({ target }) => target === 'roomProgress')?.body,
    'This play button always starts the next step of your plan.',
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

test('the final stop invites the first small step', () => {
  assert.equal(
    tourSteps.at(-1)?.body,
    'Let’s take your first small step. Tap play to begin.',
  );
});

test('only the last stop is finished on its control', () => {
  const pressStops = tourSteps.filter((step) => step.finishOn === 'press');
  assert.deepEqual(pressStops.map((step) => step.target), ['firstLesson']);
  assert.equal(tourSteps.at(-1)?.finishOn, 'press');
});
