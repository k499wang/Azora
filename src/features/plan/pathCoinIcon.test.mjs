import assert from 'node:assert/strict';
import test from 'node:test';
import { dayCoinIcon } from './pathCoinIcon.ts';
import { allProgramPresets, PROGRAM_ACTIVITIES } from '../program/domain/programCatalogue.ts';

function lessonFixture(t) {
  const lesson = {
    ...PROGRAM_ACTIVITIES.values().next().value,
    id: 'test.path-lesson',
    title: 'A lesson title too long for a compact path caption',
    delivery: { modality: 'lesson', sections: [] },
  };
  PROGRAM_ACTIVITIES.set(lesson.id, lesson);
  t.after(() => PROGRAM_ACTIVITIES.delete(lesson.id));
  return lesson;
}

test('every published day has a practice coin icon', () => {
  for (const preset of allProgramPresets()) {
    for (const day of preset.days) {
      assert.match(dayCoinIcon(preset, day.day), /^coin-/, `${preset.planId} day ${day.day}`);
    }
  }
});

test('a preceding lesson does not replace the practice icon', (t) => {
  const preset = allProgramPresets()[0];
  const breathing = [...PROGRAM_ACTIVITIES.values()].find((activity) => activity.delivery.modality === 'breathing');
  const lesson = lessonFixture(t);
  assert.ok(breathing);
  const withLesson = { ...preset, days: [{ day: 1, activityIds: [lesson.id, breathing.id], why: '' }] };
  const resetOnly = { ...preset, days: [{ day: 1, activityIds: [breathing.id], why: '' }] };
  assert.equal(dayCoinIcon(withLesson, 1), dayCoinIcon(resetOnly, 1));
});

test('unavailable days and lesson-only days keep their fallback icons', (t) => {
  const preset = allProgramPresets()[0];
  const lesson = lessonFixture(t);
  const lessonOnly = { ...preset, days: [{ day: 1, activityIds: [lesson.id], why: '' }] };
  assert.equal(dayCoinIcon(lessonOnly, 1), 'coin-book');
  assert.equal(dayCoinIcon(null, 1), 'coin-star');
  assert.equal(dayCoinIcon(preset, 999), 'coin-star');
});
