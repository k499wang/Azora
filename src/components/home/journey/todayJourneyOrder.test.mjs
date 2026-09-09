import assert from 'node:assert/strict';
import test from 'node:test';
import {
  defaultTodayJourneyOrder,
  mergeVisibleTodayJourneyOrder,
  migrateLegacyTodayJourneyOrder,
  reconcileTodayJourneyOrder,
  removeTodayJourneyItem,
} from './todayJourneyOrder.ts';

const actions = { session: '18:00', handPicked: '12:00', checkIn: '20:00' };
const goal = (id, scheduledTime) => ({ id, scheduledTime, createdAt: id });

test('defaults put exercises before todos within each daypart', () => {
  assert.deepEqual(defaultTodayJourneyOrder(actions, [
    goal('evening', '21:00'),
    goal('morning', '07:00'),
    goal('afternoon', '13:00'),
  ]), [
    'todo:morning',
    'exercise:handPicked', 'todo:afternoon',
    'exercise:session',
    'exercise:checkIn', 'todo:evening',
  ]);
});

test('morning exercises precede earlier start-the-day todos', () => {
  assert.deepEqual(defaultTodayJourneyOrder(
    { session: '08:00', handPicked: '13:00', checkIn: '21:00' },
    [goal('start', '07:00'), goal('afternoon', '13:00'), goal('bedtime', '21:00')],
  ), [
    'exercise:session', 'todo:start',
    'exercise:handPicked', 'todo:afternoon',
    'exercise:checkIn', 'todo:bedtime',
  ]);
});

test('daypart boundary hours use the self-care daypart definitions', () => {
  assert.deepEqual(defaultTodayJourneyOrder(
    { session: '10:59', handPicked: '16:59', checkIn: '19:59' },
    [
      goal('start-boundary', '11:00'),
      goal('afternoon-boundary', '17:00'),
      goal('evening-boundary', '20:00'),
    ],
  ), [
    'exercise:session',
    'exercise:handPicked', 'todo:start-boundary',
    'exercise:checkIn', 'todo:afternoon-boundary',
    'todo:evening-boundary',
  ]);
});

test('exercises are chronological within a daypart with canonical equal-time ties', () => {
  const sameTimeActions = { session: '09:00', handPicked: '08:00', checkIn: '08:00' };
  assert.deepEqual(defaultTodayJourneyOrder(sameTimeActions, [
    goal('start', '07:00'),
  ]), [
    'exercise:handPicked', 'exercise:checkIn', 'exercise:session',
    'todo:start',
  ]);
});

test('todos are chronological within a daypart with stable equal-time ties', () => {
  assert.deepEqual(defaultTodayJourneyOrder(
    { session: '08:00', handPicked: '13:00', checkIn: '18:00' },
    [goal('late', '10:00'), goal('equal-first', '07:00'), goal('equal-second', '07:00')],
  ), [
    'exercise:session', 'todo:equal-first', 'todo:equal-second', 'todo:late',
    'exercise:handPicked', 'exercise:checkIn',
  ]);
});

test('untimed and malformed rows follow every valid daypart safely', () => {
  assert.deepEqual(defaultTodayJourneyOrder({
    session: '18:00',
    handPicked: 'not-a-time',
    checkIn: '25:00',
  }, [
    goal('untimed-first', null),
    goal('late', '23:00'),
    goal('invalid', '12:99'),
    goal('untimed-second', null),
    goal('early', '06:00'),
  ]), [
    'todo:early', 'exercise:session', 'todo:late',
    'exercise:handPicked', 'exercise:checkIn',
    'todo:untimed-first', 'todo:invalid', 'todo:untimed-second',
  ]);
});

test('an onboarding reset sentinel ignores stale legacy order', () => {
  const defaults = ['todo:morning', 'exercise:session', 'todo:evening'];
  assert.deepEqual(reconcileTodayJourneyOrder(
    [],
    defaults,
    ['checkIn', 'handPicked', 'session'],
    { evening: 0, morning: 1 },
  ), defaults);
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

test('a missing combined order is migrated once into its full initial baseline', () => {
  const defaults = ['exercise:session', 'todo:early', 'todo:late'];
  const initial = reconcileTodayJourneyOrder(null, defaults, null, {});
  assert.deepEqual(initial, defaults);
  assert.deepEqual(
    reconcileTodayJourneyOrder(initial, defaults, null, {}),
    initial,
  );
});

test('new todos append and keep that position when reconciled again', () => {
  const stored = ['exercise:session', 'todo:evening'];
  const afterCreate = reconcileTodayJourneyOrder(
    stored,
    ['exercise:session', 'todo:morning', 'todo:evening'],
    null,
    {},
  );
  assert.deepEqual(afterCreate, [
    'exercise:session', 'todo:evening', 'todo:morning',
  ]);
  assert.deepEqual(
    reconcileTodayJourneyOrder(
      afterCreate,
      ['exercise:session', 'todo:morning', 'todo:evening'],
      null,
      {},
    ),
    afterCreate,
  );
});

test('reconciliation retains temporarily absent recurring todos', () => {
  const stored = [
    'todo:visible', 'todo:weekday', 'exercise:session',
  ];
  const weekend = reconcileTodayJourneyOrder(
    stored,
    ['exercise:session', 'todo:visible'],
    null,
    {},
  );
  assert.deepEqual(weekend, stored);
  assert.deepEqual(reconcileTodayJourneyOrder(
    weekend,
    ['exercise:session', 'todo:visible', 'todo:weekday'],
    null,
    {},
  ), stored);
});

test('a confirmed archive explicitly removes its saved slot', () => {
  assert.deepEqual(removeTodayJourneyItem(
    ['todo:visible', 'todo:archived', 'exercise:session'],
    'todo:archived',
  ), ['todo:visible', 'exercise:session']);
});

test('time edits do not reorder IDs that are already stored', () => {
  const stored = ['exercise:session', 'todo:late', 'todo:early'];
  assert.deepEqual(reconcileTodayJourneyOrder(
    stored,
    ['exercise:session', 'todo:early', 'todo:late'],
    null,
    {},
  ), stored);
});
