import test from 'node:test';
import assert from 'node:assert/strict';
import { planCalendar } from './planCalendar.ts';
import {
  isPlanWeekLocked,
  pathCelebration,
  pathReached,
} from './pathCelebration.ts';

const PLAN = 'night';

test('a first view has nothing to celebrate once seeded with where the path is', () => {
  for (const [done, finishedToday] of [[0, false], [3, false], [3, true]]) {
    const calendar = planCalendar(PLAN, done, finishedToday);
    assert.deepEqual(pathCelebration(pathReached(calendar, true), calendar, true), {
      stampDay: null,
      wakeDay: null,
      wakeTrail: false,
    });
  }
});

test('finishing today stamps that day and wakes nothing until the calendar turns', () => {
  const before = pathReached(planCalendar(PLAN, 2, false), true);
  const after = planCalendar(PLAN, 3, true);
  assert.deepEqual(pathCelebration(before, after, true), {
    stampDay: 3,
    wakeDay: null,
    wakeTrail: false,
  });
});

test('the next day wakes on the next visit without stamping again', () => {
  const seen = pathReached(planCalendar(PLAN, 3, true), true);
  const nextDay = planCalendar(PLAN, 3, false);
  assert.deepEqual(pathCelebration(seen, nextDay, true), {
    stampDay: null,
    wakeDay: 4,
    wakeTrail: true,
  });
});

test('a missed visit stamps only the latest day, then wakes the one after', () => {
  const seen = pathReached(planCalendar(PLAN, 1, false), true);
  const calendar = planCalendar(PLAN, 4, false);
  assert.deepEqual(pathCelebration(seen, calendar, true), {
    stampDay: 4,
    wakeDay: 5,
    wakeTrail: true,
  });
});

test('the first day of a week wakes with no trail leading into it', () => {
  const seen = pathReached(planCalendar(PLAN, 7, true), true);
  const calendar = planCalendar(PLAN, 7, false);
  assert.deepEqual(pathCelebration(seen, calendar, true), {
    stampDay: null,
    wakeDay: 8,
    wakeTrail: false,
  });
});

test('locked weeks are never celebrated', () => {
  const seen = pathReached(planCalendar(PLAN, 6, false), true);
  const calendar = planCalendar(PLAN, 8, false);
  assert.deepEqual(pathCelebration(seen, calendar, false), {
    stampDay: null,
    wakeDay: null,
    wakeTrail: false,
  });
  assert.equal(pathCelebration(seen, calendar, true).stampDay, 8);
  assert.equal(isPlanWeekLocked(1, false), false);
  assert.equal(isPlanWeekLocked(2, false), true);
  assert.equal(isPlanWeekLocked(2, true), false);
});

test('a rewound record replays exactly one stamp and one wake', () => {
  const calendar = planCalendar(PLAN, 4, false);
  const reached = pathReached(calendar, true);
  const rewound = { stampedDay: reached.stampedDay - 1, wokenDay: reached.wokenDay - 1 };
  assert.deepEqual(pathCelebration(rewound, calendar, true), {
    stampDay: 4,
    wakeDay: 5,
    wakeTrail: true,
  });
});

test('a locked day is not marked woken, so buying Pro later wakes it', () => {
  const calendar = planCalendar(PLAN, 7, false);
  const reached = pathReached(calendar, false);
  assert.deepEqual(reached, { stampedDay: 7, wokenDay: 7 });
  assert.equal(pathCelebration(reached, calendar, false).wakeDay, null);
  assert.deepEqual(pathCelebration(reached, calendar, true), {
    stampDay: null,
    wakeDay: 8,
    wakeTrail: false,
  });
});

test('an open day is marked woken once reached', () => {
  assert.deepEqual(pathReached(planCalendar(PLAN, 7, false), true), { stampedDay: 7, wokenDay: 8 });
  assert.deepEqual(pathReached(planCalendar(PLAN, 4, false), false), { stampedDay: 4, wokenDay: 5 });
  assert.deepEqual(pathReached(planCalendar(PLAN, 4, true), false), { stampedDay: 4, wokenDay: 4 });
});

test('a stamp saved on its own leaves only the wake to replay', () => {
  const calendar = planCalendar(PLAN, 5, false);
  const afterStamp = { stampedDay: 5, wokenDay: 5 };
  assert.deepEqual(pathCelebration(afterStamp, calendar, true), {
    stampDay: null,
    wakeDay: 6,
    wakeTrail: true,
  });
  const afterWake = { stampedDay: 5, wokenDay: 6 };
  assert.deepEqual(pathCelebration(afterWake, calendar, true), {
    stampDay: null,
    wakeDay: null,
    wakeTrail: false,
  });
});
