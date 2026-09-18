/**
 * How a lesson read is written down among the day's other completions.
 *
 * The prefix is the only thing keeping a lesson id from colliding with a
 * catalogue activity id in a column they share, and it is what the day uses to
 * tell them apart on the way back out. Both ends are checked here because a
 * change to either one alone is silent: rows would still be written, and the
 * row on Home would simply never tick.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isLessonActivityId,
  lessonActivityId,
} from './lessonActivity.ts';
import { allLessons } from './lessonCatalogue.ts';
import { PROGRAM_ACTIVITIES } from '../../program/domain/programCatalogue.ts';

test('a lesson id becomes an activity id the day can recognise', () => {
  assert.equal(lessonActivityId('sleep.caffeine'), 'lesson:sleep.caffeine');
  assert.equal(isLessonActivityId('lesson:sleep.caffeine'), true);
});

test('an exercise is never mistaken for a lesson', () => {
  for (const activityId of PROGRAM_ACTIVITIES.keys()) {
    assert.equal(isLessonActivityId(activityId), false, activityId);
  }
});

test('no lesson can collide with an activity out of the catalogue', () => {
  // They share one column and one primary key. A collision would credit an
  // exercise nobody did, which is the one thing the day may never get wrong.
  for (const lesson of allLessons()) {
    assert.equal(PROGRAM_ACTIVITIES.has(lessonActivityId(lesson.id)), false);
  }
});

test('every lesson id is one the database function will accept', () => {
  // `record_lesson_read` checks `^[a-z]+\\.[a-z]+$` before writing, because the
  // id becomes a primary key value. An id shaped like anything else is a row
  // nothing would ever look for again.
  for (const lesson of allLessons()) {
    assert.match(lesson.id, /^[a-z]+\.[a-z]+$/, lesson.id);
  }
});
