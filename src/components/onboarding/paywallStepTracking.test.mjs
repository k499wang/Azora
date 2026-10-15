import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, dependencies, globals = {}) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, ...globals,
    require(name) {
      assert.ok(name in dependencies, `Unexpected import: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

function hooks() {
  const slots = [], effects = [];
  let cursor = 0, dirty = false, renderBody;
  const same = (a, b) => a?.length === b?.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => {
        const next = typeof value === 'function' ? value(slots[index]) : value;
        if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; }
      }];
    },
    useMemo(callback, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) slots[index] = { deps, value: callback() };
      return slots[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(callback, deps) {
      const index = cursor++, previous = slots[index];
      if (same(previous?.deps, deps)) return;
      const record = { deps };
      slots[index] = record;
      effects.push(() => { previous?.cleanup?.(); record.cleanup = callback(); });
    },
  };
  return {
    react,
    render(body = renderBody) {
      renderBody = body;
      let result, attempts = 0;
      do {
        assert.ok(attempts++ < 30, 'render settles');
        dirty = false;
        cursor = 0;
        result = body();
        effects.splice(0).forEach(run => run());
      } while (dirty);
      return result;
    },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

const annual = { id: 'annual', trialLabel: '7-day free trial', productIdentifier: 'annual', priceString: '$59.99', priceCents: 5999, currencyCode: 'USD' };
const offering = { offeringIdentifier: 'trial', experimentId: 'experiment', experimentVariant: 'A', paywallLayout: 'deck', packages: [annual] };
const noTrial = { ...offering, packages: [{ ...annual, trialLabel: null }] };
const events = load('../../services/analytics/events.ts', {}).AnalyticsEvent;

function deckHarness(patch = {}) {
  const engine = hooks(), animations = [], timers = new Map(), reports = [];
  let visibilityStart, visibilityStop, tree;
  const props = {
    offering, selectedPackageId: 'annual', paywallMode: 'soft',
    onStepViewed: view => reports.push({ ...view }), ...patch,
  };
  const animation = () => {
    let callback, stopped = false;
    const handle = {
      start(next) { callback = next; animations.push(handle); },
      stop() { stopped = true; callback?.({ finished: false }); },
      complete(finished = true) { callback?.({ finished: finished && !stopped }); },
    };
    return handle;
  };
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    react: engine.react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
      Animated: { View: 'AnimatedView', Value: class { setValue() {} }, timing: animation, spring: animation, parallel: animation },
      Easing: { bezier() {}, in() {}, out() {} },
      StyleSheet: { create: value => value }, View: 'View', Pressable: 'Pressable', ScrollView: 'ScrollView',
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0 }) },
    '../../../hooks/useWhileVisible': {
      useWhileVisible(start, deps) {
        engine.react.useEffect(() => {
          visibilityStart = () => { visibilityStop = start(); };
          visibilityStart();
          return () => { visibilityStop?.(); visibilityStart = null; };
        }, deps);
      },
    },
    '../entranceTiming': { entranceTiming: { fade: 300 } },
    '../../../theme/card': { card: {} },
    '../../../theme/colors': { colors: { background: {}, text: {}, error: { 100: '', 700: '' }, border: {} } },
    '../../../theme/breakpoints': { dashboardContentColumn: {} },
    '../../../theme/spacing': { spacing: {} },
    '../../../theme/typography': { fonts: {}, scaleType: value => value, typography: { button: {}, body: {}, caption: {} } },
    '../onboardingVisualScale': { scaleControl: value => value },
    '../../../lib/paywall/planPrice': { computeAnnualSavings: () => 0 },
    '../../../lib/paywall/paywallReassurance': { REFUND_REASSURANCE: '' },
    '../paywall/paywallStepStyles': { paywallStepStyles: {} },
  };
  for (const [path, name, defaultExport] of [
    ['../../common/Text', 'Text'], ['../../common/icons/Icon', 'Icon', true],
    ['../OnboardingPrimaryButton', 'Button', true],
    ['../paywall/PaywallChoosePlanStep', 'PaywallChoosePlanStep'],
    ['../paywall/PaywallFreeTrialHeroStep', 'PaywallFreeTrialHeroStep'],
    ['../paywall/PaywallBenefitsStep', 'PaywallBenefitsStep'],
    ['../../paywall/PaywallFooterLinks', 'PaywallFooterLinks'],
    ['../../paywall/NoTrialLongPaywall', 'NoTrialLongPaywall'],
    ['../../paywall/PaywallTrialReminderToggle', 'Toggle', true],
    ['../paywall/PaywallTrialStep', 'PaywallTrialStep'],
  ]) dependencies[path] = { [defaultExport ? 'default' : name]: name };
  const screen = load('./screens/OnboardingPaywallScreen.tsx', dependencies, {
    setTimeout(callback) { const id = timers.size + 1; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
  }).default;
  const deck = screen(props).type;
  function find(predicate, node = tree) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      if (child == null) continue;
      const match = find(predicate, child);
      if (match) return match;
    }
  }
  const harness = {
    reports, animations,
    render(next = {}) { Object.assign(props, next); tree = engine.render(() => deck(props)); return tree; },
    layout() { find(node => node.props?.onLayout).props.onLayout(); },
    entrance(finished = true) {
      [...timers.values()].forEach(callback => callback()); timers.clear();
      animations.at(-1).complete(finished);
    },
    pressNext() { find(node => node.type === 'Button').props.onPress(); },
    pressBack() { find(node => node.props?.accessibilityLabel === 'Go back').props.onPress(); },
    transition(finished = true) {
      animations.at(-1).complete(finished);
      harness.render();
    },
    visible(value) { if (value) visibilityStart?.(); else visibilityStop?.(); },
    unmount: engine.unmount,
    screen: () => screen(props),
  };
  harness.render();
  return harness;
}

test('deck reports only after layout and a successful entrance, once across rerenders', () => {
  const deck = deckHarness();
  assert.deepEqual(deck.reports, []);
  deck.layout();
  assert.deepEqual(deck.reports, []);
  deck.entrance();
  assert.deepEqual(deck.reports, [{ step: 'benefits', index: 1, count: 3 }]);
  deck.layout(); deck.render(); deck.visible(false); deck.visible(true);
  assert.equal(deck.reports.length, 1);
  deck.unmount();
});

test('next and back report only completed entrances and include revisits', () => {
  const deck = deckHarness();
  deck.layout(); deck.entrance();
  deck.pressNext();
  deck.transition(); // Exit commits the next screen, which is still transparent.
  assert.equal(deck.reports.length, 1);
  deck.transition();
  deck.pressNext(); deck.transition(); deck.transition();
  deck.pressBack(); deck.transition(); deck.transition();
  assert.deepEqual(deck.reports, [
    { step: 'benefits', index: 1, count: 3 },
    { step: 'hero', index: 2, count: 3 },
    { step: 'plan', index: 3, count: 3 },
    { step: 'hero', index: 2, count: 3 },
  ]);
  deck.unmount();
});

test('canceled entrances and canceled transitions never report their target', () => {
  const canceled = deckHarness();
  canceled.layout(); canceled.entrance(false);
  assert.deepEqual(canceled.reports, []);
  canceled.unmount();
  const deck = deckHarness();
  deck.layout(); deck.entrance();
  deck.pressNext(); deck.transition(false);
  assert.equal(deck.reports.length, 1);
  deck.pressNext(); deck.transition(); deck.transition(false);
  assert.equal(deck.reports.length, 1);
  deck.unmount();
});

test('background completion waits for foreground and unmount blocks late callbacks', () => {
  const deck = deckHarness();
  deck.layout(); deck.visible(false); deck.entrance();
  assert.deepEqual(deck.reports, []);
  deck.visible(true);
  assert.equal(deck.reports.length, 1);
  deck.pressNext(); deck.transition();
  const entering = deck.animations.at(-1);
  deck.unmount(); entering.complete();
  assert.equal(deck.reports.length, 1);
});

test('direct plan and no-trial decks report plan 1 of 1, and preview reports nothing', () => {
  const direct = deckHarness({ initialStep: 'plan' });
  direct.layout();
  assert.deepEqual(direct.reports, [{ step: 'plan', index: 1, count: 1 }]);
  direct.unmount();
  const compact = deckHarness({ offering: noTrial });
  compact.layout(); compact.entrance();
  assert.deepEqual(compact.reports, [{ step: 'plan', index: 1, count: 1 }]);
  compact.unmount();
  const preview = deckHarness({ preview: true });
  preview.layout(); preview.entrance(); preview.pressNext(); preview.transition(); preview.transition();
  assert.deepEqual(preview.reports, []);
  preview.unmount();
});

test('retry and eligibility changes report the current rendered step', () => {
  const retry = deckHarness({ offering: null, errorMessage: 'Failed' });
  retry.layout(); retry.entrance();
  assert.deepEqual(retry.reports, []);
  retry.render({ offering: noTrial });
  assert.deepEqual(retry.reports, [{ step: 'plan', index: 1, count: 1 }]);
  retry.unmount();
  const eligibility = deckHarness();
  eligibility.layout(); eligibility.visible(false); eligibility.entrance();
  eligibility.render({ offering: noTrial }); eligibility.visible(true);
  assert.deepEqual(eligibility.reports, [{ step: 'plan', index: 1, count: 1 }]);
  eligibility.unmount();
});

test('long layout routes around the deck', () => {
  const deck = deckHarness();
  deck.render({ offering: { ...offering, paywallLayout: 'long' } });
  assert.equal(deck.screen().type, 'NoTrialLongPaywall');
  assert.deepEqual(deck.reports, []);
  deck.unmount();
});

function paywallHarness() {
  const engine = hooks(), captures = [];
  let resolveOffering, rejectOffering;
  const result = new Promise((resolve, reject) => { resolveOffering = resolve; rejectOffering = reject; });
  const user = { id: 'user' };
  const auth = selector => selector({ user });
  auth.getState = () => ({ user });
  const options = { placement: 'onboarding_complete', sourceScreen: 'onboarding', enabled: true };
  const paywall = load('../../hooks/usePaywall.ts', {
    react: engine.react,
    '@tanstack/react-query': { useQueryClient: () => ({}) },
    '../config/posthog': { posthog: { capture: (event, properties) => captures.push({ event, ...properties }) } },
    '../services/analytics/events': { AnalyticsEvent: events },
    '../services/debug/revenueCatDebugSnapshot': { logRevenueCatDebugSnapshot() {} },
    '../services/paywall': {
      ...load('../../services/paywall/paywallEvents.ts', {}),
      getCachedPaywallOffering: () => ({ offering, revenueCatPackages: {} }),
      getPaywallOffering: () => result,
    },
    '../services/subscriptions/revenueCatIdentitySync': { syncRevenueCatAttributionForCurrentUser: () => Promise.resolve(true) },
    '../stores/authStore': { useAuthStore: auth },
    '../stores/revenueCatIdentityStore': { useRevenueCatIdentityStore: selector => selector({ status: 'ready', appUserId: 'user', lastErrorMessage: null, lastUnavailableReason: null }) },
    '../queries/subscriptions/entitlementCache': {},
    '../services/subscriptions/revenueCatClient': {},
    '../services/reviews/reviewPromptState': {},
  }).usePaywall;
  return {
    captures,
    render(patch = {}) { Object.assign(options, patch); return engine.render(() => paywall(options)); },
    async ready() { resolveOffering({ offering, revenueCatPackages: {} }); await result; await Promise.resolve(); return this.render(); },
    async fail() {
      rejectOffering(new Error('Offline'));
      await result.catch(() => {});
      await Promise.resolve();
      return this.render();
    },
    unmount: engine.unmount,
    views: () => captures.filter(capture => capture.event === events.PaywallStepViewed),
  };
}

test('cached deck visits queue in order until canonical metadata is ready', async () => {
  const harness = paywallHarness();
  let paywall = harness.render();
  paywall.trackStepViewed({ step: 'benefits', index: 1, count: 3 });
  paywall = harness.render();
  paywall.trackStepViewed({ step: 'hero', index: 2, count: 3 });
  harness.render();
  assert.deepEqual(harness.views(), []);
  paywall = await harness.ready();
  assert.deepEqual(harness.views().map(view => view.paywall_step), ['benefits', 'hero']);
  const view = harness.views()[0];
  assert.ok(view.paywall_view_id);
  assert.equal(view.paywall_view_id, harness.views()[1].paywall_view_id);
  assert.equal(view.offering_id, 'trial');
  assert.equal(view.experiment_variant, 'A');
  assert.equal(view.annual_price_cents, 5999);
  assert.equal(view.paywall_layout, 'deck');
  assert.equal(view.paywall_step_index, 1);
  assert.equal(view.paywall_step_count, 3);
  paywall.trackStepViewed({ step: 'hero', index: 2, count: 3 }); harness.render();
  assert.equal(harness.views().length, 2);
  paywall.trackStepViewed({ step: 'benefits', index: 1, count: 3 }); harness.render();
  assert.equal(harness.views().length, 3);
  harness.render();
  assert.equal(harness.views().length, 3);
  assert.equal(harness.captures.filter(capture => capture.event === events.PaywallViewed).length, 1);
  harness.unmount();
});

test('disabling the paywall clears pending visits before offering resolution', async () => {
  const harness = paywallHarness();
  harness.render().trackStepViewed({ step: 'benefits', index: 1, count: 3 });
  harness.render({ enabled: false });
  await harness.ready();
  assert.deepEqual(harness.views(), []);
  await harness.render({ enabled: true });
  await Promise.resolve(); harness.render();
  assert.deepEqual(harness.views(), []);
  harness.unmount();
});

test('a visible cached offering still reports its steps if revalidation fails', async () => {
  const harness = paywallHarness();
  harness.render().trackStepViewed({ step: 'benefits', index: 1, count: 3 });
  harness.render();
  const paywall = await harness.fail();
  assert.equal(paywall.errorMessage, null);
  assert.equal(harness.views().length, 1);
  assert.ok(harness.views()[0].paywall_view_id);
  assert.equal(harness.views()[0].offering_id, 'trial');
  assert.equal(harness.captures.filter(capture => capture.event === events.PaywallViewed).length, 0);
  assert.equal(harness.captures.filter(capture => capture.event === events.PaywallFailed).length, 1);
  harness.unmount();
});

test('unmounting while metadata is pending never flushes those visits', async () => {
  const harness = paywallHarness();
  harness.render().trackStepViewed({ step: 'benefits', index: 1, count: 3 });
  harness.render(); harness.unmount();
  await harness.ready();
  assert.deepEqual(harness.views(), []);
});
