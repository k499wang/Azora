import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRoutinePlayerSteps,
  createRoutinePlayerState,
  currentRoutineStep,
  isRoutinePlayerFinished,
  routineAllEndsAt,
  nextRoutineStep,
  routinePlayerReducer,
  routinePlayerSummary,
  routineStepAnnouncement,
  routineStepClock,
  routineStepMinutes,
  routineTimeOfDay,
} from './routinePlayer.ts';

function goal(id, overrides = {}) {
  return {
    id,
    title: `Goal ${id}`,
    icon: 'sparkle',
    recurrence: 'daily',
    recurrenceAnchorDate: '2026-10-01',
    scheduledTime: '07:00',
    durationMinutes: 5,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    completedToday: false,
    featuredToday: false,
    ...overrides,
  };
}

const play = (state, ...types) =>
  types.reduce((next, type) => routinePlayerReducer(next, { type }), state);

test('builds steps in the given order, skipping missing and already-done goals', () => {
  const goals = [goal('a'), goal('b', { completedToday: true }), goal('c')];
  const steps = buildRoutinePlayerSteps(goals, ['c', 'missing', 'b', 'a', 'c']);
  assert.deepEqual(steps.map((step) => step.id), ['c', 'a']);
});

test('complete and skip advance and record outcomes; skipped never counts as done', () => {
  const state = createRoutinePlayerState([goal('a'), goal('b'), goal('c')]);
  assert.equal(currentRoutineStep(state).id, 'a');
  assert.equal(nextRoutineStep(state).id, 'b');

  const afterOne = play(state, 'complete');
  assert.equal(currentRoutineStep(afterOne).id, 'b');
  assert.equal(nextRoutineStep(afterOne).id, 'c');

  const finished = play(afterOne, 'skip', 'complete');
  assert.equal(isRoutinePlayerFinished(finished), true);
  assert.equal(currentRoutineStep(finished), null);
  assert.equal(nextRoutineStep(finished), null);
  assert.deepEqual(routinePlayerSummary(finished), { done: 2, skipped: 1, total: 3, coins: 20, minutes: 10 });
  assert.equal(play(finished, 'complete'), finished);
});

test('minutes adjust per step and never fall below one', () => {
  const state = createRoutinePlayerState([goal('a', { durationMinutes: 2 }), goal('b')]);
  const longer = play(state, 'addMinute', 'addMinute');
  assert.equal(routineStepMinutes(longer, 0), 4);
  const floored = play(state, 'removeMinute', 'removeMinute', 'removeMinute');
  assert.equal(routineStepMinutes(floored, 0), 1);
  assert.equal(routineStepMinutes(play(longer, 'complete'), 1), 5);
});

test('an open-ended step has no length and ignores minute changes', () => {
  const state = createRoutinePlayerState([goal('a', { durationMinutes: null })]);
  assert.equal(routineStepMinutes(state, 0), null);
  assert.equal(play(state, 'addMinute'), state);
});

test('an empty routine is finished from the start', () => {
  const state = createRoutinePlayerState([]);
  assert.equal(isRoutinePlayerFinished(state), true);
  assert.deepEqual(routinePlayerSummary(state), { done: 0, skipped: 0, total: 0, coins: 0, minutes: 0 });
});

test('formats the clock', () => {
  assert.equal(routineStepClock(605), '10:05');
  assert.equal(routineStepClock(176), '02:56');
  assert.equal(routineStepClock(-3), '00:00');
});

test('all ends adds what is left of this step to the full length of the rest', () => {
  const now = new Date(2026, 9, 22, 4, 20).getTime();
  const state = play(
    createRoutinePlayerState([goal('a'), goal('b', { durationMinutes: 3 }), goal('c', { durationMinutes: 4 })]),
    'complete',
  );
  const longer = play(state, 'addMinute');
  assert.equal(routineAllEndsAt(longer, now, 90_000), now + 90_000 + 4 * 60_000);
  assert.equal(routineTimeOfDay(now + 10 * 60_000), '4:30am');
  assert.equal(routineTimeOfDay(new Date(2026, 9, 22, 0, 5).getTime()), '12:05am');
  assert.equal(routineTimeOfDay(new Date(2026, 9, 22, 13, 0).getTime()), '1:00pm');
});

test('all ends has no answer when any step left is open-ended', () => {
  const now = Date.now();
  const openNow = createRoutinePlayerState([goal('a', { durationMinutes: null }), goal('b')]);
  assert.equal(routineAllEndsAt(openNow, now, 0), null);
  const openLater = createRoutinePlayerState([goal('a'), goal('b', { durationMinutes: null })]);
  assert.equal(routineAllEndsAt(openLater, now, 60_000), null);
  assert.equal(routineAllEndsAt(play(openLater, 'complete', 'skip'), now, 0), null);
});

test('step announcement names the step and its length', () => {
  assert.equal(routineStepAnnouncement({ title: 'Make bed' }, 2, false), 'Make bed. 2 minutes.');
  assert.equal(routineStepAnnouncement({ title: 'Skincare' }, 1, false), 'Skincare. 1 minute.');
  assert.equal(routineStepAnnouncement({ title: 'Journal' }, null, false), 'Journal.');
  assert.equal(routineStepAnnouncement({ title: 'Stretch!' }, 3, true), 'Last one. Stretch. 3 minutes.');
});

test('the summary earns each finished step its recurrence coins and leaves minutes out when one had no length', () => {
  const state = createRoutinePlayerState([
    goal('a', { recurrence: 'weekly' }),
    goal('b', { durationMinutes: null }),
    goal('c'),
  ]);
  const finished = play(state, 'complete', 'complete', 'skip');
  assert.deepEqual(routinePlayerSummary(finished), {
    done: 2,
    skipped: 1,
    total: 3,
    coins: 30,
    minutes: null,
  });
});

test('rearranging moves only the steps not yet finished', () => {
  const state = play(
    createRoutinePlayerState([goal('a'), goal('b'), goal('c'), goal('d')]),
    'complete',
  );
  const moved = routinePlayerReducer(state, { type: 'moveUpcoming', from: 3, to: 2 });
  assert.deepEqual(moved.steps.map((step) => step.id), ['a', 'b', 'd', 'c']);
  assert.equal(currentRoutineStep(moved).id, 'b');
  assert.equal(nextRoutineStep(moved).id, 'd');
  assert.deepEqual(moved.outcomes, ['done', null, null, null]);

  const swapped = routinePlayerReducer(state, { type: 'moveUpcoming', from: 2, to: 1 });
  assert.equal(currentRoutineStep(swapped).id, 'c');
  assert.equal(nextRoutineStep(swapped).id, 'b');
  assert.equal(routinePlayerReducer(state, { type: 'moveUpcoming', from: 0, to: 3 }), state);
  assert.equal(routinePlayerReducer(state, { type: 'moveUpcoming', from: 1, to: 0 }), state);
  assert.equal(routinePlayerReducer(state, { type: 'moveUpcoming', from: 3, to: 4 }), state);
});

test('a moved step keeps its extra minutes', () => {
  const state = createRoutinePlayerState([goal('a'), goal('b'), goal('c')]);
  const longer = { ...state, extraMinutes: [0, 0, 3] };
  const moved = routinePlayerReducer(longer, { type: 'moveUpcoming', from: 2, to: 1 });
  assert.deepEqual(moved.extraMinutes, [0, 3, 0]);
  assert.equal(routineStepMinutes(moved, 1), 8);
});
