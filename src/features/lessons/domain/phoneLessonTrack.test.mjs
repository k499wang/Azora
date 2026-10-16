import test from 'node:test';
import assert from 'node:assert/strict';
import { phoneLessonTrackForIntent, phoneLessonTrackForEnrollment, PHONE_TRACK_PURPOSE } from './phoneLessonTrack.ts';
import { lessonForDay, lessonForActivityId } from './lessonCatalogue.ts';
import { latestProgramPreset, programPresetRevision } from '../../program/domain/programCatalogue.ts';
import { buildProgramEnrollment, programDayLesson } from '../../program/domain/programEnrollment.ts';
import { buildIntentTitleLookup, resolvePlanIntent } from '../../../lib/planProgress.ts';
import { ONBOARDING_INTENT_LOOKUP_OPTIONS } from '../../../components/onboarding/data/intentOptions.ts';

test('saved sleep and focus goals select bedtime and work phone lessons', () => {
  const lookup = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);
  for (const [intent, track] of [['sleep', 'bedtime'], ['focus', 'work']]) {
    const option = ONBOARDING_INTENT_LOOKUP_OPTIONS.find((entry) => entry.id === intent);
    for (const title of [option.title, ...(option.legacyTitles ?? [])]) {
      assert.equal(phoneLessonTrackForIntent(resolvePlanIntent(title, lookup)), track);
    }
  }
  for (const intent of [undefined, null, 'other', 'stress_relief']) {
    assert.equal(phoneLessonTrackForIntent(intent), 'work');
  }
});

test('new phone plans resolve distinct complete tracks and save their exact lesson IDs', () => {
  const preset = latestProgramPreset('phone');
  assert.equal(preset.revision, 11);
  const enrollments = ['bedtime', 'work'].map((phoneLessonTrack) => {
    const result = buildProgramEnrollment({
      enrollmentId: phoneLessonTrack, planId: 'phone', presetRevision: preset.revision,
      phoneLessonTrack, enrolledOn: '2026-10-16',
    });
    assert.equal(result.status, 'enrolled');
    assert.equal(result.enrollment.resolved.days.length, 28);
    for (const day of result.enrollment.resolved.days) {
      const expected = lessonForDay('phone', day.day, preset.revision, undefined, phoneLessonTrack);
      assert.equal(day.lessonActivityId, `lesson:${expected.id}`);
      assert.equal(lessonForActivityId(day.lessonActivityId).id, expected.id);
      assert.equal(programDayLesson(result.enrollment, day.day).id, expected.id);
    }
    return result.enrollment;
  });
  for (let index = 0; index < 28; index += 1) {
    assert.notEqual(enrollments[0].resolved.days[index].lessonActivityId, enrollments[1].resolved.days[index].lessonActivityId);
  }
  assert.equal(lessonForDay('phone', 1).id, lessonForDay('phone', 1, 11, undefined, 'work').id);
});

test('phone revision ten and earlier ignore the new track selection', () => {
  for (let revision = 1; revision <= 10; revision += 1) {
    const preset = programPresetRevision('phone', revision);
    if (preset == null) continue;
    for (const { day } of preset.days) {
      const bedtime = lessonForDay('phone', day, revision, undefined, 'bedtime');
      const work = lessonForDay('phone', day, revision, undefined, 'work');
      assert.equal(bedtime.id, work.id);
      assert.ok(!bedtime.id.includes('phoneBedtime') && !bedtime.id.includes('phoneWork'));
    }
  }
});

test('running track and day purpose follow saved phone lessons', () => {
  for (const phoneLessonTrack of ['bedtime', 'work']) {
    const result = buildProgramEnrollment({ enrollmentId: 'saved', planId: 'phone', presetRevision: 11,
      phoneLessonTrack, enrolledOn: '2026-10-16' });
    const saved = JSON.parse(JSON.stringify(result.enrollment));
    assert.equal(phoneLessonTrackForEnrollment(saved), phoneLessonTrack);
    assert.ok(saved.resolved.days.every((day) => day.why.endsWith(PHONE_TRACK_PURPOSE[phoneLessonTrack])));
  }
  for (const presetRevision of [9, 10]) {
    const old = buildProgramEnrollment({ enrollmentId: 'legacy', planId: 'phone', presetRevision, enrolledOn: '2026-10-16' });
    assert.equal(phoneLessonTrackForEnrollment(old.enrollment), undefined);
  }
  assert.equal(phoneLessonTrackForEnrollment(null), undefined);
  assert.equal(phoneLessonTrackForEnrollment({ planId: 'night', resolved: { days: [] } }), undefined);
  assert.equal(phoneLessonTrackForEnrollment({ planId: 'phone', resolved: { days: [{ lessonActivityId: 'lesson:unknown.lesson' }] } }), undefined);
});
