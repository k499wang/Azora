import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAssessmentSynthesis,
  formatGoalList,
} from './onboardingAssessmentReflection.ts';

test('formatGoalList handles zero through three goals', () => {
  assert.equal(formatGoalList([]), null);
  assert.equal(formatGoalList(['sleep better']), 'sleep better');
  assert.equal(
    formatGoalList(['sleep better', 'reduce stress']),
    'sleep better and reduce stress',
  );
  assert.equal(
    formatGoalList(['sleep better', 'reduce stress', 'build a habit']),
    'sleep better, reduce stress, and build a habit',
  );
});

test('formatGoalList summarizes five goals with etc after the first three', () => {
  assert.equal(
    formatGoalList(['one', 'two', 'three', 'four', 'five']),
    'one, two, three, etc',
  );
});

test('formatGoalList trims, drops empty values, and deduplicates in order', () => {
  assert.equal(
    formatGoalList(['  sleep better ', '', 'reduce stress', 'sleep better', '  ']),
    'sleep better and reduce stress',
  );
});

const BASE_INPUT = {
  stress: null,
  sleep: null,
  heartWorry: null,
  agreementResponses: {
    exhausted: null,
    racing: null,
    reactive: null,
  },
  primaryPlan: null,
  goalPhrases: [],
};

test('buildAssessmentSynthesis uses the primary plan when supplied', () => {
  const result = buildAssessmentSynthesis({
    ...BASE_INPUT,
    primaryPlan: 'We will use the selected plan.',
  });

  assert.match(result, /We will use the selected plan\./);
  assert.doesNotMatch(result, /focus and performance/);
});

for (const { name, input, expected } of [
  {
    name: 'sleep fallback',
    input: { stress: 2, sleep: 4 },
    expected: 'We’ll start with a gentle evening reset to help your body wind down.',
  },
  {
    name: 'high-stress fallback',
    input: { stress: 8, sleep: 9 },
    expected: 'We’ll start with quick calming techniques and longer exhales.',
  },
  {
    name: 'mid-stress fallback',
    input: { stress: 5, sleep: 9 },
    expected: 'We’ll start with short daily resets you can use anywhere.',
  },
  {
    name: 'steady fallback',
    input: { stress: 2, sleep: 9 },
    expected: 'We’ll start with steady resets for focus and performance.',
  },
]) {
  test(`buildAssessmentSynthesis uses the ${name}`, () => {
    const result = buildAssessmentSynthesis({ ...BASE_INPUT, ...input });
    assert.match(result, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
}

for (const { name, stress, sleep, expected } of [
  {
    name: 'high stress and low sleep',
    stress: 8,
    sleep: 4,
    expected: 'High stress and light sleep are reinforcing each other right now.',
  },
  {
    name: 'high stress and mid sleep',
    stress: 8,
    sleep: 6,
    expected: 'Stress is the strongest signal, and it may be starting to affect your sleep.',
  },
  {
    name: 'high stress and good sleep',
    stress: 8,
    sleep: 9,
    expected: 'Stress is elevated, but solid sleep gives us a strong base to work from.',
  },
  {
    name: 'mid stress and low sleep',
    stress: 5,
    sleep: 4,
    expected: 'Your stress looks manageable, but light sleep is limiting your recovery.',
  },
  {
    name: 'mid stress and good sleep',
    stress: 5,
    sleep: 9,
    expected: 'You’re carrying some steady background tension.',
  },
  {
    name: 'low stress and low sleep',
    stress: 2,
    sleep: 4,
    expected: 'Your daytime stress is low, but light sleep is limiting your recovery.',
  },
  {
    name: 'steady base',
    stress: 2,
    sleep: 9,
    expected: 'You’re starting from a steady base.',
  },
]) {
  test(`buildAssessmentSynthesis uses the ${name} opener`, () => {
    const result = buildAssessmentSynthesis({
      ...BASE_INPUT,
      stress,
      sleep,
    });
    assert.ok(result.startsWith(expected));
  });
}

test('buildAssessmentSynthesis omits the opener when both sliders are unanswered', () => {
  const result = buildAssessmentSynthesis(BASE_INPUT);

  assert.equal(
    result,
    'We’ll start with steady resets for focus and performance.',
  );
});

for (const { name, input, expected } of [
  {
    name: 'stress-only high',
    input: { stress: 8 },
    expected: 'Stress has been running high this week.',
  },
  {
    name: 'stress-only mid',
    input: { stress: 5 },
    expected: 'You’re carrying some steady background tension.',
  },
  {
    name: 'stress-only low',
    input: { stress: 2 },
    expected: 'Your stress level looks fairly steady.',
  },
  {
    name: 'sleep-only low',
    input: { sleep: 4 },
    expected: 'Light sleep seems to be limiting your recovery.',
  },
  {
    name: 'sleep-only mid',
    input: { sleep: 6 },
    expected: 'Your sleep is decent, with some room for better recovery.',
  },
  {
    name: 'sleep-only good',
    input: { sleep: 9 },
    expected: 'Your sleep gives us a strong base to work from.',
  },
]) {
  test(`buildAssessmentSynthesis uses the ${name} opener`, () => {
    const result = buildAssessmentSynthesis({ ...BASE_INPUT, ...input });
    assert.ok(result.startsWith(expected));
  });
}

test('buildAssessmentSynthesis does not treat null sleep as low sleep', () => {
  const result = buildAssessmentSynthesis({ ...BASE_INPUT, stress: 8 });

  assert.match(result, /quick calming techniques and longer exhales/);
  assert.doesNotMatch(result, /evening breathing/);
});

test('buildAssessmentSynthesis omits heart worry below seven', () => {
  const result = buildAssessmentSynthesis({ ...BASE_INPUT, heartWorry: 6 });

  assert.doesNotMatch(result, /heart health/);
});

test('buildAssessmentSynthesis includes heart worry at seven', () => {
  const result = buildAssessmentSynthesis({ ...BASE_INPUT, heartWorry: 7 });

  assert.match(result, /Your heart health is weighing on you right now\./);
});

const AGREEMENT_CASES = [
  {
    name: 'all agreement concerns',
    agree: ['exhausted', 'racing', 'reactive'],
    expected:
      'You also seem mentally worn down, with a mind and body that stay switched on.',
  },
  {
    name: 'exhausted and racing concerns',
    agree: ['exhausted', 'racing'],
    expected: 'Mental fatigue and a busy mind seem to be feeding each other.',
  },
  {
    name: 'exhausted and reactive concerns',
    agree: ['exhausted', 'reactive'],
    expected: 'You seem both mentally worn down and more reactive than usual.',
  },
  {
    name: 'racing and reactive concerns',
    agree: ['racing', 'reactive'],
    expected: 'Your mind and body both seem to be staying switched on.',
  },
  {
    name: 'exhausted concern',
    agree: ['exhausted'],
    expected: 'Mental fatigue is part of the picture too.',
  },
  {
    name: 'racing concern',
    agree: ['racing'],
    expected: 'Slowing your mind down is part of the challenge too.',
  },
  {
    name: 'reactive concern',
    agree: ['reactive'],
    expected: 'Small stressors seem to be landing harder than you’d like.',
  },
];

for (const { name, agree, expected } of AGREEMENT_CASES) {
  test(`buildAssessmentSynthesis uses the ${name} summary`, () => {
    const agreementResponses = {
      exhausted: agree.includes('exhausted') ? 'agree' : null,
      racing: agree.includes('racing') ? 'agree' : null,
      reactive: agree.includes('reactive') ? 'agree' : null,
    };
    const result = buildAssessmentSynthesis({
      ...BASE_INPUT,
      agreementResponses,
    });

    assert.ok(result.startsWith(expected));
  });
}

test('buildAssessmentSynthesis ignores disagree and null agreement responses', () => {
  const result = buildAssessmentSynthesis({
    ...BASE_INPUT,
    agreementResponses: {
      exhausted: 'disagree',
      racing: null,
      reactive: 'disagree',
    },
  });

  assert.equal(
    result,
    'We’ll start with steady resets for focus and performance.',
  );
});

test('buildAssessmentSynthesis combines high heart worry and agreement concerns once', () => {
  const result = buildAssessmentSynthesis({
    ...BASE_INPUT,
    heartWorry: 7,
    agreementResponses: {
      exhausted: 'agree',
      racing: null,
      reactive: null,
    },
  });

  assert.equal(
    result,
    'Mental strain is part of the picture, and your heart health is weighing on you too. We’ll start with steady resets for focus and performance.',
  );
  assert.doesNotMatch(result, /Mental fatigue is part of the picture too/);
  assert.doesNotMatch(result, /Your heart health is weighing on you right now/);
});

test('buildAssessmentSynthesis omits the goal sentence for empty goals', () => {
  const result = buildAssessmentSynthesis(BASE_INPUT);
  assert.doesNotMatch(result, /You want to/);
});

test('buildAssessmentSynthesis includes formatted goals without em dashes', () => {
  const result = buildAssessmentSynthesis({
    ...BASE_INPUT,
    goalPhrases: ['sleep better', 'reduce stress'],
  });

  assert.match(result, /You want to sleep better and reduce stress\./);
  assert.doesNotMatch(result, /—/);
});

test('buildAssessmentSynthesis punctuates an etc goal summary exactly once', () => {
  const result = buildAssessmentSynthesis({
    ...BASE_INPUT,
    goalPhrases: ['one', 'two', 'three', 'four', 'five'],
  });

  assert.match(result, /You want to one, two, three, etc\./);
  assert.doesNotMatch(result, /etc\.\./);
});
