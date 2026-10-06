import assert from 'node:assert/strict';
import test from 'node:test';
import { pathDayDetail, pathNodeOffset } from './planPath';

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
const LESSON = { title: 'Wake up at a similar time', step: 'Pick a wake time and keep weekends within an hour of it.' };

test('a day ahead says what it asks, how long, and the week it serves — never its lesson', () => {
  const detail = pathDayDetail({
    day: 12,
    state: 'ahead',
    exercises: EXERCISES,
    lesson: { title: 'Secret', step: 'Secret step.' },
    weekPurpose: 'You should feel calmer.',
  });

  assert.equal(detail.title, 'Unlocks after day 11');
  assert.equal(detail.focus, 'You should feel calmer.');
  assert.ok(!JSON.stringify(detail).includes('Secret'));
});

test('today names its lesson and its step', () => {
  const detail = pathDayDetail({ day: 9, state: 'today', exercises: EXERCISES, lesson: LESSON, weekPurpose: null });

  assert.equal(detail.title, 'Wake up at a similar time');
  assert.equal(detail.focus, 'Pick a wake time and keep weekends within an hour of it.');
  assert.ok(detail.rows.every((row) => !row.completed));
});

test('a done day keeps its step as a record', () => {
  const detail = pathDayDetail({ day: 4, state: 'done', exercises: EXERCISES, lesson: LESSON, weekPurpose: null });

  assert.equal(detail.focus, 'Pick a wake time and keep weekends within an hour of it.');
  assert.ok(detail.rows.every((row) => row.completed));
});

test('rows list each exercise with its minutes, then the check-in and lesson without one', () => {
  const detail = pathDayDetail({ day: 1, state: 'today', exercises: EXERCISES, lesson: null, weekPurpose: null });

  assert.deepEqual(detail.rows, [
    { kind: 'exercise', label: 'Relaxing Breath', minutes: 2, completed: false },
    { kind: 'exercise', label: 'Extended Exhale', minutes: 3, completed: false },
    { kind: 'checkIn', label: 'Check-in', minutes: null, completed: false },
    { kind: 'lesson', label: 'Lesson', minutes: null, completed: false },
  ]);
  assert.equal(detail.title, 'Day 1');
  assert.equal(detail.focus, null);
});

test('the day after one finished today unlocks tomorrow, and today reads as done', () => {
  const next = pathDayDetail({
    day: 10,
    state: 'ahead',
    exercises: EXERCISES,
    lesson: null,
    weekPurpose: null,
    opensTomorrow: true,
  });
  const today = pathDayDetail({ day: 9, state: 'doneToday', exercises: EXERCISES, lesson: LESSON, weekPurpose: null });

  assert.equal(next.title, 'Unlocks tomorrow');
  assert.ok(today.rows.every((row) => row.completed));
});

const TODAY = { day: 9, state: 'today', exercises: EXERCISES, lesson: LESSON, weekPurpose: null };

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
