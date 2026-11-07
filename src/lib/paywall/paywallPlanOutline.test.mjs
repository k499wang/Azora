import test from 'node:test';
import assert from 'node:assert/strict';
import { paywallPlanOutline } from './paywallPlanOutline.ts';
import { PLAN_OUTLINE_COPY } from './paywallPlanOutlineCopy.ts';
import { onboardingPresetFor } from '../onboardingPreset.ts';
import { lessonForDay } from '../../features/lessons/domain/lessonCatalogue.ts';
import { pressureLessonTrackForIntent } from '../../features/lessons/domain/pressureLessonTrack.ts';
import { phoneLessonTrackForIntent } from '../../features/lessons/domain/phoneLessonTrack.ts';

const INTENTS = ['cleaning', 'sleep', 'energy', 'focus', 'stress_relief', 'calm_fast',
  'emotional_balance', 'self_care', 'self_acceptance', 'daily_habit', 'burnout', 'scrolling',
  'procrastination', 'spiritual', 'yoga', 'heart_health', 'other'];

test('every goal outlines seven real days', () => {
  for (const intent of INTENTS) {
    const days = paywallPlanOutline(onboardingPresetFor(intent), intent).filter((item) => item.kind === 'day');
    assert.deepEqual(days.map((item) => item.day), [1, 2, 3, 4, 5, 6, 7], intent);
    for (const day of days) assert.ok(day.title && day.line, `${intent} day ${day.day}`);
  }
});

test('outline copy never uses the words kept out of plan copy', () => {
  for (const intent of INTENTS) {
    for (const item of paywallPlanOutline(onboardingPresetFor(intent), intent)) {
      const copy = item.kind === 'day' ? `${item.title} ${item.line}` : item.outcome;
      assert.doesNotMatch(copy, /\breset\b|breathwork/i, `${intent}: ${copy}`);
    }
  }
});

const PRESETS = [
  ...INTENTS.map((intent) => [intent, onboardingPresetFor(intent)]),
  ['sleep', onboardingPresetFor('sleep', { sleepCause: 'phone' })],
  ['energy', onboardingPresetFor('energy', { followUpAnswers: { when_energy: ['constant'] } })],
];

test('every first-week lesson of every plan and track has authored sales copy', () => {
  for (const [intent, preset] of PRESETS) {
    for (let day = 1; day <= 7; day += 1) {
      const lesson = lessonForDay(preset.id, day, preset.revision, pressureLessonTrackForIntent(intent), phoneLessonTrackForIntent(intent));
      assert.ok(PLAN_OUTLINE_COPY[lesson.id], `${intent} day ${day}: ${lesson.id}`);
    }
  }
});

test('sales copy fits its card and each plan reads as seven different days', () => {
  for (const { title, line } of Object.values(PLAN_OUTLINE_COPY)) {
    assert.ok(title.length <= 30, title);
    assert.ok(line.length <= 80, line);
    assert.match(line, /\.$/, line);
  }
  for (const [intent, preset] of PRESETS) {
    const titles = paywallPlanOutline(preset, intent).filter((item) => item.kind === 'day').map((item) => item.title);
    assert.equal(new Set(titles).size, 7, `${intent}: ${titles.join(', ')}`);
  }
});

test('callouts sit right after days 3, 5, and 7 and never look past the first week', () => {
  for (const [intent, preset] of PRESETS) {
    const outline = paywallPlanOutline(preset, intent);
    const dreams = outline.filter((item) => item.kind === 'dream');
    assert.deepEqual(dreams.map((item) => item.day), [3, 5, 7], intent);
    for (const dream of dreams) {
      const before = outline[outline.indexOf(dream) - 1];
      assert.equal(before.kind, 'day', intent);
      assert.equal(before.day, dream.day, intent);
      assert.ok(dream.outcome.length <= 80, dream.outcome);
      assert.doesNotMatch(dream.outcome, /\breset\b|breathwork/i, dream.outcome);
    }
  }
});
