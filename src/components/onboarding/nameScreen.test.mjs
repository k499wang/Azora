import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const screen = readFileSync(
  new URL('./screens/NameScreen.tsx', import.meta.url),
  'utf8',
);
const flow = readFileSync(
  new URL('./OnboardingFlow.tsx', import.meta.url),
  'utf8',
);

test('the name is asked once in the personalization flow', () => {
  const orderSource = flow.slice(
    flow.indexOf('const STEP_ORDER'),
    flow.indexOf('const BASE_STEP_INDEX'),
  );
  const steps = [...orderSource.matchAll(/'([^']+)'/g)].map((m) => m[1]);

  assert.equal(steps.filter((step) => step === 'name').length, 1);
  assert.equal(steps[steps.indexOf('name') - 1], 'azoChat');
  assert.equal(steps[steps.indexOf('name') + 1], 'greeting');
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

test('name actions wait for the greeting image to be ready', () => {
  const compiled = ts.transpileModule(screen, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  let haptics = 0;
  let continues = 0;
  let skips = 0;
  const element = (type, props) => ({ type, props });
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element };
      if (name === 'react-native') return { StyleSheet: { create: styles => styles } };
      if (name.endsWith('/common/Text')) return { Text: 'Text', TextInput: 'TextInput' };
      if (name.endsWith('/entranceTiming')) return { entranceTiming: { promptDelay: 0 } };
      if (name.endsWith('/colors')) return { colors: { text: {}, border: {}, background: {} } };
      if (name.endsWith('/spacing')) return { spacing: {} };
      if (name.endsWith('/typography')) return { typography: { input: { text: {} }, body: { small: {} } } };
      if (name.endsWith('/tapHaptics')) return { triggerMediumHaptic: () => { haptics++; } };
      if (['AzoAside', 'OnboardingScreenLayout', 'OnboardingPrimaryButton'].some(component => name.endsWith(`/${component}`))) {
        return { default: name.split('/').at(-1) };
      }
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const render = greetingReady => exports.default({
    value: '', greetingReady, stepIndex: 1, stepCount: 2,
    onChange() {}, onBack() {},
    onContinue: () => { continues++; },
    onSkip: () => { skips++; },
  });

  const waiting = render(false);
  assert.equal(waiting.props.footer.props.disabled, true);
  assert.equal(waiting.props.onSkip, undefined);
  waiting.props.children[0].props.onSubmitEditing();
  assert.equal(haptics, 0);
  assert.equal(continues, 0);

  const ready = render(true);
  assert.equal(ready.props.footer.props.disabled, false);
  ready.props.children[0].props.onSubmitEditing();
  assert.equal(haptics, 1);
  assert.equal(continues, 1);
  ready.props.footer.props.onPress();
  assert.equal(continues, 2);
  ready.props.onSkip();
  assert.equal(skips, 1);
});
