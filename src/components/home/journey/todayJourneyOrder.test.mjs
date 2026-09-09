import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defaultTodayJourneyOrder,
  mergeVisibleTodayJourneyOrder,
  migrateLegacyTodayJourneyOrder,
  sanitizeTodayJourneyOrder,
} from './todayJourneyOrder.ts';

const actions = { session: '18:00', handPicked: '12:00', checkIn: '20:00' };
const goal = (id, scheduledTime) => ({ id, scheduledTime, createdAt: id });

test('defaults put exercises first and sort both groups chronologically', () => {
  assert.deepEqual(defaultTodayJourneyOrder(actions, [
    goal('evening', '21:00'),
    goal('morning', '08:00'),
    goal('afternoon', '13:00'),
  ]), [
    'exercise:handPicked', 'exercise:session', 'exercise:checkIn',
    'todo:morning', 'todo:afternoon', 'todo:evening',
  ]);
});

test('equal times use canonical exercise order and deterministic todo input order', () => {
  const sameTimeActions = { session: '12:00', handPicked: '12:00', checkIn: '12:00' };
  assert.deepEqual(defaultTodayJourneyOrder(sameTimeActions, [
    goal('second', '09:00'),
    goal('first', '09:00'),
  ]), [
    'exercise:session', 'exercise:handPicked', 'exercise:checkIn',
    'todo:second', 'todo:first',
  ]);
});

test('untimed todos follow every timed todo', () => {
  assert.deepEqual(defaultTodayJourneyOrder(actions, [
    goal('untimed-first', null),
    goal('late', '23:00'),
    goal('untimed-second', null),
    goal('early', '06:00'),
  ]), [
    'exercise:handPicked', 'exercise:session', 'exercise:checkIn',
    'todo:early', 'todo:late', 'todo:untimed-first', 'todo:untimed-second',
  ]);
});

test('sanitizes persisted order and appends new live rows', () => {
  assert.deepEqual(sanitizeTodayJourneyOrder(
    ['todo:a', 'gone', 'todo:a', 'exercise:session'],
    ['exercise:session', 'todo:a', 'todo:b'],
  ), ['todo:a', 'exercise:session', 'todo:b']);
});

test('cross-type moves preserve hidden row placement', () => {
  assert.deepEqual(mergeVisibleTodayJourneyOrder(
    ['exercise:session', 'todo:hidden', 'todo:a', 'exercise:checkIn'],
    ['todo:a', 'exercise:checkIn', 'exercise:session'],
  ), ['todo:a', 'todo:hidden', 'exercise:checkIn', 'exercise:session']);
});

test('legacy daily ordering is retained during mixed-order migration', () => {
  const defaults = ['exercise:session', 'todo:a', 'exercise:handPicked', 'exercise:checkIn'];
  assert.deepEqual(migrateLegacyTodayJourneyOrder(
    defaults,
    ['checkIn', 'session', 'handPicked'],
    {},
  ), ['exercise:checkIn', 'todo:a', 'exercise:session', 'exercise:handPicked']);
});

test('absent legacy preferences preserve chronological defaults', () => {
  const defaults = [
    'exercise:handPicked', 'exercise:session', 'exercise:checkIn',
    'todo:early', 'todo:late',
  ];
  assert.deepEqual(
    migrateLegacyTodayJourneyOrder(defaults, null, {}),
    defaults,
  );
});

test('an explicitly stored canonical legacy order still overrides defaults', () => {
  const defaults = [
    'exercise:handPicked', 'exercise:session', 'exercise:checkIn',
    'todo:early', 'todo:late',
  ];
  assert.deepEqual(migrateLegacyTodayJourneyOrder(
    defaults,
    ['session', 'handPicked', 'checkIn'],
    {},
  ), [
    'exercise:session', 'exercise:handPicked', 'exercise:checkIn',
    'todo:early', 'todo:late',
  ]);
});
