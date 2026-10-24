import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SLIDER_MAX,
  SLIDER_MIN,
  drainedFrequencyFromSlider,
  lifestyleHappinessFromSlider,
  routineHappinessFromSlider,
} from './sliderAnswers.ts';

test('each slider reads back as the answer ids the plan already uses, across the whole scale', () => {
  const values = Array.from({ length: SLIDER_MAX - SLIDER_MIN + 1 }, (_, index) => SLIDER_MIN + index);
  assert.deepEqual(values.map(routineHappinessFromSlider),
    ['none', 'none', 'shaky', 'shaky', 'fine', 'fine', 'love', 'love', 'love']);
  assert.deepEqual(values.map(drainedFrequencyFromSlider),
    ['rarely', 'rarely', 'weekly', 'weekly', 'weekly', 'mostDays', 'mostDays', 'daily', 'daily']);
  assert.deepEqual(values.map(lifestyleHappinessFromSlider),
    ['unhappy', 'unhappy', 'better', 'better', 'okay', 'okay', 'love', 'love', 'love']);
});
