import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { adjacentOnboardingStep, onboardingStepOrder, shouldShowAdhdSupport } from './onboardingStepOrder.ts';
import { ADHD_STATUS_OPTIONS, MENTAL_HEALTH_OPTIONS } from './data/routineOptions.ts';

const flow = readFileSync(new URL('./OnboardingFlow.tsx', import.meta.url), 'utf8');

test('diagnosed and suspected ADHD get support before diagnoses; no or skipped answers do not', () => {
  for (const status of ['diagnosed', 'suspected', 'no', null]) {
    const steps = onboardingStepOrder('focus', 1, 3, status);
    const positive = status === 'diagnosed' || status === 'suspected';
    assert.equal(shouldShowAdhdSupport(status), positive);
    assert.equal(steps.includes('adhdSupport'), positive);
    assert.equal(adjacentOnboardingStep(steps, 'scienceCredibility', 'forward'), 'adhdStatus');
    assert.equal(adjacentOnboardingStep(steps, 'adhdStatus', 'forward'), positive ? 'adhdSupport' : 'mentalHealth');
    assert.equal(adjacentOnboardingStep(steps, 'mentalHealth', 'back'), positive ? 'adhdSupport' : 'adhdStatus');
    assert.equal(adjacentOnboardingStep(steps, 'mentalHealth', 'forward'), 'struggles');
    if (positive) {
      assert.equal(adjacentOnboardingStep(steps, 'adhdSupport', 'back'), 'adhdStatus');
      assert.equal(adjacentOnboardingStep(steps, 'adhdSupport', 'forward'), 'mentalHealth');
    }
  }
});

test('changing a positive ADHD answer to no or skipping removes support immediately', () => {
  const start = flow.indexOf('  const advanceAdhdStatus = (');
  const bodyStart = flow.indexOf(') => {', start) + ') => {'.length;
  const bodyEnd = flow.indexOf('\n  };', bodyStart);
  const body = flow.slice(bodyStart, bodyEnd);
  const transitions = [];
  let selected = 'diagnosed';
  const advance = new Function(
    'setAdhdStatus', 'onboardingStepOrder', 'adjacentOnboardingStep', 'goToStep',
    'primaryIntent', 'selectedIntents', 'intentFollowUps', 'mode', 'hasAzoChat',
    `return (answer, action) => {${body}};`,
  )(
    (answer) => { selected = answer; }, onboardingStepOrder, adjacentOnboardingStep,
    (...args) => transitions.push(args), 'focus', ['focus'], [{}, {}, {}], 'standard', true,
  );
  // The handler receives the freshly tapped ID before React can rerender.
  for (const answer of ['diagnosed', 'suspected', 'no']) {
    advance(answer, 'continue');
    assert.equal(selected, answer);
    assert.deepEqual(transitions.at(-1), [answer === 'no' ? 'mentalHealth' : 'adhdSupport', 'continue', { adhd_status: answer }]);
  }
  advance('diagnosed', 'continue');
  advance(null, 'skip');
  assert.equal(selected, null);
  assert.deepEqual(transitions.at(-1), ['mentalHealth', 'skip', { adhd_status: null }]);
});

test('ADHD status stays a separate optional answer rather than a diagnosis-list selection', () => {
  assert.deepEqual(ADHD_STATUS_OPTIONS.map(({ id }) => id), ['diagnosed', 'suspected', 'no']);
  assert.ok(ADHD_STATUS_OPTIONS.every(({ icon }) => icon == null));
  assert.equal(MENTAL_HEALTH_OPTIONS.some(({ id }) => id === 'adhd'), false);
  assert.match(flow, /question="Do you have ADHD or do you suspect you have it\?"/);
  assert.match(flow, /note="Your answer helps us better understand your needs"/);
  assert.match(flow, /selectedIds=\{adhdStatus \? \[adhdStatus\] : \[\]\}/);
  assert.match(flow, /onSelect=\{setAdhdStatus\}/);
  assert.match(flow, /onContinue=\{\(id\) => advanceAdhdStatus\(id \?\? adhdStatus, 'continue'\)\}/);
  assert.match(flow, /onSkip=\{\(\) => advanceAdhdStatus\(null, 'skip'\)\}/);
  assert.match(flow, /adhdStatus,\s*mentalHealth,/);
  assert.doesNotMatch(flow, /mentalHealth.includes\('adhd'\)/);
});
