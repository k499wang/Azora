import assert from 'node:assert/strict';
import test from 'node:test';
import { FIRST_TRIAL_WEEK_REVISION, lessonForDay, lessonForActivityId } from './lessonCatalogue.ts';
import { TRIAL_WEEK_LESSONS, TRIAL_WEEK_REPLACEMENTS } from './lessons/trialWeekLessons.ts';
import { latestProgramPreset, programPresetRevision } from '../../program/domain/programCatalogue.ts';
import { buildProgramEnrollment, programDayLesson } from '../../program/domain/programEnrollment.ts';

const paths = Object.keys(FIRST_TRIAL_WEEK_REVISION).flatMap((planId) =>
  (planId === 'pressure' ? ['stress', 'overthinking', 'anger'] : planId === 'phone' ? ['bedtime', 'work'] : [undefined])
    .map((track) => ({ planId, pressure: planId === 'pressure' ? track : undefined, phone: planId === 'phone' ? track : undefined })),
);

test('trial editions improve only the opening week across all twelve paths and preserve workload', () => {
  const reached = new Set();
  for (const { planId, pressure, phone } of paths) {
    const preset = latestProgramPreset(planId);
    const previous = programPresetRevision(planId, preset.revision - 1);
    assert.equal(preset.revision, FIRST_TRIAL_WEEK_REVISION[planId]);
    assert.deepEqual(preset.days, previous.days, `${planId} keeps every Reset and light day`);
    assert.deepEqual(preset.phases, previous.phases);
    const ids = [];
    for (const { day } of preset.days) {
      const original = lessonForDay(planId, day, previous.revision, pressure, phone);
      const lesson = lessonForDay(planId, day, preset.revision, pressure, phone);
      const replacement = day <= 7 ? TRIAL_WEEK_REPLACEMENTS[original.id] : undefined;
      assert.equal(lesson.id, replacement ?? original.id, `${planId}/${pressure ?? phone} day ${day}`);
      assert.equal(lessonForDay(planId, day, undefined, pressure, phone).id, lesson.id);
      assert.equal(lessonForActivityId(`lesson:${original.id}`), original, 'saved reads remain immutable');
      if (replacement) reached.add(replacement);
      ids.push(lesson.id);
    }
    assert.equal(new Set(ids).size, ids.length, `${planId}/${pressure ?? phone} never repeats a lesson`);
  }
  assert.deepEqual([...reached].sort(), TRIAL_WEEK_LESSONS.map(({ id }) => id).sort(), 'every new lesson is reachable');
});

test('trial snapshots save exact lessons while legacy snapshots retain their edition', () => {
  for (const { planId, pressure, phone } of paths) {
    const revision = FIRST_TRIAL_WEEK_REVISION[planId];
    for (const presetRevision of [revision - 1, revision]) {
      const result = buildProgramEnrollment({ enrollmentId: `${planId}-${pressure ?? phone}-${presetRevision}`,
        planId, presetRevision, pressureLessonTrack: pressure, phoneLessonTrack: phone, enrolledOn: '2026-10-16' });
      assert.equal(result.status, 'enrolled');
      const saved = JSON.parse(JSON.stringify(result.enrollment));
      for (const day of saved.resolved.days) {
        const expected = lessonForDay(planId, day.day, presetRevision, pressure, phone);
        assert.equal(day.lessonActivityId, `lesson:${expected.id}`);
        assert.equal(programDayLesson(saved, day.day).id, expected.id);
      }
    }
  }
});
