import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const screen = readFileSync(
  new URL('./screens/NameScreen.tsx', import.meta.url),
  'utf8',
);
const flow = readFileSync(
  new URL('./OnboardingFlow.tsx', import.meta.url),
  'utf8',
);

test('the name is asked once, before the reading it belongs to', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );
  const steps = [...orderSource.matchAll(/'([^']+)'/g)].map((m) => m[1]);

  assert.equal(steps.filter((step) => step === 'name').length, 1);
  assert.equal(steps[steps.indexOf('name') - 1], 'goalProof');
  assert.equal(steps[steps.indexOf('name') + 1], 'greeting');
  // The reading happens after the name is known.
  assert.ok(steps.indexOf('name') < steps.indexOf('baseline'));
  // One render site, so there is no second copy of the question to keep in step.
  assert.equal(flow.split("if (step === 'name')").length - 1, 1);
});

test('both ways of committing the name buzz', () => {
  // The button's own knock comes from `ChunkyButton` via the default haptics.
  assert.doesNotMatch(screen, /enableHaptics=\{false\}/);
  assert.match(
    screen,
    /const handleContinue = \(\) => \{[\s\S]*?triggerMediumHaptic\(\)[\s\S]*?onContinue\(\)/,
  );
  // The keyboard's done key commits the same answer, so it routes through it.
  assert.match(screen, /onSubmitEditing=\{handleContinue\}/);
});
