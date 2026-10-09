import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./OnboardingFlow.tsx', import.meta.url), 'utf8');
const showSource = source.slice(
  source.indexOf('  const showExitOffer = useCallback('),
  source.indexOf('\n  const intentFollowUps = useMemo('),
);
const idleSource = source.slice(
  source.lastIndexOf('  useEffect(() => {', source.indexOf('const id = setTimeout(() => showExitOffer')),
  source.indexOf('\n  const toggleIntent ='),
);
const purchaseSource = source.slice(
  source.indexOf('  const purchaseSelectedPackage = async'),
  source.indexOf('\n  const restorePurchases = async'),
);

function runSnippet(snippet, dependencies) {
  const js = ts.transpileModule(snippet, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(...Object.keys(dependencies), js)(...Object.values(dependencies));
}

function offerHarness(paywallMode) {
  const shown = [];
  const finished = [];
  const selected = [];
  const timers = new Map();
  let now = 0;
  let nextTimer = 0;
  let cleanup;
  const state = {
    step: 'paywall', paywallMode, isPro: false, hasReachedPlanStep: true,
    isExitOfferVisible: false, isSubmitting: false,
    hasAutoShownExitOfferRef: { current: false },
    paywall: {
      isPurchasing: false, isRestoring: false,
      selectPackage: (id) => selected.push(id),
      purchaseSelectedPackage: async () => ({ status: 'cancelled' }),
    },
  };
  const showExitOffer = runSnippet(`${showSource}\nreturn showExitOffer;`, {
    useCallback: (callback) => callback,
    hasAutoShownExitOfferRef: state.hasAutoShownExitOfferRef,
    setExitOfferTrigger: (trigger) => shown.push(trigger),
    setIsExitOfferVisible: (visible) => { state.isExitOfferVisible = visible; },
  });
  function render(patch = {}) {
    cleanup?.();
    Object.assign(state, patch);
    runSnippet(idleSource, {
      ...state, showExitOffer, EXIT_OFFER_IDLE_MS: 40_000,
      useEffect: (effect) => { cleanup = effect(); },
      setTimeout: (callback, delay) => {
        const id = ++nextTimer;
        timers.set(id, { callback, due: now + delay });
        return id;
      },
      clearTimeout: (id) => timers.delete(id),
    });
  }
  function advance(milliseconds) {
    now += milliseconds;
    for (const [id, timer] of timers) {
      if (timer.due > now) continue;
      timers.delete(id);
      timer.callback();
    }
  }
  async function purchase(result = { status: 'cancelled' }) {
    state.paywall.purchaseSelectedPackage = async (id) => {
      assert.equal(id, 'annual');
      return result;
    };
    const buy = runSnippet(`${purchaseSource}\nreturn purchaseSelectedPackage;`, {
      ...state, showExitOffer, finish: async (path) => finished.push(path),
    });
    await buy('annual');
  }
  return { state, shown, finished, selected, render, advance, purchase, unmount: () => cleanup?.() };
}

for (const mode of ['soft', 'hard']) {
  test(`${mode} onboarding shows the offer immediately after store cancellation, once per session`, async () => {
    const flow = offerHarness(mode);
    flow.render();
    await flow.purchase();
    assert.deepEqual(flow.shown, ['purchase_cancelled']);
    assert.equal(flow.state.isExitOfferVisible, true);
    assert.deepEqual(flow.selected, ['annual']);
    flow.render({ isExitOfferVisible: false });
    await flow.purchase();
    flow.advance(80_000);
    assert.deepEqual(flow.shown, ['purchase_cancelled']);
    assert.deepEqual(flow.finished, []);
  });

  test(`${mode} onboarding waits 40 seconds on the plan step and then shows the offer once`, async () => {
    const flow = offerHarness(mode);
    flow.render();
    flow.advance(39_999);
    assert.deepEqual(flow.shown, []);
    flow.advance(1);
    assert.deepEqual(flow.shown, ['idle']);
    flow.render({ isExitOfferVisible: false });
    flow.advance(80_000);
    await flow.purchase();
    assert.deepEqual(flow.shown, ['idle']);
  });

  test(`${mode} onboarding resets idle time after purchase, restore, or submission`, () => {
    for (const busy of ['isPurchasing', 'isRestoring', 'isSubmitting']) {
      const flow = offerHarness(mode);
      flow.render();
      flow.advance(30_000);
      const owner = busy === 'isSubmitting' ? flow.state : flow.state.paywall;
      owner[busy] = true;
      flow.render();
      flow.advance(60_000);
      assert.deepEqual(flow.shown, [], busy);
      owner[busy] = false;
      flow.render();
      flow.advance(39_999);
      assert.deepEqual(flow.shown, [], busy);
      flow.advance(1);
      assert.deepEqual(flow.shown, ['idle'], busy);
    }
  });

  test(`${mode} onboarding skips idle offers outside the plan step, for Pro, or while an offer is open`, () => {
    for (const patch of [
      { step: 'intent' }, { hasReachedPlanStep: false },
      { isPro: true }, { isExitOfferVisible: true },
    ]) {
      const flow = offerHarness(mode);
      flow.render(patch);
      flow.advance(80_000);
      assert.deepEqual(flow.shown, []);
    }
    for (const leave of [
      (flow) => flow.render({ step: 'intent' }),
      (flow) => flow.unmount(),
    ]) {
      const flow = offerHarness(mode);
      flow.render();
      flow.advance(30_000);
      leave(flow);
      flow.advance(80_000);
      assert.deepEqual(flow.shown, []);
    }
  });

  test(`${mode} onboarding only counters cancellation for free users and still completes successful purchases`, async () => {
    for (const result of [{ status: 'failed' }, { status: 'purchased', isPro: false }]) {
      const flow = offerHarness(mode);
      await flow.purchase(result);
      assert.deepEqual(flow.shown, []);
      assert.deepEqual(flow.finished, []);
    }
    const pro = offerHarness(mode);
    pro.state.isPro = true;
    await pro.purchase();
    assert.deepEqual(pro.shown, []);
    const success = offerHarness(mode);
    await success.purchase({ status: 'purchased', isPro: true });
    assert.deepEqual(success.shown, []);
    assert.deepEqual(success.finished, ['purchase']);
  });
}
