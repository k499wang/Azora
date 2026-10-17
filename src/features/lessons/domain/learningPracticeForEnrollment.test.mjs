import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProgramEnrollment, programDayLesson } from '../../program/domain/programEnrollment.ts';
import { latestProgramPreset } from '../../program/domain/programCatalogue.ts';
import { learningPracticeForEnrollment } from './learningPracticeForEnrollment.ts';

test('practice summaries exclude a different saved lesson at the same day number', () => {
  const result = buildProgramEnrollment({ enrollmentId: 'test', planId: 'pressure', presetRevision: latestProgramPreset('pressure').revision, pressureLessonTrack: 'stress', enrolledOn: '2026-10-17' });
  assert.equal(result.status, 'enrolled');
  const record = { programDay: 1, lessonId: programDayLesson(result.enrollment, 1).id, response: 'tried', helpful: true, updatedAt: '2026-10-17T00:00:00Z' };
  assert.deepEqual(learningPracticeForEnrollment(result.enrollment, [record, { ...record, lessonId: 'a-different-lesson' }]), [record]);
});
