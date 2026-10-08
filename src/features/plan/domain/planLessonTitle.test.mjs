import assert from 'node:assert/strict';
import test from 'node:test';
import { allLessons, lessonById, lessonForDay } from '../../lessons/domain/lessonCatalogue.ts';
import { latestProgramPreset } from '../../program/domain/programCatalogue.ts';
import { buildProgramEnrollment, programDayLesson } from '../../program/domain/programEnrollment.ts';
import { planLessonTitle } from './planLessonTitle.ts';

test('every catalogue lesson has an authored compact journey title', () => {
  for (const lesson of allLessons()) {
    const title = planLessonTitle(lesson);
    assert.equal(typeof title, 'string', lesson.id);
    assert.ok(title.trim().length > 0, lesson.id);
    assert.ok(title.length <= 25, `${lesson.id}: ${title}`);
    assert.doesNotMatch(title, /\n/, lesson.id);
    assert.notEqual(title, planLessonTitle(null), lesson.id);
  }
});

test('a missing lesson keeps a short journey caption', () => {
  assert.equal(planLessonTitle(null), 'A Small Step');
});

function pressureEnrollment(track) {
  const result = buildProgramEnrollment({
    enrollmentId: `test-${track}`,
    planId: 'pressure',
    presetRevision: latestProgramPreset('pressure').revision,
    pressureLessonTrack: track,
    enrolledOn: '2026-10-07',
  });
  assert.equal(result.status, 'enrolled');
  return result.enrollment;
}

test('the caption previews the enrolled pressure topic instead of the default track', () => {
  const enrollment = pressureEnrollment('overthinking');
  const actual = programDayLesson(enrollment, 2);
  const defaultLesson = lessonForDay('pressure', 2, enrollment.presetRevision);
  assert.equal(actual.id, 'worry.loop');
  assert.equal(planLessonTitle(actual), 'The Worry Loop');
  assert.notEqual(planLessonTitle(actual), planLessonTitle(defaultLesson));
});

test('a stored lesson override controls the caption regardless of plan defaults', () => {
  const enrollment = pressureEnrollment('stress');
  const customized = {
    ...enrollment,
    resolved: {
      days: enrollment.resolved.days.map((day) => day.day === 2
        ? { ...day, lessonActivityId: 'lesson:anger.meter' }
        : day),
    },
  };
  assert.equal(programDayLesson(customized, 2).id, 'anger.meter');
  assert.equal(planLessonTitle(programDayLesson(customized, 2)), planLessonTitle(lessonById('anger.meter')));
  assert.notEqual(planLessonTitle(programDayLesson(customized, 2)), planLessonTitle(programDayLesson(enrollment, 2)));
});
