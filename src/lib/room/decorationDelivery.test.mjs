import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DECORATION_DELIVERY_MS,
  decorationArrivalClock,
  decorationReadyAt,
  isDecorationReady,
} from './decorationDelivery.ts';

/** Local time on purpose: the cutoff is measured against local midnight. */
function at(hour, minute = 0) {
  return new Date(2026, 8, 4, hour, minute, 0, 0);
}

test('a day finished with hours to spare waits the full delivery', () => {
  const completed = at(12);
  assert.equal(
    decorationReadyAt(completed),
    completed.getTime() + DECORATION_DELIVERY_MS,
  );
});

test('a day finished in the evening waits only until the cutoff', () => {
  assert.equal(decorationReadyAt(at(22)), at(23).getTime());
});

test('a day finished past the cutoff gives up the wait entirely', () => {
  const completed = at(23, 30);
  assert.equal(decorationReadyAt(completed), completed.getTime());
});

test('a delivery is never booked into tomorrow', () => {
  for (let hour = 0; hour < 24; hour += 1) {
    const completed = at(hour, 45);
    const midnight = new Date(completed);
    midnight.setHours(24, 0, 0, 0);
    assert.ok(decorationReadyAt(completed) < midnight.getTime());
    assert.ok(decorationReadyAt(completed) >= completed.getTime());
  }
});

test('an unrecorded delivery reads as ready', () => {
  assert.equal(isDecorationReady(null, at(12).getTime()), true);
});

test('a delivery is ready only once its moment has passed', () => {
  const readyAt = at(16).getTime();
  assert.equal(isDecorationReady(readyAt, at(15, 59).getTime()), false);
  assert.equal(isDecorationReady(readyAt, readyAt), true);
  assert.equal(isDecorationReady(readyAt, at(16, 1).getTime()), true);
});

test('the arrival clock is zero-padded local time', () => {
  assert.equal(decorationArrivalClock(at(9, 5).getTime()), '09:05');
  assert.equal(decorationArrivalClock(at(16, 30).getTime()), '16:30');
});
