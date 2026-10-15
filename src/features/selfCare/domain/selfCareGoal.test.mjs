import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isSelfCareGoalDueOn,
  normalizeSelfCareGoalTitle,
  reorderedSelfCareGoalPlaces,
  selfCareGoalSortSeed,
  sortSelfCareGoals,
  planSelfCareGoalList,
  leavingSelfCareGoalIds,
  selfCareGoalTargetOpacity,
  resolveSelfCareGoalIcon,
  selfCareGoalRecurrenceLabel,
  selfCareGoalScheduleLabel,
  sortSelfCareGoalsByCreated,
  selfCareGoalWeeklyDayLabel,
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

const ids = (list) => list.map((entry) => entry.id);

test('open goals are listed in order', () => {
  const goals = [goal('a', false), goal('b', false)];
  assert.deepEqual(ids(planSelfCareGoalList(goals)), ids(sortSelfCareGoals(goals)));
});

test('a finished goal that has settled leaves the list', () => {
  assert.deepEqual(ids(planSelfCareGoalList([goal('a', true), goal('b', false)])), ['b']);
});

test('a finished goal still settling stays on the list', () => {
  const list = planSelfCareGoalList([goal('a', true), goal('b', false)], {}, new Set(['a']));
  assert.deepEqual(ids(list).sort(), ['a', 'b']);
});

test('an un-ticked goal returns to the list', () => {
  const before = planSelfCareGoalList([goal('a', true), goal('b', false)]);
  const after = planSelfCareGoalList([goal('a', false), goal('b', false)]);
  assert.deepEqual(ids(before), ['b']);
  assert.deepEqual(ids(after).sort(), ['a', 'b']);
});

test('every goal finished leaves an empty list', () => {
  assert.deepEqual(planSelfCareGoalList([goal('a', true), goal('b', true)]), []);
});

const recurring = (recurrence) => ({
  id: recurrence,
  title: recurrence,
  recurrence,
  recurrenceAnchorDate: '2026-09-06',
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

test('a weekly to-do starts today and returns every seven days', () => {
  const weekly = recurring('weekly');
  assert.equal(isSelfCareGoalDueOn(weekly, '2026-09-06', false), true);
  assert.equal(isSelfCareGoalDueOn(weekly, '2026-09-07', false), false);
  assert.equal(isSelfCareGoalDueOn(weekly, '2026-09-13', false), true);
});

test('a weekly to-do has a weekly label', () => {
  assert.equal(selfCareGoalRecurrenceLabel('weekly'), 'Weekly');
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

const routineGoal = (id, recurrence, scheduledTime = null, createdAt = '2026-01-01') => ({
  id,
  title: id,
  icon: 'sparkle',
  recurrence,
  recurrenceAnchorDate: '2026-01-04',
  scheduledTime,
  createdAt,
  updatedAt: createdAt,
  completedToday: false,
  featuredToday: false,
});

test('the routine keeps creation order whatever its repeats and hours are', () => {
  const sorted = sortSelfCareGoalsByCreated([
    routineGoal('newest', 'daily', '07:00', '2026-03-01T00:00:00Z'),
    routineGoal('oldest', 'once', null, '2026-01-01T00:00:00Z'),
    routineGoal('middle', 'weekly', '21:00', '2026-02-01T00:00:00Z'),
  ]);

  assert.deepEqual(sorted.map((goal) => goal.id), ['oldest', 'middle', 'newest']);
});

test('a weekly to-do lands on the weekday its cadence began', () => {
  assert.equal(selfCareGoalWeeklyDayLabel('2026-01-04'), 'Sundays');
  assert.equal(selfCareGoalWeeklyDayLabel('2026-01-09'), 'Fridays');
  assert.equal(selfCareGoalWeeklyDayLabel('not-a-date'), null);
});

test('the schedule line names the repeat, and a weekly one its weekday', () => {
  assert.equal(selfCareGoalScheduleLabel(routineGoal('w', 'weekly', '18:00')), 'Sundays · Evening');
  assert.equal(selfCareGoalScheduleLabel(routineGoal('d', 'daily', '07:00')), 'Daily · Start the day');
  assert.equal(selfCareGoalScheduleLabel(routineGoal('o', 'once')), 'Once · Any time');
});


test('read-only days show every goal even after it has settled', () => {
  const goals = [goal('a', true), goal('b', false), goal('c', true)];
  assert.deepEqual(planSelfCareGoalList(goals, {}, new Set(), true), goals);
});

test('only completed goals in the leaving phase target zero opacity', () => {
  const goals = [goal('holding', true), goal('leaving', true), goal('open', false), goal('done', true)];
  const settling = new Set(['holding', 'leaving']);
  const holding = new Set(['holding']);
  const leaving = leavingSelfCareGoalIds(goals, settling, holding);
  assert.deepEqual([...leaving], ['leaving']);
  const shown = planSelfCareGoalList(goals, {}, settling);
  assert.deepEqual(ids(shown).sort(), ['holding', 'leaving', 'open']);
  for (const row of shown) {
    assert.equal(selfCareGoalTargetOpacity(leaving.has(row.id)), row.id === 'leaving' ? 0 : 1);
  }
});

test('rollback or undo during leaving immediately restores visibility', () => {
  const settling = new Set(['a']);
  const goals = [goal('a', false), goal('b', false)];
  const leaving = leavingSelfCareGoalIds(goals, settling, new Set());
  assert.deepEqual([...leaving], []);
  for (const row of planSelfCareGoalList(goals, {}, settling)) {
    assert.equal(selfCareGoalTargetOpacity(leaving.has(row.id)), 1);
  }
});

test('a new goal stays visible while an older group leaves and another tick holds', () => {
  const goals = [goal('first', true), goal('second', true), goal('new', false)];
  const settling = new Set(['first', 'second']);
  const holding = new Set(['second']);
  const shown = planSelfCareGoalList(goals, {}, settling);
  const leaving = leavingSelfCareGoalIds(goals, settling, holding);
  assert.deepEqual(ids(shown).sort(), ['first', 'new', 'second']);
  assert.deepEqual([...leaving], ['first']);
  assert.equal(selfCareGoalTargetOpacity(leaving.has('new')), 1);
  assert.equal(selfCareGoalTargetOpacity(leaving.has('second')), 1);
  assert.deepEqual(ids(planSelfCareGoalList(goals, {}, holding)).sort(), ['new', 'second']);
});

test('the final group remains shown through leaving, then yields an empty list for all-done', () => {
  const goals = [goal('a', true), goal('b', true)];
  const settling = new Set(['a', 'b']);
  assert.equal(planSelfCareGoalList(goals, {}, settling).length, 2);
  assert.deepEqual([...leavingSelfCareGoalIds(goals, settling, settling)], []);
  assert.deepEqual([...leavingSelfCareGoalIds(goals, settling, new Set())], ['a', 'b']);
  assert.deepEqual(planSelfCareGoalList(goals), []);
});
