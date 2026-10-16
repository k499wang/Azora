import assert from 'node:assert/strict';
import test from 'node:test';
import { lessonForDay, lessonForActivityId } from './lessonCatalogue.ts';
import { buildProgramEnrollment, programDayLesson } from '../../program/domain/programEnrollment.ts';
import { latestProgramPreset, programPresetRevision } from '../../program/domain/programCatalogue.ts';
import { planWeekPurposeLines } from '../../plan/domain/planWeekPurpose.ts';

const FIRST_WEEK = {
  stress: ['stress.trialsigns', 'breath.trialstress', 'attention.trialskillsensesstress', 'stress.trialnext', 'stress.trialload', 'attention.trialskillmusclesstressready', 'stress.trialplan'],
  overthinking: ['worry.trialloop', 'breath.trialworry', 'attention.trialskillsensesoverthinking', 'worry.trialaction', 'worry.trialfacts', 'attention.trialskillmusclesoverthinkingready', 'quiet.trialworryquestion'],
};

const COURSE_DAY_WORDS = [
  'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty', 'twentyone', 'twentytwo', 'twentythree', 'twentyfour', 'twentyfive', 'twentysix', 'twentyseven', 'twentyeight',
];

test('full pressure course preserves its first 28 scheduled days and the earlier edition', () => {
  const latest = latestProgramPreset('pressure');
  const earlier = programPresetRevision('pressure', 12);
  assert.equal(latest.revision, 13);
  assert.deepEqual(latest.days, earlier.days.slice(0, 28));
  assert.deepEqual(latest.phases.map(({ endDay }) => endDay), [14, 21, 28]);
  assert.equal(latest.days.length, 28);
  assert.equal(earlier.days.length, 56);
  assert.equal(latestProgramPreset('pressure', 'anger').revision, 12);
  for (const [planId, revision] of Object.entries({ night: 10, morning: 12, focus: 12, quiet: 12, home: 11, phone: 12, recovery: 11, selfTrust: 11 })) {
    assert.equal(latestProgramPreset(planId).revision, revision, planId);
  }
  for (const track of ['stress', 'overthinking']) {
    const prefix = track === 'stress' ? 'stress' : 'worry';
    const ids = [];
    for (let day = 1; day <= 28; day++) {
      const lesson = lessonForDay('pressure', day, 13, track);
      ids.push(lesson.id);
      assert.equal(lesson.id, day <= 7 ? FIRST_WEEK[track][day - 1] : `${prefix}.course${COURSE_DAY_WORDS[day - 8]}`);
      assert.equal(lessonForDay('pressure', day, undefined, track), lesson);
      const original = lessonForDay('pressure', day, 12, track);
      assert.equal(lessonForActivityId(`lesson:${original.id}`), original);
      if (day <= 7) assert.equal(lesson, original);
      else assert.notEqual(lesson.id, original.id);
    }
    assert.equal(new Set(ids).size, 28);
    for (const revision of [12, 13]) {
      const result = buildProgramEnrollment({ enrollmentId: `${track}-${revision}`, planId: 'pressure', presetRevision: revision,
        pressureLessonTrack: track, enrolledOn: '2026-10-16' });
      assert.equal(result.status, 'enrolled');
      const saved = JSON.parse(JSON.stringify(result.enrollment));
      for (let day = 1; day <= (revision === 12 ? 56 : 28); day++) {
        assert.equal(programDayLesson(saved, day), lessonForDay('pressure', day, revision, track));
      }
    }
  }
  assert.equal(lessonForDay('pressure', 29, 13, 'stress'), null);
  assert.equal(lessonForDay('pressure', 29, 13, 'overthinking'), null);
  assert.equal(buildProgramEnrollment({ enrollmentId: 'unsupported', planId: 'pressure', presetRevision: 13, pressureLessonTrack: 'anger', enrolledOn: '2026-10-16' }).status, 'refused');
  for (let day = 1; day <= 56; day++) {
    assert.equal(lessonForDay('pressure', day, 13, 'anger'), lessonForDay('pressure', day, 12, 'anger'));
  }
});

test('each full course lesson mentions only its scheduled supporting practices', () => {
  const preset = latestProgramPreset('pressure');
  for (const track of ['stress', 'overthinking']) for (const day of preset.days.slice(7)) {
    const lesson = lessonForDay('pressure', day.day, 13, track);
    const notes = lesson.blocks.filter((block) => block.kind === 'text' && /Today’s \*\*/.test(block.text));
    assert.equal(notes.length, day.activityIds.length > 0 ? 1 : 0, `${track} day${day.day}`);
    const note = notes[0]?.text ?? '';
    for (const [activity, phrase] of [
      ['breathing.', 'breathing Reset'], ['attention.muscle-release.', 'Muscle Release'], ['attention.54321.', '5-4-3-2-1'],
    ]) assert.equal(note.includes(phrase), day.activityIds.some((id) => id.startsWith(activity)), `${track} day${day.day} ${phrase}`);
    if (note) assert.ok(note.split(/\s+/).length <= 40);
    assert.equal(lesson.blocks.at(-1).kind, 'do');
  }
});

test('weekly course guidance follows the saved edition and leaves anger unchanged', () => {
  for (const track of ['stress', 'overthinking']) {
    const old = planWeekPurposeLines('pressure', undefined, track, 12);
    const current = planWeekPurposeLines('pressure', undefined, track, 13);
    assert.equal(current.length, 4);
    assert.equal(new Set(current).size, 4);
    assert.notDeepEqual(current, old);
    assert.deepEqual(planWeekPurposeLines('pressure', undefined, track), current);
  }
  assert.deepEqual(planWeekPurposeLines('pressure', undefined, 'anger', 13), planWeekPurposeLines('pressure', undefined, 'anger', 12));
});
