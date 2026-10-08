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
    assert.deepEqual(pathCelebration(pathReached(calendar), calendar, true), {
      stampDay: null,
      wakeDay: null,
      wakeTrail: false,
    });
  }
});

test('finishing today stamps that day and wakes nothing until the calendar turns', () => {
  const before = pathReached(planCalendar(PLAN, 2, false));
  const after = planCalendar(PLAN, 3, true);
  assert.deepEqual(pathCelebration(before, after, true), {
    stampDay: 3,
    wakeDay: null,
    wakeTrail: false,
  });
});

test('the next day wakes on the next visit without stamping again', () => {
  const seen = pathReached(planCalendar(PLAN, 3, true));
  const nextDay = planCalendar(PLAN, 3, false);
  assert.deepEqual(pathCelebration(seen, nextDay, true), {
    stampDay: null,
    wakeDay: 4,
    wakeTrail: true,
  });
});

test('a missed visit stamps only the latest day, then wakes the one after', () => {
  const seen = pathReached(planCalendar(PLAN, 1, false));
  const calendar = planCalendar(PLAN, 4, false);
  assert.deepEqual(pathCelebration(seen, calendar, true), {
    stampDay: 4,
    wakeDay: 5,
    wakeTrail: true,
  });
});

test('the first day of a week wakes with no trail leading into it', () => {
  const seen = pathReached(planCalendar(PLAN, 7, true));
  const calendar = planCalendar(PLAN, 7, false);
  assert.deepEqual(pathCelebration(seen, calendar, true), {
    stampDay: null,
    wakeDay: 8,
    wakeTrail: false,
  });
});

test('locked weeks are never celebrated', () => {
  const seen = pathReached(planCalendar(PLAN, 6, false));
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
  const reached = pathReached(calendar);
  const rewound = { stampedDay: reached.stampedDay - 1, wokenDay: reached.wokenDay - 1 };
  assert.deepEqual(pathCelebration(rewound, calendar, true), {
    stampDay: 4,
    wakeDay: 5,
    wakeTrail: true,
  });
});
