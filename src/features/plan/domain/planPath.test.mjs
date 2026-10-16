import assert from 'node:assert/strict';
import test from 'node:test';
import { isPlanWeekLocked, pathDayDetail, pathNodeOffset } from './planPath';

test('the first week stays open and later weeks require Pro', () => {
  assert.equal(isPlanWeekLocked(1, false), false);
  assert.equal(isPlanWeekLocked(2, false), true);
  assert.equal(isPlanWeekLocked(3, false), true);
  assert.equal(isPlanWeekLocked(2, true), false);
});

test('a week of days swings out to two steps each side and back', () => {
  const week = [0, 1, 2, 3, 4, 5, 6].map(pathNodeOffset);

  assert.deepEqual(week, [0, 1, 2, 1, 0, -1, -2]);
});

test('the swing repeats every eight nodes', () => {
  for (let index = 0; index < 8; index += 1) {
    assert.equal(pathNodeOffset(index + 8), pathNodeOffset(index));
  }
});

test('the swing never leaves two steps of centre', () => {
  for (let index = -20; index < 40; index += 1) {
    assert.ok(Math.abs(pathNodeOffset(index)) <= 2);
  }
});

const EXERCISES = [
  { activityId: 'relax', title: 'Relaxing Breath', estimatedSeconds: 120 },
  { activityId: 'exhale', title: 'Extended Exhale', estimatedSeconds: 190 },
];
const LESSON = { title: 'Wake up at a similar time' };

test('a day ahead is named by its lesson', () => {
  const detail = pathDayDetail({
    day: 12,
    state: 'ahead',
    exercises: EXERCISES,
    lesson: { title: 'Wind down early' },
  });

  assert.equal(detail.title, 'Wind down early');
});

test('a day pays each row its coins, totals them, and adds one decoration', () => {
  const ahead = pathDayDetail({ day: 12, state: 'ahead', exercises: EXERCISES, lesson: LESSON });
  const done = pathDayDetail({ day: 4, state: 'done', exercises: EXERCISES, lesson: LESSON });

  assert.deepEqual(ahead.rows.map((row) => row.coins), [20, 20, 10, 10]);
  assert.deepEqual(ahead.reward, { coins: 60, decorations: 1, earned: false });
  assert.deepEqual(done.reward, { coins: 60, decorations: 1, earned: true });
});

test('today names its lesson', () => {
  const detail = pathDayDetail({ day: 9, state: 'today', exercises: EXERCISES, lesson: LESSON });

  assert.equal(detail.title, 'Wake up at a similar time');
  assert.ok(detail.rows.every((row) => !row.completed));
});

test('a done day reads as done', () => {
  const detail = pathDayDetail({ day: 4, state: 'done', exercises: EXERCISES, lesson: LESSON });

  assert.ok(detail.rows.every((row) => row.completed));
});

test('rows list each exercise with its minutes, then the check-in and lesson without one', () => {
  const detail = pathDayDetail({ day: 1, state: 'today', exercises: EXERCISES, lesson: null });

  assert.deepEqual(detail.rows, [
    { kind: 'exercise', label: 'Relaxing Breath', minutes: 2, coins: 20, completed: false },
    { kind: 'exercise', label: 'Extended Exhale', minutes: 3, coins: 20, completed: false },
    { kind: 'checkIn', label: 'Check-in', minutes: null, coins: 10, completed: false },
    { kind: 'lesson', label: 'Lesson', minutes: null, coins: 10, completed: false },
  ]);
  assert.equal(detail.title, 'Day 1');
});

test('a day finished today reads as done', () => {
  const today = pathDayDetail({ day: 9, state: 'doneToday', exercises: EXERCISES, lesson: LESSON });

  assert.ok(today.rows.every((row) => row.completed));
});

const TODAY = { day: 9, state: 'today', exercises: EXERCISES, lesson: LESSON };

for (const completedActivityIds of [[], ['relax'], ['exhale'], ['relax', 'exhale']]) {
  for (const checkInCompleted of [false, true]) {
    for (const lessonCompleted of [false, true]) {
      test(`today reflects individual progress: ${JSON.stringify({ completedActivityIds, checkInCompleted, lessonCompleted })}`, () => {
        const detail = pathDayDetail({
          ...TODAY,
          completion: { day: 9, completedActivityIds, checkInCompleted, lessonCompleted },
        });
        assert.deepEqual(detail.rows.map((row) => row.completed), [
          completedActivityIds.includes('relax'),
          completedActivityIds.includes('exhale'),
          checkInCompleted,
          lessonCompleted,
        ]);
      });
    }
  }
}

test('exercise completion uses activity identity instead of title or list order', () => {
  const detail = pathDayDetail({
    ...TODAY,
    exercises: EXERCISES.map((exercise) => ({ ...exercise, title: 'Same title' })).reverse(),
    completion: { day: 9, completedActivityIds: ['relax', 'unrelated'], checkInCompleted: false, lessonCompleted: false },
  });
  assert.deepEqual(detail.rows.map((row) => row.completed), [false, true, false, false]);
});

test('progress for another day does not mark today complete', () => {
  const detail = pathDayDetail({
    ...TODAY,
    completion: { day: 8, completedActivityIds: ['relax', 'exhale'], checkInCompleted: true, lessonCompleted: true },
  });
  assert.ok(detail.rows.every((row) => !row.completed));
});

test('future days stay incomplete even if supplied completion matches', () => {
  const detail = pathDayDetail({
    ...TODAY,
    state: 'ahead',
    completion: { day: 9, completedActivityIds: ['relax', 'exhale'], checkInCompleted: true, lessonCompleted: true },
  });
  assert.ok(detail.rows.every((row) => !row.completed));
});

test('past completed days retain completion independently of current progress', () => {
  const detail = pathDayDetail({
    ...TODAY,
    state: 'done',
    completion: { day: 9, completedActivityIds: [], checkInCompleted: false, lessonCompleted: false },
  });
  assert.ok(detail.rows.every((row) => row.completed));
});

test('finished today uses matching canonical progress when available', () => {
  const detail = pathDayDetail({
    ...TODAY,
    state: 'doneToday',
    completion: { day: 9, completedActivityIds: ['relax'], checkInCompleted: true, lessonCompleted: false },
  });
  assert.deepEqual(detail.rows.map((row) => row.completed), [true, false, true, false]);
});

test('finished today remains complete while progress is missing or belongs to another day', () => {
  for (const completion of [undefined, { day: 10, completedActivityIds: [], checkInCompleted: false, lessonCompleted: false }]) {
    const detail = pathDayDetail({ ...TODAY, state: 'doneToday', completion });
    assert.ok(detail.rows.every((row) => row.completed));
  }
});

test('a day that asks for a to-do lists it last and adds its coins to the reward', () => {
  const ahead = pathDayDetail({
    day: 12, state: 'ahead', exercises: EXERCISES, lesson: LESSON, todoRequired: true,
  });

  assert.deepEqual(ahead.rows.map((row) => row.kind), ['exercise', 'exercise', 'checkIn', 'lesson', 'todo']);
  assert.deepEqual(ahead.rows.at(-1), { kind: 'todo', label: 'To-do', minutes: null, coins: 10, completed: false });
  assert.deepEqual(ahead.reward, { coins: 70, decorations: 1, earned: false });
});

test('the to-do row is done by the claim on today and by a finished day before it', () => {
  const completion = {
    day: 9, completedActivityIds: ['todo:claim'], checkInCompleted: false, lessonCompleted: false,
  };
  const today = pathDayDetail({
    day: 9, state: 'today', exercises: [], lesson: LESSON, todoRequired: true, completion,
  });
  const done = pathDayDetail({ day: 4, state: 'done', exercises: [], lesson: LESSON, todoRequired: true });

  assert.equal(today.rows.find((row) => row.kind === 'todo').completed, true);
  assert.equal(today.rows.find((row) => row.kind === 'lesson').completed, false);
  assert.equal(done.rows.find((row) => row.kind === 'todo').completed, true);
});

test('a day that does not ask for a to-do has no to-do row', () => {
  for (const todoRequired of [false, undefined]) {
    const detail = pathDayDetail({ day: 12, state: 'ahead', exercises: EXERCISES, lesson: LESSON, todoRequired });

    assert.equal(detail.rows.some((row) => row.kind === 'todo'), false);
    assert.equal(detail.reward.coins, 60);
  }
});
