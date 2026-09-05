import test from 'node:test';
import assert from 'node:assert/strict';
import { tourSteps } from './tourSteps.ts';

test('the app tour walks four Home targets before Heart measurement', () => {
  assert.deepEqual(
    tourSteps.map(({ target, tab }) => ({ target, tab })),
    [
      { target: 'dailies', tab: 'Home' },
      { target: 'todos', tab: 'Home' },
      { target: 'extraPractice', tab: 'Home' },
      { target: 'seeAll', tab: 'Home' },
      { target: 'measureHeart', tab: 'Heart' },
    ],
  );
});

test('the Heart stop explains what measurement provides', () => {
  const heartStep = tourSteps.find(({ target }) => target === 'measureHeart');
  assert.match(heartStep?.body ?? '', /measure/i);
  assert.match(heartStep?.body ?? '', /heart rate/i);
});
