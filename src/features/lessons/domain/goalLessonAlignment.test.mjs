import assert from 'node:assert/strict';
import test from 'node:test';
import { allLessons, FIRST_GOAL_ALIGNED_REVISION, lessonById, lessonForActivityId, lessonForDay } from './lessonCatalogue.ts';
import { GOAL_LESSON_CONTEXTS } from './lessons/goalLessonContexts.ts';
import { PHONE_LESSON_CONTEXTS } from './lessons/phoneLessonContexts.ts';
import { PRESSURE_LESSON_CONTEXTS } from './lessons/pressureLessonContexts.ts';
import { goalLessonId } from './lessons/goalLessonVariants.ts';
import { latestProgramPreset, programPresetRevision } from '../../program/domain/programCatalogue.ts';
import { buildProgramEnrollment, programDayLesson } from '../../program/domain/programEnrollment.ts';

const contexts = { ...GOAL_LESSON_CONTEXTS, ...PRESSURE_LESSON_CONTEXTS, ...PHONE_LESSON_CONTEXTS };
const plans = Object.keys(FIRST_GOAL_ALIGNED_REVISION);

test('every shared lesson application is authored for and reachable from its chosen goal', () => {
  const reached = new Set();
  for (const planId of plans) {
    const preset = programPresetRevision(planId, FIRST_GOAL_ALIGNED_REVISION[planId]);
    const previous = programPresetRevision(planId, preset.revision - 1);
    assert.equal(preset.revision, FIRST_GOAL_ALIGNED_REVISION[planId]);
    assert.deepEqual(preset.days, previous.days, `${planId} keeps its Reset schedule`);
    assert.deepEqual(preset.phases, previous.phases, `${planId} keeps its phases`);
    for (const goal of planId === 'pressure' ? ['stress', 'overthinking', 'anger'] : [planId]) {
      const ids = [];
      for (const { day } of preset.days) {
        const source = lessonForDay(planId, day, previous.revision, planId === 'pressure' ? goal : undefined);
        const lesson = lessonForDay(planId, day, preset.revision, planId === 'pressure' ? goal : undefined);
        const context = contexts[goal][source.id];
        assert.equal(lesson.id, goalLessonId(goal, source.id) ?? source.id);
        if (context) {
          assert.equal(lesson.blocks.find((block) => block.kind === 'text').text, context.explanation);
          assert.equal(lesson.step, context.step);
          assert.equal(lesson.blocks.at(-1).text, context.action ?? `**${context.step}**`);
          const choice = lesson.blocks.find((block) => block.kind === 'choice');
          assert.ok(choice.options.some((option) => option.label === context.step.replace(/\.$/, '')));
          assert.ok(choice.options.some((option) => option.label === context.alternative));
          reached.add(lesson.id);
        } else {
          assert.equal(lesson, source, `${goal} keeps its already relevant teaching`);
        }
        assert.match(lesson.id, /^[a-z]+\.[a-z]+$/, 'lesson IDs remain accepted by the backend');
        ids.push(lesson.id);
      }
      assert.equal(new Set(ids).size, ids.length, `${goal} has no repeated lesson`);
    }
  }
  // The shared phone edition remains reachable by its historical revision.
  const phone = programPresetRevision('phone', 11);
  const sourceRevision = FIRST_GOAL_ALIGNED_REVISION.phone - 1;
  for (const [track, goal] of [['bedtime', 'phoneBedtime'], ['work', 'phoneWork']]) {
    for (const { day } of phone.days) {
      const source = lessonForDay('phone', day, sourceRevision);
      const lesson = lessonForDay('phone', day, phone.revision, undefined, track);
      const context = contexts[goal][source.id];
      assert.ok(context, `${goal}/${source.id} is authored`);
      assert.equal(lesson.id, goalLessonId(goal, source.id));
      assert.equal(lesson.blocks.find((block) => block.kind === 'text').text, context.explanation);
      assert.equal(lesson.step, context.step);
      assert.equal(lesson.blocks.at(-1).text, context.action ?? `**${context.step}**`);
      reached.add(lesson.id);
    }
  }
  for (const [goal, authored] of Object.entries(contexts)) {
    for (const id of Object.keys(authored)) assert.ok(reached.has(goalLessonId(goal, id)), `${goal}/${id} is not used`);
  }
  assert.equal(new Set(allLessons().map((lesson) => lesson.id)).size, allLessons().length, 'all lesson IDs are unique');
});

test('new enrollment snapshots store goal applications while saved original reads still resolve', () => {
  for (const planId of plans) {
    for (const goal of planId === 'pressure' ? ['stress', 'overthinking', 'anger'] : planId === 'phone' ? ['phoneBedtime', 'phoneWork'] : [planId]) {
      const preset = latestProgramPreset(planId, planId === 'pressure' ? goal : undefined);
      const phoneLessonTrack = goal === 'phoneBedtime' ? 'bedtime' : 'work';
      const result = buildProgramEnrollment({
        enrollmentId: `aligned-${goal}`,
        planId,
        presetRevision: preset.revision,
        pressureLessonTrack: planId === 'pressure' ? goal : undefined,
        phoneLessonTrack,
        enrolledOn: '2026-10-16',
      });
      assert.equal(result.status, 'enrolled');
      for (const day of result.enrollment.resolved.days) {
        const lesson = lessonForDay(planId, day.day, preset.revision, planId === 'pressure' ? goal : undefined, phoneLessonTrack);
        assert.equal(day.lessonActivityId, `lesson:${lesson.id}`);
        assert.equal(programDayLesson(result.enrollment, day.day), lesson);
        const original = lessonForDay(planId, day.day, preset.revision - 1, planId === 'pressure' ? goal : undefined);
        const saved = {
          ...result.enrollment,
          resolved: { days: [{ ...day, lessonActivityId: `lesson:${original.id}` }] },
        };
        assert.equal(programDayLesson(saved, day.day), original);
        assert.equal(lessonForActivityId(`lesson:${original.id}`), lessonById(original.id));
      }
    }
  }
});

test('home and carry-forward examples practise the selected goal', () => {
  const home = lessonById(goalLessonId('home', 'focus.ready'));
  const sequence = home.blocks.find((block) => block.kind === 'sequence');
  assert.match(sequence.steps.join(' '), /household|cup|dish/);
  assert.doesNotMatch(sequence.steps.join(' '), /report file|rough heading/);
  for (const goal of Object.keys(contexts)) {
    const carry = lessonById(goalLessonId(goal, 'plan.carry'));
    const application = carry.blocks.find((block) => block.kind === 'reveal');
    assert.ok(application.items.every((item) => item.detail.length > 30), goal);
    if (!['night', 'quiet'].includes(goal)) assert.doesNotMatch(application.items.map((item) => item.detail).join(' '), /short, comfortable breathing practice/);
  }
});
