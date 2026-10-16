import assert from 'node:assert/strict';
import test from 'node:test';
import { FIRST_TRIAL_WEEK_REVISION, lessonForDay, lessonForActivityId } from './lessonCatalogue.ts';
import { programPresetRevision } from '../../program/domain/programCatalogue.ts';

const EXPECTED = {
  stress: ['stress.trialsigns', 'breath.trialstress', 'attention.trialskillsensesstress',
    'stress.trialnext', 'stress.trialload', 'attention.trialskillmusclesstressready', 'stress.trialplan'],
  overthinking: ['worry.trialloop', 'breath.trialworry', 'attention.trialskillsensesoverthinking',
    'worry.trialaction', 'worry.trialfacts', 'attention.trialskillmusclesoverthinkingready', 'quiet.trialworryquestion'],
};

for (const [track, ids] of Object.entries(EXPECTED)) {
  test(`${track} teaches seven distinct lessons and keeps saved earlier lessons available`, () => {
    const preset = programPresetRevision('pressure', FIRST_TRIAL_WEEK_REVISION.pressure);
    const lessons = ids.map((_, index) => lessonForDay('pressure', index + 1, preset.revision, track));
    assert.deepEqual(lessons.map(({ id }) => id), ids);
    assert.equal(new Set(ids).size, 7);
    for (let day = 1; day <= 7; day++) {
      const previous = lessonForDay('pressure', day, FIRST_TRIAL_WEEK_REVISION.pressure - 1, track);
      assert.notEqual(previous.id, lessons[day - 1].id);
      assert.equal(lessonForActivityId(`lesson:${previous.id}`), previous);
    }
    for (let day = 8; day <= preset.days.length; day++) {
      assert.equal(lessonForDay('pressure', day, preset.revision, track),
        lessonForDay('pressure', day, FIRST_TRIAL_WEEK_REVISION.pressure - 1, track));
    }
  });
}
