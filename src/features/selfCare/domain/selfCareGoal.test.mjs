import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completedGoalsSummary,
  isSelfCareGoalDueOn,
  normalizeSelfCareGoalTitle,
  reorderedSelfCareGoalPlaces,
  selfCareGoalSortSeed,
  sortSelfCareGoals,
  COMPLETED_COLLAPSE_THRESHOLD,
  planSelfCareGoalList,
  resolveSelfCareGoalIcon,
} from './selfCareGoal.ts';

test('normalizes a goal title and rejects invalid values', () => {
  assert.equal(normalizeSelfCareGoalTitle('  Drink water  '), 'Drink water');
  assert.equal(normalizeSelfCareGoalTitle('   '), null);
  assert.equal(normalizeSelfCareGoalTitle('a'.repeat(121)), null);
});

test('scheduled goals run earliest first, untimed ones sink below', () => {
  const timed = (id, scheduledTime, createdAt) => ({
    id,
    title: id,
    createdAt,
    updatedAt: createdAt,
    completedToday: false,
    scheduledTime,
  });

  const goals = [
    timed('untimed-old', null, '2026-01-01'),
    timed('evening', '19:30', '2026-01-01'),
    timed('untimed-new', null, '2026-01-04'),
    timed('morning', '07:15', '2026-01-02'),
    timed('noon', '12:00', '2026-01-03'),
  ];

  assert.deepEqual(
    sortSelfCareGoals(goals).map((goal) => goal.id),
    ['morning', 'noon', 'evening', 'untimed-new', 'untimed-old'],
  );
});

test('sorts newest first and leaves completed goals where they are', () => {
  const goals = [
    { id: 'old-done', title: 'A', createdAt: '2026-01-01', updatedAt: '2026-01-01', completedToday: true, scheduledTime: null },
    { id: 'new-open', title: 'B', createdAt: '2026-01-04', updatedAt: '2026-01-04', completedToday: false, scheduledTime: null },
    { id: 'old-open', title: 'C', createdAt: '2026-01-02', updatedAt: '2026-01-02', completedToday: false, scheduledTime: null },
    { id: 'new-done', title: 'D', createdAt: '2026-01-03', updatedAt: '2026-01-03', completedToday: true, scheduledTime: null },
  ];

  assert.deepEqual(
    sortSelfCareGoals(goals).map((goal) => goal.id),
    ['new-open', 'new-done', 'old-open', 'old-done'],
  );
});

const goal = (id, completedToday) => ({
  id,
  scheduledTime: null,
  title: id,
  createdAt: id,
  updatedAt: id,
  completedToday,
});

test('a few completed goals stay on the rail, in place', () => {
  const list = planSelfCareGoalList([goal('a', true), goal('b', false)]);
  assert.deepEqual(
    list.rail.map((entry) => entry.id),
    ['b', 'a'],
  );
  assert.deepEqual(list.drawer, []);
});

test('completed goals collapse into the drawer past the threshold', () => {
  const completed = Array.from(
    { length: COMPLETED_COLLAPSE_THRESHOLD + 1 },
    (_, index) => goal(`done-${index}`, true),
  );
  const list = planSelfCareGoalList([...completed, goal('open', false)]);
  assert.deepEqual(
    list.rail.map((entry) => entry.id),
    ['open'],
  );
  assert.equal(list.drawer.length, COMPLETED_COLLAPSE_THRESHOLD + 1);
});

test('completedGoalsSummary counts one to-do in the singular', () => {
  assert.equal(completedGoalsSummary(1), '1 to-do done today!');
  assert.equal(completedGoalsSummary(4), '4 to-dos done today!');
});

const recurring = (recurrence) => ({
  id: recurrence,
  title: recurrence,
  recurrence,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  completedToday: false,
});

test('a daily to-do is due every day', () => {
  assert.equal(isSelfCareGoalDueOn(recurring('daily'), '2026-09-05', false), true);
  assert.equal(isSelfCareGoalDueOn(recurring('daily'), '2026-09-06', false), true);
});

test('a weekdays to-do skips Saturday and Sunday', () => {
  const weekdays = recurring('weekdays');
  assert.equal(isSelfCareGoalDueOn(weekdays, '2026-09-04', false), true);
  assert.equal(isSelfCareGoalDueOn(weekdays, '2026-09-05', false), false);
  assert.equal(isSelfCareGoalDueOn(weekdays, '2026-09-06', false), false);
  assert.equal(isSelfCareGoalDueOn(weekdays, '2026-09-07', false), true);
});

test('a once to-do stays until it is finished, then leaves', () => {
  const once = recurring('once');
  assert.equal(isSelfCareGoalDueOn(once, '2026-09-04', false), true);
  assert.equal(isSelfCareGoalDueOn(once, '2026-09-05', true), false);
});

test('an unreadable date shows the to-do rather than losing it', () => {
  assert.equal(isSelfCareGoalDueOn(recurring('weekdays'), 'not-a-date', false), true);
});

test('an hour seeds where a to-do starts on the list', () => {
  assert.equal(selfCareGoalSortSeed('07:15'), 435);
  assert.equal(selfCareGoalSortSeed(null), 1440);
  assert.equal(selfCareGoalSortSeed('nonsense'), 1440);
});

test('midnight never seeds below the first place', () => {
  assert.equal(selfCareGoalSortSeed('00:00'), 1);
});

const placed = (id, scheduledTime = null) => ({
  id,
  title: id,
  createdAt: id,
  updatedAt: id,
  completedToday: false,
  scheduledTime,
});

test('a to-do with no remembered place sits where its hour puts it', () => {
  const goals = [placed('evening', '19:30'), placed('morning', '07:15')];

  assert.deepEqual(
    sortSelfCareGoals(goals, {}).map((entry) => entry.id),
    ['morning', 'evening'],
  );
  assert.deepEqual(
    sortSelfCareGoals(goals, { evening: 1 }).map((entry) => entry.id),
    ['evening', 'morning'],
  );
});

test('a dragged to-do takes over the place of the one it displaced', () => {
  const goals = [placed('a'), placed('b'), placed('c')];
  const places = { a: 420, b: 780, c: 1080 };

  assert.deepEqual(reorderedSelfCareGoalPlaces(goals, places, ['c', 'a', 'b']), {
    c: 420,
    a: 780,
    b: 1080,
  });
  assert.deepEqual(
    reorderedSelfCareGoalPlaces(goals, places, ['a', 'b', 'c']),
    places,
  );
});

test('a to-do today is hiding keeps the place it had', () => {
  const goals = [placed('a'), placed('b')];
  const places = { a: 420, b: 780, hidden: 600 };

  assert.deepEqual(reorderedSelfCareGoalPlaces(goals, places, ['b', 'a']), {
    a: 780,
    b: 420,
    hidden: 600,
  });
});

test('to-dos sharing an hour are pushed apart so the new order sticks', () => {
  const goals = [placed('a', '07:00'), placed('b', '07:00'), placed('c', '07:00')];

  assert.deepEqual(reorderedSelfCareGoalPlaces(goals, {}, ['c', 'b', 'a']), {
    c: 420,
    b: 421,
    a: 422,
  });
});

test('an order that is not the list is refused rather than half applied', () => {
  const goals = [placed('a'), placed('b')];
  assert.equal(reorderedSelfCareGoalPlaces(goals, {}, ['a']), null);
  assert.equal(reorderedSelfCareGoalPlaces(goals, {}, ['a', 'z']), null);
});

test('a to-do written with a retired icon is drawn with the one that replaced it', () => {
  assert.equal(resolveSelfCareGoalIcon('heart-pulse'), 'walk');
  assert.equal(resolveSelfCareGoalIcon('walk'), 'walk');
});
