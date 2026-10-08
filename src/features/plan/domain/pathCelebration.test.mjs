import test from 'node:test';
import assert from 'node:assert/strict';
import { planCalendar } from './planCalendar.ts';
import {
  NO_CELEBRATION,
  celebrationLook,
  celebrationPhases,
  celebrationTarget,
  centreScroll,
  isPlanWeekLocked,
  isWithin,
  pathCelebration,
  pathReached,
  pendingPathCelebration,
  revealScroll,
  seenAfterCelebration,
  seenAfterPhase,
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

/** Plays the first `count` phases the way the path does, saving each part as it plays. */
function playPhases(seen, calendar, isPro, count = Infinity) {
  const pending = pendingPathCelebration(seen, calendar, isPro, false);
  return celebrationPhases(pending)
    .slice(0, count)
    .reduce((record, phase) => seenAfterPhase(record, pending, phase), seen);
}

const STAMP_AND_WAKE = {
  seen: { stampedDay: 4, wokenDay: 5 },
  calendar: planCalendar(PLAN, 5, false),
};

test('a stamp and a wake play in order, and only the trail into a mid-week day draws', () => {
  const { seen, calendar } = STAMP_AND_WAKE;
  const pending = pendingPathCelebration(seen, calendar, true, false);
  assert.deepEqual(celebrationPhases(pending), ['stampRise', 'stampLand', 'wakeTrail', 'wakePop']);
  assert.equal(celebrationTarget(pending), 5);
  assert.deepEqual(
    celebrationPhases(pathCelebration({ stampedDay: 7, wokenDay: 7 }, planCalendar(PLAN, 7, false), true)),
    ['wakePop'],
  );
  assert.deepEqual(celebrationPhases(NO_CELEBRATION), []);
  assert.equal(celebrationTarget(NO_CELEBRATION), null);
});

test('a first view and reduced motion have nothing pending', () => {
  const { seen, calendar } = STAMP_AND_WAKE;
  assert.deepEqual(pendingPathCelebration(null, calendar, true, false), NO_CELEBRATION);
  assert.deepEqual(pendingPathCelebration(seen, calendar, true, true), NO_CELEBRATION);
});

test('a part that played is never pending again, wherever the run stopped', () => {
  const { seen, calendar } = STAMP_AND_WAKE;
  const phases = celebrationPhases(pendingPathCelebration(seen, calendar, true, false));
  for (let played = 0; played <= phases.length; played += 1) {
    const left = pendingPathCelebration(playPhases(seen, calendar, true, played), calendar, true, false);
    const done = phases.slice(0, played);
    if (done.includes('stampLand')) assert.equal(left.stampDay, null);
    if (done.includes('wakePop')) assert.equal(left.wakeDay, null);
  }
});

test('leaving before the stamp lands replays the stamp and the wake next time', () => {
  const { seen, calendar } = STAMP_AND_WAKE;
  const record = playPhases(seen, calendar, true, 1);
  assert.deepEqual(record, seen);
  assert.deepEqual(celebrationPhases(pendingPathCelebration(record, calendar, true, false)), [
    'stampRise',
    'stampLand',
    'wakeTrail',
    'wakePop',
  ]);
});

test('leaving after the stamp lands but before the wake replays only the wake', () => {
  const { seen, calendar } = STAMP_AND_WAKE;
  for (const played of [2, 3]) {
    const pending = pendingPathCelebration(playPhases(seen, calendar, true, played), calendar, true, false);
    assert.deepEqual(pending, { stampDay: null, wakeDay: 6, wakeTrail: true });
    assert.deepEqual(celebrationPhases(pending), ['wakeTrail', 'wakePop']);
  }
});

test('running again with the same inputs after a full run does nothing', () => {
  const { seen, calendar } = STAMP_AND_WAKE;
  const record = playPhases(seen, calendar, true);
  assert.deepEqual(record, pathReached(calendar, true));
  assert.deepEqual(pendingPathCelebration(record, calendar, true, false), NO_CELEBRATION);
  assert.deepEqual(playPhases(record, calendar, true), record);
});

test('a held celebration keeps its waiting look and plays once after release', () => {
  const { seen, calendar } = STAMP_AND_WAKE;
  const pending = pendingPathCelebration(seen, calendar, true, false);
  const held = celebrationLook({ ...pending, phase: null });
  assert.deepEqual(held, { unstampedDay: 5, sleepingDay: 6, drawingDay: null });
  // Holding writes nothing, so the same look and the same run are still owed.
  assert.deepEqual(pendingPathCelebration(seen, calendar, true, false), pending);
  const record = playPhases(seen, calendar, true);
  assert.deepEqual(pendingPathCelebration(record, calendar, true, false), NO_CELEBRATION);
  assert.deepEqual(celebrationLook(null), { unstampedDay: null, sleepingDay: null, drawingDay: null });
});

test('each phase draws the stamp and the wake from where the last one left them', () => {
  const show = (phase) => celebrationLook({ stampDay: 5, wakeDay: 6, wakeTrail: true, phase });
  assert.deepEqual(show('stampRise'), { unstampedDay: 5, sleepingDay: 6, drawingDay: null });
  assert.deepEqual(show('stampLand'), { unstampedDay: null, sleepingDay: 6, drawingDay: null });
  assert.deepEqual(show('wakeTrail'), { unstampedDay: null, sleepingDay: 6, drawingDay: 6 });
  assert.deepEqual(show('wakePop'), { unstampedDay: null, sleepingDay: null, drawingDay: null });
});

test('a node wholly inside the uncovered window is not scrolled to', () => {
  const window = { top: 100, bottom: 700 };
  assert.equal(revealScroll({ y: 300, height: 80 }, window), 0);
  assert.equal(isWithin({ y: 300, height: 80 }, window), true);
  assert.equal(revealScroll({ y: 90, height: 80 }, window), 90 + 40 - 400);
  assert.equal(revealScroll({ y: 650, height: 80 }, window), 650 + 40 - 400);
  assert.equal(isWithin({ y: 650, height: 80 }, window), false);
  assert.equal(isWithin({ y: 300, height: 0 }, window), false);
});

test('a moving node is centred even when it is already inside the window', () => {
  const window = { top: 100, bottom: 700 };
  assert.equal(centreScroll({ y: 300, height: 80 }, window), 300 + 40 - 400);
  assert.equal(centreScroll({ y: 650, height: 80 }, window), revealScroll({ y: 650, height: 80 }, window));
});

test('a celebration cut short at the hold limit ends where a full run would, wherever it stopped', () => {
  const { seen, calendar } = STAMP_AND_WAKE;
  const pending = pendingPathCelebration(seen, calendar, true, false);
  const full = playPhases(seen, calendar, true);
  for (let played = 0; played <= celebrationPhases(pending).length; played += 1) {
    assert.deepEqual(seenAfterCelebration(playPhases(seen, calendar, true, played), pending), full);
  }
  assert.deepEqual(pendingPathCelebration(full, calendar, true, false), NO_CELEBRATION);
});

test('ending a stamp-only celebration leaves the woken day alone, and nothing pending changes nothing', () => {
  const seen = pathReached(planCalendar(PLAN, 2, false), true);
  const calendar = planCalendar(PLAN, 3, true);
  const pending = pathCelebration(seen, calendar, true);
  assert.deepEqual(seenAfterCelebration(seen, pending), { stampedDay: 3, wokenDay: seen.wokenDay });
  assert.equal(seenAfterCelebration(seen, NO_CELEBRATION), seen);
});
