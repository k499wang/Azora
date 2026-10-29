import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selfCareGoalStartIso } from '../../selfCare/domain/selfCareGoalStartDay.ts';
import { parseTodoChanges, removesRepeat, todoChangeDetail, todoRefsFor } from './todoChange.ts';

const TODAY = '2026-10-29';

const goal = (overrides) => ({
  id: 'g',
  title: 'Go to the gym',
  icon: 'dumbbell',
  recurrence: 'daily',
  recurrenceAnchorDate: '2026-10-01',
  scheduledTime: '18:00',
  durationMinutes: 45,
  createdAt: '',
  updatedAt: '',
  completedToday: false,
  featuredToday: false,
  ...overrides,
});

const goals = [
  goal({ id: 'gym' }),
  goal({ id: 'mom', title: 'Call mom', recurrence: 'once', scheduledTime: '13:00', durationMinutes: 10 }),
  goal({ id: 'bed', title: 'Make the bed', scheduledTime: '07:00', completedToday: true }),
];

test('refs describe today’s list for Azo', () => {
  const { refs, goalsByRef } = todoRefsFor(goals, TODAY);
  assert.deepEqual(refs[0], { ref: 't1', title: 'Go to the gym', daypart: 'evening', minutes: 45, repeats: true, done: false, day: null });
  assert.equal(refs[2].done, true);
  assert.equal(goalsByRef.get('t2').id, 'mom');
});

test('a missing or older response has no changes', () => {
  const { goalsByRef } = todoRefsFor(goals, TODAY);
  assert.deepEqual(parseTodoChanges(undefined, goalsByRef, TODAY), []);
});

test('changes to unknown, done or repeated to-dos are dropped', () => {
  const { goalsByRef } = todoRefsFor(goals, TODAY);
  const changes = parseTodoChanges([
    { ref: 't9', action: 'remove' },
    { ref: 't3', action: 'remove' },
    { ref: 't1', action: 'remove' },
    { ref: 't1', action: 'update', title: 'Gym class' },
    { ref: 't2', action: 'delete' },
  ], goalsByRef, TODAY);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].goal.id, 'gym');
  assert.equal(removesRepeat(changes[0]), true);
  assert.equal(todoChangeDetail(changes[0], TODAY), 'Remove · Daily, so it leaves every day');
});

test('an update keeps the rest of the to-do and reads as what changes', () => {
  const { goalsByRef } = todoRefsFor(goals, TODAY);
  const [change] = parseTodoChanges([{ ref: 't2', action: 'update', title: 'Call mom about Sunday', daypart: 'evening', minutes: 20 }], goalsByRef, TODAY);
  assert.deepEqual(change.draft, {
    title: 'Call mom about Sunday',
    icon: 'dumbbell',
    recurrence: 'once',
    scheduledTime: '18:00',
    durationMinutes: 20,
  });
  assert.equal(todoChangeDetail(change, TODAY), 'Was “Call mom” · Afternoon to Evening · 10 to 20 min');
  assert.equal(removesRepeat(change), false);
});

test('an update that changes nothing is dropped, and the same daypart keeps its exact hour', () => {
  const { goalsByRef } = todoRefsFor([goal({ id: 'walk', title: 'Walk', scheduledTime: '18:30' })], TODAY);
  assert.deepEqual(parseTodoChanges([{ ref: 't1', action: 'update', title: 'Walk', daypart: 'evening', minutes: 45 }], goalsByRef, TODAY), []);
  assert.deepEqual(parseTodoChanges([{ ref: 't1', action: 'update', minutes: 999 }], goalsByRef, TODAY), []);
});

test('removing a one-off reads as today only', () => {
  const { goalsByRef } = todoRefsFor(goals, TODAY);
  const [change] = parseTodoChanges([{ ref: 't2', action: 'remove' }], goalsByRef, TODAY);
  assert.equal(todoChangeDetail(change, TODAY), 'Remove from today');
});

test('a planned to-do is sent with its day, and a change can move it', () => {
  const planned = goal({ id: 'mop', title: 'Mop floors', recurrence: 'once', createdAt: selfCareGoalStartIso('2026-11-01') });
  const { refs, goalsByRef } = todoRefsFor([...goals, planned], TODAY);
  assert.equal(refs[3].day, '2026-11-01');
  const [moved] = parseTodoChanges([{ ref: 't4', action: 'update', day: '2026-10-31' }], goalsByRef, TODAY);
  assert.equal(moved.draft.startsOn, '2026-10-31');
  assert.equal(todoChangeDetail(moved, TODAY), 'Sun, Nov 1 to Sat, Oct 31');
  const [back] = parseTodoChanges([{ ref: 't4', action: 'update', day: TODAY }], goalsByRef, TODAY);
  assert.equal(back.draft.startsOn, null);
  const [removed] = parseTodoChanges([{ ref: 't4', action: 'remove' }], goalsByRef, TODAY);
  assert.equal(todoChangeDetail(removed, TODAY), 'Remove from Sun, Nov 1');
});

test('a day on a repeat, too far out, or where it already is changes nothing', () => {
  const { goalsByRef } = todoRefsFor(goals, TODAY);
  assert.deepEqual(parseTodoChanges([{ ref: 't1', action: 'update', day: '2026-10-31' }], goalsByRef, TODAY), []);
  assert.deepEqual(parseTodoChanges([{ ref: 't2', action: 'update', day: '2026-11-20' }], goalsByRef, TODAY), []);
  assert.deepEqual(parseTodoChanges([{ ref: 't2', action: 'update', day: TODAY }], goalsByRef, TODAY), []);
});
