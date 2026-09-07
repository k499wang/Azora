import test from 'node:test';
import assert from 'node:assert/strict';
import { tourSteps } from './tourSteps.ts';

test('the app tour keeps every step on Home', () => {
  assert.deepEqual(
    tourSteps.map(({ target, tab }) => ({ target, tab })),
    [
      { target: 'dailies', tab: 'Home' },
      { target: 'todos', tab: 'Home' },
      { target: 'extraPractice', tab: 'Home' },
      { target: 'seeAll', tab: 'Home' },
      { target: 'hotel', tab: 'Home' },
      { target: 'measureHeart', tab: 'Home' },
    ],
  );
});

test('the heart stop explains what measurement provides', () => {
  const heartStep = tourSteps.find(({ target }) => target === 'measureHeart');
  assert.match(heartStep?.body ?? '', /measure/i);
  assert.match(heartStep?.body ?? '', /heart rate/i);
});

test('the hotel stop points at the record of finished rooms', () => {
  const hotelStep = tourSteps.find(({ target }) => target === 'hotel');
  assert.match(hotelStep?.body ?? '', /hotel/i);
  assert.match(hotelStep?.body ?? '', /room/i);
});
