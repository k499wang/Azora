import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOnboardingTodayPreview } from './onboardingTodayPreview.ts';
import { onboardingPresetFor } from './onboardingPreset.ts';
import { buildProgramEnrollment } from '../features/program/domain/programEnrollment.ts';
import { lessonForActivityId } from '../features/lessons/domain/lessonCatalogue.ts';
import { lessonEstimatedMinutes } from '../features/lessons/domain/lessonDuration.ts';
import { pressureLessonTrackForIntent } from '../features/lessons/domain/pressureLessonTrack.ts';
import { phoneLessonTrackForIntent } from '../features/lessons/domain/phoneLessonTrack.ts';
import { intentFollowUpsFor } from '../components/onboarding/data/intentFollowUps.ts';

function preview(intent = 'cleaning', answers = {}, signals = {}, selectedGoalCount = 1) {
  return buildOnboardingTodayPreview({
    preset: onboardingPresetFor(intent, signals), intent, answers,
    goalPhrase: null, selectedGoalCount,
  });
}

test('preview uses the exact first lesson subscribers receive, including refined tracks', () => {
  const cases = [
    ...['cleaning', 'sleep', 'energy', 'focus', 'stress_relief', 'calm_fast',
      'emotional_balance', 'self_care', 'self_acceptance', 'daily_habit',
      'burnout', 'scrolling', 'procrastination', 'spiritual', 'yoga', 'heart_health', 'other']
      .map((intent) => [intent, {}]),
    ['sleep', { sleepCause: 'phone' }],
    ['energy', { followUpAnswers: { when_energy: ['constant'] } }],
  ];
  for (const [intent, signals] of cases) {
    const preset = onboardingPresetFor(intent, signals);
    const result = buildProgramEnrollment({
      enrollmentId: 'test', planId: preset.id, presetRevision: preset.revision,
      pressureLessonTrack: pressureLessonTrackForIntent(intent),
      phoneLessonTrack: phoneLessonTrackForIntent(intent), enrolledOn: '2026-10-20',
    });
    assert.equal(result.status, 'enrolled', intent);
    const days = result.enrollment.resolved.days;
    const lesson = lessonForActivityId(days[0].lessonActivityId);
    const actual = preview(intent, {}, signals);
    assert.deepEqual(actual.lesson, {
      id: lesson.id, title: lesson.title, introduction: lesson.introduction,
      step: lesson.step, minutes: lessonEstimatedMinutes(lesson.blocks),
    }, intent);
    assert.equal(actual.firstResetDay, days.find((day) => day.activities.length > 0)?.day ?? null);
    assert.ok(actual.lesson.minutes >= 2);
    assert.ok(actual.lesson.introduction.length > 0);
  }
});

test('manageable cleaning answers do not invent difficulty starting', () => {
  for (const answers of [
    { cleaning_space_state: ['mostly_clean'] },
    { cleaning_mess_thought: ['not_bad'] },
    { cleaning_space_state: ['mostly_clean'], cleaning_mess_thought: ['where_start'] },
  ]) {
    const result = preview('cleaning', answers);
    assert.doesNotMatch(result.reason, /hard|overwhelm|wonder where|stuck/);
    assert.match(result.reason, /useful/);
  }
});

test('cleaning reflects the selected difficulty without changing or inventing the lesson', () => {
  const starts = preview('cleaning', { cleaning_mess_thought: ['where_start'] });
  const delays = preview('cleaning', { cleaning_mess_thought: ['tomorrow'] });
  const doubts = preview('cleaning', { cleaning_mess_thought: ['why_bother'] });
  assert.equal(starts.reason, 'Because you told us you wonder where to start, your plan begins with one usable spot, rather than a whole room.');
  assert.match(delays.reason, /until tomorrow/);
  assert.match(doubts.reason, /mess returns/);
  assert.deepEqual(starts.lesson, delays.lesson);
  assert.match(starts.routine, /before a meal/);
});

test('missing, unknown and multiple answers make no claim about a specific difficulty', () => {
  for (const answers of [{}, { when_cleaning: ['unknown'] }, { when_cleaning: ['all', 'clutter'] }]) {
    assert.doesNotMatch(preview('cleaning', answers).reason, /told us|chose|hard|overwhelm/);
  }
  assert.match(preview('cleaning', { when_cleaning: ['dishes'] }).reason, /dishes feel hardest to start/);
});

test('sleep refined to a phone plan uses bedtime guidance rather than work guidance', () => {
  const result = preview('sleep', {}, { sleepCause: 'phone' });
  assert.match(result.routine, /bed/);
  assert.doesNotMatch(result.routine, /work or study/);
  assert.notEqual(result.lesson.id, preview('scrolling').lesson.id);
});

test('legacy multi-goal answers explain the initial focus', () => {
  assert.equal(preview().scopeNote, null);
  assert.match(preview('cleaning', {}, {}, 3).scopeNote, /starting focus.*other goals/);
});

test('each goal connects the selected answer to its starting approach without a quote label', () => {
  for (const intent of ['cleaning', 'sleep', 'energy', 'focus', 'stress_relief', 'calm_fast',
    'emotional_balance', 'self_care', 'self_acceptance', 'daily_habit', 'burnout',
    'scrolling', 'procrastination', 'spiritual', 'yoga', 'heart_health', 'other']) {
    const question = intentFollowUpsFor(intent)[0];
    for (const option of question.options) {
      const result = preview(intent, { [question.id]: [option.id] });
      assert.ok(result.reason.startsWith(`Because you told us ${option.echo},`), `${intent}: ${option.id}`);
      assert.doesNotMatch(result.reason, /You chose|[“”]/);
    }
  }
  assert.match(preview('cleaning', { cleaning_space_state: ['mostly_clean'] }).reason,
    /Because you told us your space mostly needs a little tidying/);
});
