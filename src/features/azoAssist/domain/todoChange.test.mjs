import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseTodoChanges, removesRepeat, todoChangeDetail, todoRefsFor } from './todoChange.ts';

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
  const { refs, goalsByRef } = todoRefsFor(goals);
  assert.deepEqual(refs[0], { ref: 't1', title: 'Go to the gym', daypart: 'evening', minutes: 45, repeats: true, done: false });
  assert.equal(refs[2].done, true);
  assert.equal(goalsByRef.get('t2').id, 'mom');
});

test('a missing or older response has no changes', () => {
  const { goalsByRef } = todoRefsFor(goals);
  assert.deepEqual(parseTodoChanges(undefined, goalsByRef), []);
});

test('changes to unknown, done or repeated to-dos are dropped', () => {
  const { goalsByRef } = todoRefsFor(goals);
  const changes = parseTodoChanges([
    { ref: 't9', action: 'remove' },
    { ref: 't3', action: 'remove' },
    { ref: 't1', action: 'remove' },
    { ref: 't1', action: 'update', title: 'Gym class' },
    { ref: 't2', action: 'delete' },
  ], goalsByRef);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].goal.id, 'gym');
  assert.equal(removesRepeat(changes[0]), true);
  assert.equal(todoChangeDetail(changes[0]), 'Remove · Daily, so it leaves every day');
});

test('an update keeps the rest of the to-do and reads as what changes', () => {
  const { goalsByRef } = todoRefsFor(goals);
  const [change] = parseTodoChanges([{ ref: 't2', action: 'update', title: 'Call mom about Sunday', daypart: 'evening', minutes: 20 }], goalsByRef);
  assert.deepEqual(change.draft, {
    title: 'Call mom about Sunday',
    icon: 'dumbbell',
    recurrence: 'once',
    scheduledTime: '18:00',
    durationMinutes: 20,
  });
  assert.equal(todoChangeDetail(change), 'Was “Call mom” · Afternoon to Evening · 10 to 20 min');
  assert.equal(removesRepeat(change), false);
});

test('an update that changes nothing is dropped, and the same daypart keeps its exact hour', () => {
  const { goalsByRef } = todoRefsFor([goal({ id: 'walk', title: 'Walk', scheduledTime: '18:30' })]);
  assert.deepEqual(parseTodoChanges([{ ref: 't1', action: 'update', title: 'Walk', daypart: 'evening', minutes: 45 }], goalsByRef), []);
  assert.deepEqual(parseTodoChanges([{ ref: 't1', action: 'update', minutes: 999 }], goalsByRef), []);
});

test('removing a one-off reads as today only', () => {
  const { goalsByRef } = todoRefsFor(goals);
  const [change] = parseTodoChanges([{ ref: 't2', action: 'remove' }], goalsByRef);
  assert.equal(todoChangeDetail(change), 'Remove from today');
});
