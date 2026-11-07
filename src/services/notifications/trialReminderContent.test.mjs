import assert from 'node:assert/strict';
import test from 'node:test';
import { ONBOARDING_INTENT_LOOKUP_OPTIONS } from '../../components/onboarding/data/intentOptions.ts';
import { buildIntentTitleLookup, resolvePlanIntent } from '../../lib/planProgress.ts';
import { buildTrialEndingContent } from './notificationCatalog.ts';

const end = new Date(2026, 10, 10, 12);
const PLAIN = {
  title: 'Your Azora trial renews Nov 10',
  body: 'Here’s the reminder we promised. Review or cancel anytime before then.',
};
const text = (recap, goal) => {
  const { title, body } = buildTrialEndingContent(end, recap, goal);
  return { title, body };
};

test('the title leads with the goal and the largest count, and the rest goes in the body', () => {
  assert.deepEqual(text({ planSteps: 3, todos: 16, checkIns: 2 }, 'cleaning'), {
    title: 'Your plan for a tidy home: 16 to-dos done',
    body: 'Plus 3 plan steps and 2 check-ins. Your trial renews Nov 10. Review or cancel anytime.',
  });
  assert.deepEqual(text({ planSteps: 1, todos: 0, checkIns: 0 }, 'sleep'), {
    title: 'Your plan for better sleep: 1 plan step done',
    body: 'Your trial renews Nov 10. Review or cancel anytime.',
  });
  assert.deepEqual(text({ planSteps: 1, todos: 1, checkIns: 3 }, 'stress_relief'), {
    title: 'Your plan for less stress: 3 check-ins done',
    body: 'Plus 1 plan step and 1 to-do. Your trial renews Nov 10. Review or cancel anytime.',
  });
});

test('a tie keeps plan steps first', () => {
  assert.equal(text({ planSteps: 2, todos: 2, checkIns: 0 }, 'focus').title, 'Your plan for better focus: 2 plan steps done');
});

test('no named goal drops only the goal', () => {
  const recap = { planSteps: 0, todos: 5, checkIns: 0 };
  for (const goal of ['other', null, undefined]) {
    assert.deepEqual(text(recap, goal), {
      title: 'Your plan: 5 to-dos done',
      body: 'Your trial renews Nov 10. Review or cancel anytime.',
    });
  }
});

test('no activity or failed counts keep the plain promised reminder for every goal', () => {
  assert.deepEqual(text({ planSteps: 0, todos: 0, checkIns: 0 }, 'cleaning'), PLAIN);
  assert.deepEqual(text(null, 'sleep'), PLAIN);
  assert.deepEqual(text(undefined), PLAIN);
});

test('every goal reads as a real title and always states the renewal date and cancel', () => {
  for (const { id } of ONBOARDING_INTENT_LOOKUP_OPTIONS) {
    const { title, body } = text({ planSteps: 1, todos: 2, checkIns: 3 }, id);
    assert.doesNotMatch(title, /undefined/, id);
    assert.match(title, /^Your plan.*: 3 check-ins done$/, id);
    assert.match(body, /Your trial renews Nov 10\. Review or cancel anytime\.$/, id);
  }
});

test('goal text saved by older builds reaches its plan name', () => {
  const lookup = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);
  const cases = {
    'Keeping my home tidy': 'a tidy home', 'Reduce stress': 'less stress',
    'Stop my procrastination': 'less putting things off', 'Sleep better': 'better sleep',
    'I struggle to keep my space clean': 'a tidy home', 'Boost energy': 'more energy',
    'Focus & study': 'better focus',
    // The older wording was mapped to the routine plan, so the title matches the plan they have.
    'I procrastinate': 'a steady routine',
  };
  for (const [saved, name] of Object.entries(cases)) {
    const goal = resolvePlanIntent(saved, lookup);
    assert.equal(text({ planSteps: 1, todos: 0, checkIns: 0 }, goal).title, `Your plan for ${name}: 1 plan step done`, saved);
  }
});
