import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('./OnboardingFlow.tsx', import.meta.url), 'utf8');
const start = source.indexOf("  if (step === 'pact' || step === 'paywall') {");
const end = source.indexOf('\n  return (\n    <IntentQuestionScreen', start);
assert.ok(start >= 0 && end > start, 'the handoff branch exists');
const compiled = ts.transpileModule(`export function render() { ${source.slice(start, end)} }`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function handoff(patch = {}) {
  const noop = () => {};
  const jsx = (type, props, key) => ({ type, props, key });
  const state = {
    exports: {},
    require: name => {
      assert.equal(name, 'react/jsx-runtime');
      return { jsx, jsxs: jsx };
    },
    View: 'View', PactScreen: 'PactScreen', OnboardingPaywallScreen: 'Paywall', ExitOfferSheet: 'ExitOffer',
    StyleSheet: { absoluteFill: { position: 'absolute' } },
    step: 'pact', showPactDuringHandoff: false, showPaywallLoadingFallback: false,
    dailyMinutes: 5, name: 'Sam', visualStepIndex: 10, visualStepCount: 10,
    isSubmitting: false, isSavingProfile: false, isCompletingOnboarding: false, errorMessage: null,
    celebrationFinishedRef: { current: noop }, saveProfileAndSeal: noop, goBack: noop,
    plan: { intent: 'focus' }, onboardingPreset: {}, selectedIntents: [], primaryIntent: 'focus',
    intentFollowUpAnswers: {}, planMindMap: { scores: [] }, chosenGoalPhrase: noop, stakesBenefitFor: noop,
    paywallMode: 'hard', isPro: false, continueWithoutPro: noop,
    purchaseSelectedPackage: noop, restorePurchases: noop, finish: noop,
    isExitOfferVisible: false, exitOfferTrigger: null, setIsExitOfferVisible: noop, setHasReachedPlanStep: noop,
    paywall: { offering: null, isLoading: true, errorMessage: null, selectPackage: noop, retryRevenueCatSync: noop, trackStepViewed: noop },
    ...patch,
  };
  state.setShowPactDuringHandoff = value => { state.showPactDuringHandoff = value; };
  state.setShowPaywallLoadingFallback = value => { state.showPaywallLoadingFallback = value; };
  vm.runInNewContext(compiled, state);
  return { state, render: () => state.exports.render() };
}

const child = (tree, index) => tree.props.children[index];
const screen = wrapper => wrapper?.props.children;

test('confirm and pending handoff retain the same keyed pact at the same sibling position', () => {
  const flow = handoff();
  const before = flow.render();
  const pact = child(before, 0);
  assert.equal(pact.key, 'pact');
  assert.equal(screen(pact).type, 'PactScreen');
  screen(pact).props.onConfirm();
  flow.state.step = 'paywall';
  const pending = flow.render();
  assert.equal(child(pending, 0).key, pact.key);
  assert.equal(child(pending, 0).type, pact.type);
  assert.equal(screen(child(pending, 0)).type, screen(pact).type);
  assert.equal(child(pending, 0).props.pointerEvents, 'none');
  assert.equal(child(pending, 1), null);
});

test('resolved offering mounts over the pact and only readiness releases the underlay', () => {
  const flow = handoff({ step: 'paywall', showPactDuringHandoff: true });
  flow.state.paywall.offering = { packages: [] };
  const preparing = flow.render();
  assert.equal(child(preparing, 0).key, 'pact');
  assert.equal(child(preparing, 1).key, 'paywall');
  const paywall = screen(child(preparing, 1));
  assert.equal(paywall.type, 'Paywall');
  assert.equal(flow.state.showPactDuringHandoff, true);
  paywall.props.onReady();
  const ready = flow.render();
  assert.equal(child(ready, 0), null);
  assert.equal(child(ready, 1).key, 'paywall');
});

test('a resumed direct paywall mounts immediately without constructing a pact underlay', () => {
  const flow = handoff({ step: 'paywall' });
  const tree = flow.render();
  assert.equal(child(tree, 0), null);
  assert.equal(screen(child(tree, 1)).type, 'Paywall');
});

test('loading recovery and offer errors expose the paywall while retaining the celebration until ready', () => {
  for (const reason of ['fallback', 'error']) {
    const flow = handoff({ step: 'paywall', showPactDuringHandoff: true });
    if (reason === 'fallback') flow.state.showPaywallLoadingFallback = true;
    else flow.state.paywall.errorMessage = 'Offline';
    const tree = flow.render();
    assert.equal(screen(child(tree, 0)).type, 'PactScreen');
    assert.equal(screen(child(tree, 1)).type, 'Paywall');
    assert.equal(flow.state.showPactDuringHandoff, true);
  }
});
