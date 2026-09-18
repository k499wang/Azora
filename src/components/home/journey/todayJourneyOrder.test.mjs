import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOOD_JOURNEY_ID,
  LESSON_JOURNEY_ID,
  defaultTodayJourneyOrder,
  mergeVisibleTodayJourneyOrder,
  migrateLegacyTodayJourneyOrder,
  reconcileTodayJourneyOrder,
  removeTodayJourneyItem,
} from './todayJourneyOrder.ts';

const actions = { session: '18:00', handPicked: '12:00', windDown: '20:00' };
const goal = (id, scheduledTime) => ({ id, scheduledTime, createdAt: id });

test('defaults put exercises before todos within each daypart', () => {
  assert.deepEqual(defaultTodayJourneyOrder(actions, [
    goal('evening', '21:00'),
    goal('morning', '07:00'),
    goal('afternoon', '13:00'),
  ]), [
    MOOD_JOURNEY_ID,
    'todo:morning',
    'exercise:handPicked', 'todo:afternoon',
    'exercise:session',
    'exercise:windDown', 'todo:evening',
  ]);
});

test('morning exercises precede earlier start-the-day todos', () => {
  assert.deepEqual(defaultTodayJourneyOrder(
    { session: '08:00', handPicked: '13:00', windDown: '21:00' },
    [goal('start', '07:00'), goal('afternoon', '13:00'), goal('bedtime', '21:00')],
  ), [
    MOOD_JOURNEY_ID,
    'exercise:session', 'todo:start',
    'exercise:handPicked', 'todo:afternoon',
    'exercise:windDown', 'todo:bedtime',
  ]);
});

test('daypart boundary hours use the self-care daypart definitions', () => {
  assert.deepEqual(defaultTodayJourneyOrder(
    { session: '10:59', handPicked: '16:59', windDown: '19:59' },
    [
      goal('start-boundary', '11:00'),
      goal('afternoon-boundary', '17:00'),
      goal('evening-boundary', '20:00'),
    ],
  ), [
    MOOD_JOURNEY_ID,
    'exercise:session',
    'exercise:handPicked', 'todo:start-boundary',
    'exercise:windDown', 'todo:afternoon-boundary',
    'todo:evening-boundary',
  ]);
});

test('exercises are chronological within a daypart with canonical equal-time ties', () => {
  const sameTimeActions = {
    session: '08:00',
    handPicked: '08:00',
    windDown: '08:00',
  };
  assert.deepEqual(defaultTodayJourneyOrder(sameTimeActions, [
    goal('start', '07:00'),
  ]), [
    MOOD_JOURNEY_ID,
    'exercise:session', 'exercise:handPicked', 'exercise:windDown',
    'todo:start',
  ]);
});

test('todos are chronological within a daypart with stable equal-time ties', () => {
  assert.deepEqual(defaultTodayJourneyOrder(
    { session: '08:00', handPicked: '13:00', windDown: '21:00' },
    [goal('late', '10:00'), goal('equal-first', '07:00'), goal('equal-second', '07:00')],
  ), [
    MOOD_JOURNEY_ID,
    'exercise:session', 'todo:equal-first', 'todo:equal-second', 'todo:late',
    'exercise:handPicked', 'exercise:windDown',
  ]);
});

test('untimed and malformed rows follow every valid daypart safely', () => {
  assert.deepEqual(defaultTodayJourneyOrder({
    session: '18:00',
    handPicked: 'not-a-time',
    windDown: '25:00',
  }, [
    goal('untimed-first', null),
    goal('late', '23:00'),
    goal('invalid', '12:99'),
    goal('untimed-second', null),
    goal('early', '06:00'),
  ]), [
    MOOD_JOURNEY_ID,
    'todo:early', 'exercise:session', 'todo:late',
    'exercise:handPicked', 'exercise:windDown',
    'todo:untimed-first', 'todo:invalid', 'todo:untimed-second',
  ]);
});

test('an onboarding reset sentinel ignores stale legacy order', () => {
  const defaults = ['todo:morning', 'exercise:session', 'todo:evening'];
  assert.deepEqual(reconcileTodayJourneyOrder(
    [],
    defaults,
    ['handPicked', 'session'],
    { evening: 0, morning: 1 },
  ), defaults);
});

test('cross-type moves preserve hidden row placement', () => {
  assert.deepEqual(mergeVisibleTodayJourneyOrder(
    ['exercise:session', 'todo:hidden', 'todo:a', 'exercise:handPicked'],
    ['todo:a', 'exercise:handPicked', 'exercise:session'],
  ), ['todo:a', 'todo:hidden', 'exercise:handPicked', 'exercise:session']);
});

test('legacy daily ordering is retained during mixed-order migration', () => {
  const defaults = ['exercise:session', 'todo:a', 'exercise:handPicked'];
  assert.deepEqual(migrateLegacyTodayJourneyOrder(
    defaults,
    ['handPicked', 'session'],
    {},
  ), ['exercise:handPicked', 'todo:a', 'exercise:session']);
});

test('absent legacy preferences preserve chronological defaults', () => {
  const defaults = [
    'exercise:handPicked', 'exercise:session',
    'todo:early', 'todo:late',
  ];
  assert.deepEqual(
    migrateLegacyTodayJourneyOrder(defaults, null, {}),
    defaults,
  );
});

test('an explicitly stored canonical legacy order still overrides defaults', () => {
  const defaults = [
    'exercise:handPicked', 'exercise:session',
    'todo:early', 'todo:late',
  ];
  assert.deepEqual(migrateLegacyTodayJourneyOrder(
    defaults,
    ['session', 'handPicked'],
    {},
  ), [
    'exercise:session', 'exercise:handPicked',
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


/**
 * The check-in leads the day by default: it is the one row that asks a question
 * rather than asking for work, and answering it first is what lets the rest of
 * the day be about what it found. It is a default, not a rule — the row drags
 * like any other, and the arrangement is what is stored.
 */
test('the daily check-in leads the default order', () => {
  const order = defaultTodayJourneyOrder(actions, [goal('morning', '07:00')]);

  assert.equal(order[0], MOOD_JOURNEY_ID);
  assert.equal(order.filter((id) => id === MOOD_JOURNEY_ID).length, 1);
});

test('a saved arrangement keeps the check-in where the user put it', () => {
  const defaults = defaultTodayJourneyOrder(actions, [goal('morning', '07:00')]);
  const moved = [...defaults.filter((id) => id !== MOOD_JOURNEY_ID), MOOD_JOURNEY_ID];

  assert.deepEqual(
    reconcileTodayJourneyOrder(moved, defaults, null, {}),
    moved,
  );
});

test('the rows with no hour lead the day, in their own order', () => {
  const order = defaultTodayJourneyOrder(
    { session: '07:00', handPicked: '13:00', windDown: '21:00' },
    [],
    [LESSON_JOURNEY_ID, MOOD_JOURNEY_ID],
  );
  // Given in the wrong order on purpose: the caller says what exists today,
  // the list says where it goes. The check-in asks a question, so it leads.
  assert.deepEqual(order.slice(0, 2), [MOOD_JOURNEY_ID, LESSON_JOURNEY_ID]);
  assert.equal(order[2], 'exercise:session');
});

test('a day with no lesson has no lesson row in its baseline', () => {
  // The baseline is what a saved arrangement is reconciled against, so a row
  // that is not on screen must not take a place in it.
  const order = defaultTodayJourneyOrder(
    { session: '07:00', handPicked: '13:00', windDown: '21:00' },
    [],
    [MOOD_JOURNEY_ID],
  );
  assert.equal(order.includes(LESSON_JOURNEY_ID), false);
  assert.equal(order[0], MOOD_JOURNEY_ID);
});

test('a day that asks for nothing untimed still orders its exercises', () => {
  const order = defaultTodayJourneyOrder(
    { session: '07:00', handPicked: '13:00', windDown: '21:00' },
    [],
    [],
  );
  assert.deepEqual(order, [
    'exercise:session',
    'exercise:handPicked',
    'exercise:windDown',
  ]);
});

test('an untimed row nobody placed sorts last among them, never nowhere', () => {
  const order = defaultTodayJourneyOrder(
    { session: '07:00', handPicked: '13:00', windDown: '21:00' },
    [],
    ['unplaced:today', MOOD_JOURNEY_ID, LESSON_JOURNEY_ID],
  );
  assert.deepEqual(order.slice(0, 3), [
    MOOD_JOURNEY_ID,
    LESSON_JOURNEY_ID,
    'unplaced:today',
  ]);
});
