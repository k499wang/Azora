import assert from 'node:assert/strict';
import test from 'node:test';
import { allLessons, lessonById } from './lessonCatalogue.ts';
import { LESSON_INTRODUCTIONS } from './lessonIntroductions.ts';

test('every lesson and goal variant has its own short learning preview', () => {
  const lessons = allLessons();
  assert.deepEqual(Object.keys(LESSON_INTRODUCTIONS).sort(), lessons.map(({ id }) => id).sort());
  for (const lesson of lessons) {
    const summary = lesson.introduction;
    assert.equal(typeof summary, 'string', lesson.id);
    assert.ok(summary.trim().length > 0, lesson.id);
    assert.ok(summary.trim().split(/\s+/).length <= 32, `${lesson.id}: preview must stay short`);
    assert.notEqual(summary, lesson.step, `${lesson.id}: learning and action have different jobs`);
    assert.ok(!lesson.blocks.some((block) => block.kind === 'text' && block.text.replace(/\*\*/g, '') === summary), `${lesson.id}: do not reuse a teaching paragraph`);
    assert.ok(!summary.includes('**'), `${lesson.id}: previews are plain text`);
    assert.equal(lessonById(lesson.id).introduction, summary);
  }
});
