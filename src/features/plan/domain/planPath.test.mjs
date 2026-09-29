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
  { title: 'Relaxing Breath', estimatedSeconds: 120 },
  { title: 'Extended Exhale', estimatedSeconds: 190 },
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

  assert.equal(detail.eyebrow, 'Day 12 · 5 min');
  assert.equal(detail.title, 'Unlocks after day 11');
  assert.deepEqual(detail.focus, { heading: 'This week', text: 'You should feel calmer.' });
  assert.equal(detail.goesToToday, false);
  assert.ok(!JSON.stringify(detail).includes('Secret'));
});

test('today names its lesson and its step, and is the only day that goes anywhere', () => {
  const detail = pathDayDetail({ day: 9, state: 'today', exercises: EXERCISES, lesson: LESSON, weekPurpose: null });

  assert.equal(detail.eyebrow, 'Day 9 · Today · 5 min');
  assert.equal(detail.title, 'Wake up at a similar time');
  assert.deepEqual(detail.focus, {
    heading: "Today's step",
    text: 'Pick a wake time and keep weekends within an hour of it.',
  });
  assert.equal(detail.rowsDone, false);
  assert.equal(detail.goesToToday, true);
});

test('a done day keeps its step as a record', () => {
  const detail = pathDayDetail({ day: 4, state: 'done', exercises: EXERCISES, lesson: LESSON, weekPurpose: null });

  assert.equal(detail.eyebrow, 'Day 4 · Done · 5 min');
  assert.equal(detail.focus?.heading, 'Your step');
  assert.equal(detail.rowsDone, true);
  assert.equal(detail.goesToToday, false);
});

test('rows list each exercise with its minutes, then the check-in and lesson without one', () => {
  const detail = pathDayDetail({ day: 1, state: 'today', exercises: EXERCISES, lesson: null, weekPurpose: null });

  assert.deepEqual(detail.rows, [
    { kind: 'exercise', label: 'Relaxing Breath', minutes: 2 },
    { kind: 'exercise', label: 'Extended Exhale', minutes: 3 },
    { kind: 'checkIn', label: 'Check-in', minutes: null },
    { kind: 'lesson', label: 'Lesson', minutes: null },
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
  assert.equal(today.eyebrow, 'Day 9 · Done today · 5 min');
  assert.equal(today.rowsDone, true);
  assert.equal(today.goesToToday, false);
});
