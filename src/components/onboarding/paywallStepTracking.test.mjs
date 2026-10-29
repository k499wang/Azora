import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { onboardingPresetFor } from '../../lib/onboardingPreset.ts';
import { personalizedPaywallPlan } from '../../lib/paywall/paywallLongForm.ts';

test('trial hero shows a decorative gift and personalized plan title without a progress card', () => {
  const today = new Date('2026-10-20T12:00:00Z');
  const jsx = (type, props) => ({ type, props });
  const { PaywallFreeTrialHeroStep } = load('./paywall/PaywallFreeTrialHeroStep.tsx', {
    react: { useState: () => [today] },
    'expo-image': { Image: 'Image' },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '../../../lib/paywall/paywallLongForm': { personalizedPaywallPlan },
    '../../../theme/spacing': { spacing: { sm: 8 } },
    'react-native': { View: 'View', StyleSheet: { create: value => value } },
    '../../common/Text': { Text: 'Text' },
    '../../../services/images/onboardingImageCache': { getOnboardingImageSource: key => key },
    '../onboardingVisualScale': { scaleVisual: value => value },
    './paywallStepStyles': { paywallStepStyles: { stepTitle: { fontSize: 30 } } },
  });
  for (const intent of ['sleep', 'scrolling', 'burnout', 'cleaning', 'energy', 'focus', 'self_care', 'daily_habit', 'stress_relief']) {
    const planPreset = onboardingPresetFor(intent);
    const plan = personalizedPaywallPlan(planPreset, intent, 'Sam', 'feel better', today);
    const hero = PaywallFreeTrialHeroStep({ planPreset, intent, name: 'Sam', goalPhrase: 'feel better' });
    assert.equal(hero.props.children.length, 2);
    const [header, gift] = hero.props.children;
    assert.equal(gift.props.children.type, 'Image');
    assert.equal(gift.props.children.props.source, 'azoGiftBox');
    assert.equal(gift.props.accessible, false);
    assert.equal(gift.props.importantForAccessibility, 'no-hide-descendants');
    assert.equal(header.type, 'View');
    assert.equal(header.props.children.type, 'Text');
    const titleParts = header.props.children.props.children;
    assert.equal(titleParts.map(part => typeof part === 'string' ? part : part.props.children).join(''), `We want you to try your ${plan.planName} plan for free!`);
  }
});

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

const annual = { id: 'annual', title: 'Annual', billingPeriod: 'year', trialLabel: '7-day free trial', productIdentifier: 'annual', priceString: '$59.99', priceCents: 5999, currencyCode: 'USD' };
const offering = { offeringIdentifier: 'trial', experimentId: 'experiment', experimentVariant: 'A', paywallLayout: 'deck', packages: [annual] };
const noTrial = { ...offering, packages: [{ ...annual, trialLabel: null }] };
const events = load('../../services/analytics/events.ts', {}).AnalyticsEvent;

function deckHarness(patch = {}, imageCache = {}, routerOnly = false) {
  const engine = hooks(), animations = [], timers = new Map(), reports = [];
  const timerDelays = new Map();
  const routerEngine = hooks();
  let visibilityStart, visibilityStop, tree;
  const props = {
    offering, selectedPackageId: 'annual', paywallMode: 'soft', planPreset: { id: 'pressure', weeks: 4 },
    onStepViewed: view => reports.push({ ...view }), ...patch,
  };
  const animation = () => {
    let callback, stopped = false;
    const handle = {
      get stopped() { return stopped; },
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
      Animated: { View: 'AnimatedView', Value: class { constructor(value) { this.value = value; } setValue(value) { this.value = value; } }, timing: animation, spring: animation, parallel: animation },
      Easing: { bezier() {}, in() {}, out() {} },
      StyleSheet: { create: value => value }, View: 'View', Pressable: 'Pressable', ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator',
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0 }) },
    'react-native-reanimated': { default: { View: 'Reanimated.View' }, SlideInDown: {}, SlideOutDown: {} },
    '../../../lib/ui/uiThreadTimer': {
      startUiTimer(delay, callback) {
        const id = timers.size + 1;
        timers.set(id, callback);
        timerDelays.set(id, delay);
        return () => timers.delete(id);
      },
    },
    '../../../hooks/useWhileVisible': {
      useWhileVisible(start, deps) {
        engine.react.useEffect(() => {
          visibilityStart = () => { visibilityStop = start(); };
          visibilityStart();
          return () => { visibilityStop?.(); visibilityStart = null; };
        }, deps);
      },
    },
    '../../../services/images/onboardingImageCache': {
      getOnboardingImageSource: () => ({}),
      loadOnboardingImage: () => Promise.resolve({}),
      ...imageCache,
    },
    '../entranceTiming': { entranceTiming: { fade: 300 } },
    '../../../theme/card': { card: {} },
    '../../../theme/colors': { colors: { background: {}, text: {}, error: { 100: '', 700: '' }, border: {} } },
    '../../../theme/breakpoints': { dashboardContentColumn: {} },
    '../../../theme/spacing': { spacing: {} },
    '../../../theme/typography': { fonts: {}, scaleType: value => value, typography: { button: {}, body: {}, caption: {} } },
    '../onboardingVisualScale': { scaleControl: value => value },
    '../../../lib/paywall/planPrice': { computeAnnualSavings: () => 0, computePerMonth: () => null },
    '../paywall/paywallStepStyles': { paywallStepStyles: {} },
    '../../../hooks/usePaywallTrialReminder': { usePaywallTrialReminder: () => patch.reminderState ?? ({ enabled: false, daysBeforeEnd: 2 }) },
    '../../../lib/paywall/trialReminder': { trialDaysFromLabel: () => 7, availableTrialReminderDays: days => [2, 3].filter(offset => offset < days) },
  };
  for (const [path, name, defaultExport] of [
    ['../../common/Text', 'Text'], ['../../common/icons/Icon', 'Icon', true],
    ['../OnboardingPrimaryButton', 'Button', true],
    ['../paywall/PaywallChoosePlanStep', 'PaywallChoosePlanStep'],
    ['../paywall/PaywallFreeTrialHeroStep', 'PaywallFreeTrialHeroStep'],
    ['../paywall/PaywallTrialReminderChoiceStep', 'PaywallTrialReminderChoiceStep'],
    ['../paywall/PaywallBenefitsStep', 'PaywallBenefitsStep'],
    ['../../paywall/PaywallFooterLinks', 'PaywallFooterLinks'],
    ['../../paywall/NoTrialLongPaywall', 'NoTrialLongPaywall'],
    ['../../paywall/PaywallTrialReminderToggle', 'PaywallTrialReminderControl'],
    ['../paywall/PaywallTrialStep', 'PaywallTrialStep'],
  ]) dependencies[path] = { [defaultExport ? 'default' : name]: name };
  let renderingRouter = false;
  dependencies.react = Object.fromEntries(Object.keys(engine.react).map(key => [key, (...args) => (renderingRouter ? routerEngine : engine).react[key](...args)]));
  const screen = load('./screens/OnboardingPaywallScreen.tsx', dependencies, {
    setTimeout(callback, delay) { const id = timers.size + 1; timers.set(id, callback); timerDelays.set(id, delay); return id; },
    clearTimeout(id) { timers.delete(id); },
  }).default;
  function renderScreen() {
    renderingRouter = true;
    try { return routerEngine.render(() => screen(props)); }
    finally { renderingRouter = false; }
  }
  if (routerOnly) {
    renderScreen();
    return {
      screen: renderScreen,
      renderHold() {
        const element = renderScreen();
        tree = engine.render(() => element.type(element.props));
        return tree;
      },
      component: type => find(node => node.type === type),
      text: value => find(node => node.type === 'Text' && node.props.children === value),
      timerDelays,
      timers,
      advanceLoadingTimer() {
        for (const [id, callback] of timers) { timers.delete(id); callback(); }
        return this.renderHold();
      },
      unmount() { engine.unmount(); routerEngine.unmount(); },
    };
  }
  const deck = renderScreen().type;
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
    reports, animations, timers,
    component: type => find(node => node.type === type),
    stepStyle: () => find(node => node.props?.style?.some?.(style => style?.transform != null)).props.style.at(-1),
    render(next = {}) { Object.assign(props, next); tree = engine.render(() => deck(props)); return tree; },
    layout(finishEntrance = true) {
      find(node => node.props?.onLayout).props.onLayout();
      if (finishEntrance) harness.entrance();
    },
    entrance(finished = true) {
      for (const [id, callback] of timers) {
        if (timerDelays.get(id) !== 80) continue;
        timers.delete(id);
        callback();
        animations.at(-1).complete(finished);
      }
    },
    pressNext() { find(node => node.type === 'Button').props.onPress(); },
    pressBack() { find(node => node.props?.accessibilityLabel === 'Go back').props.onPress(); },
    transition(finished = true) {
      animations.at(-1).complete(finished);
      harness.render();
    },
    visible(value) { if (value) visibilityStart?.(); else visibilityStop?.(); },
    unmount() { engine.unmount(); routerEngine.unmount(); },
    screen: renderScreen,
  };
  harness.render();
  return harness;
}

test('switching trial plans updates the timeline, price, and exact purchased package over repeated visits', () => {
  const purchases = [];
  const monthly = { ...annual, id: 'monthly', title: 'Monthly', billingPeriod: 'month', trialLabel: null, introOffer: { days: 3, priceString: '$0.99' }, priceString: '$9.99' };
  const deck = deckHarness({
    offering: { ...offering, packages: [annual, monthly] }, initialStep: 'plan',
    onPurchase: id => purchases.push(id),
    onSelectPackage: selectedPackageId => deck.render({ selectedPackageId }),
  });
  for (let cycle = 0; cycle < 10; cycle += 1) {
    deck.component('PaywallChoosePlanStep').props.onSelectPackage('monthly');
    const paid = deck.component('PaywallTrialStep').props;
    assert.equal(paid.hasAnnualTrial, false);
    assert.equal(paid.trialDays, 3);
    assert.equal(paid.paidTrial.days, 3);
    assert.equal(paid.paidTrial.introPrice, '$0.99');
    assert.equal(paid.paidTrial.renewalPrice, '$9.99/month');
    assert.equal(deck.component('Button').props.label, 'Redeem 3 days for $0.99');
    deck.pressNext();
    deck.component('PaywallChoosePlanStep').props.onSelectPackage('annual');
    const free = deck.component('PaywallTrialStep').props;
    assert.equal(free.hasAnnualTrial, true);
    assert.equal(free.trialLabel, '7-day free trial');
    assert.equal(free.trialDays, 7);
    assert.equal(free.paidTrial, null);
    assert.equal(deck.component('Button').props.label, 'Start my free trial');
    deck.pressNext();
  }
  assert.deepEqual(purchases, Array.from({ length: 10 }, () => ['monthly', 'annual']).flat());
  deck.unmount();
});

test('a monthly plan without an eligible intro does not display the annual free trial', () => {
  const monthly = { ...annual, id: 'monthly', title: 'Monthly', billingPeriod: 'month', trialLabel: null, introOffer: null };
  const deck = deckHarness({ offering: { ...offering, packages: [annual, monthly] }, initialStep: 'plan', selectedPackageId: 'monthly' });
  const timeline = deck.component('PaywallTrialStep').props;
  assert.equal(timeline.hasAnnualTrial, false);
  assert.equal(timeline.trialDays, 0);
  assert.equal(timeline.trialLabel, null);
  assert.equal(timeline.paidTrial, null);
  assert.equal(deck.component('Button').props.label, 'Continue with monthly');
  deck.unmount();
});

test('plan selection is locked while checkout is pending', () => {
  const selections = [];
  const deck = deckHarness({ initialStep: 'plan', isPurchasing: true, onSelectPackage: id => selections.push(id) });
  deck.component('PaywallChoosePlanStep').props.onSelectPackage('monthly');
  assert.deepEqual(selections, []);
  assert.equal(deck.component('Button').props.disabled, true);
  deck.unmount();
});

test('losing trial eligibility on a later step leaves a working plan checkout', () => {
  const purchases = [];
  const deck = deckHarness({ onPurchase: id => purchases.push(id) });
  deck.layout();
  deck.pressNext(); deck.transition(); deck.transition();
  deck.pressNext(); deck.transition(); deck.transition();
  deck.render({ offering: noTrial });
  assert.ok(deck.component('PaywallChoosePlanStep'));
  assert.equal(deck.component('Button').props.label, 'Subscribe yearly');
  deck.pressNext();
  assert.deepEqual(purchases, ['annual']);
  deck.unmount();
});

test('purchase saves a valid reminder for the selected shorter intro and blocks on save failure', async () => {
  for (const saveSucceeds of [true, false]) {
    const saved = [], purchases = [];
    const monthly = { ...annual, id: 'monthly', title: 'Monthly', billingPeriod: 'month', trialLabel: null, introOffer: { days: 3, priceString: '$0.99' } };
    const reminderState = {
      enabled: true, daysBeforeEnd: 3,
      chooseDaysBeforeEnd: async days => { saved.push(days); return saveSucceeds; },
      setEnabled: async enabled => { saved.push(enabled); return saveSucceeds; },
    };
    const deck = deckHarness({ offering: { ...offering, packages: [annual, monthly] }, initialStep: 'plan', selectedPackageId: 'monthly', reminderState, onPurchase: id => purchases.push(id) });
    deck.pressNext();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(saved, [2]);
    assert.deepEqual(purchases, saveSucceeds ? ['monthly'] : []);
    deck.unmount();
  }
});

test('reminder selection stays shared through plan and Back across all three steps', async () => {
  const reminderState = {
    enabled: false, daysBeforeEnd: 2,
    chooseDaysBeforeEnd: async days => { reminderState.enabled = true; reminderState.daysBeforeEnd = days; return true; },
    setEnabled: async enabled => { reminderState.enabled = enabled; return true; },
  };
  const deck = deckHarness({ reminderState });
  deck.layout();
  deck.pressNext(); deck.transition(); deck.transition();
  assert.equal(deck.component('PaywallFreeTrialHeroStep'), undefined);
  const choice = deck.component('PaywallTrialReminderChoiceStep');
  await choice.props.reminder.chooseDaysBeforeEnd(3);
  deck.render();
  deck.pressNext(); deck.transition(); deck.transition();
  assert.equal(deck.component('PaywallTrialStep').props.reminderDaysBeforeEnd, 3);
  assert.equal(deck.component('PaywallTrialStep').props.reminderEnabled, true);
  deck.pressBack(); deck.transition(); deck.transition();
  assert.equal(deck.component('PaywallTrialReminderChoiceStep').props.reminder.daysBeforeEnd, 3);
  assert.equal(deck.component('PaywallTrialReminderChoiceStep').props.reminder.enabled, true);
  deck.pressBack(); deck.transition(); deck.transition();
  assert.ok(deck.component('PaywallBenefitsStep'));
  deck.pressNext(); deck.transition(); deck.transition();
  assert.equal(deck.component('PaywallTrialReminderChoiceStep').props.reminder.daysBeforeEnd, 3);
  assert.equal(deck.component('PaywallTrialReminderChoiceStep').props.reminder.enabled, true);
  deck.unmount();
});

test('Continue stays responsive while the reminder saves and purchase waits for confirmation', () => {
  const reminderState = { enabled: false, daysBeforeEnd: 2, selectedDaysBeforeEnd: 3, busy: true };
  const deck = deckHarness({ reminderState });
  deck.layout();
  deck.pressNext(); deck.transition(); deck.transition();
  assert.ok(!deck.component('PaywallTrialReminderChoiceStep').props.disabled);
  assert.ok(!deck.component('Button').props.disabled);
  deck.pressNext(); deck.transition(); deck.transition();
  assert.ok(deck.component('PaywallTrialStep'));
  assert.equal(deck.component('Button').props.disabled, true);
  reminderState.busy = false;
  deck.render();
  assert.ok(!deck.component('Button').props.disabled);
  deck.unmount();
});

test('trial introduction uses the eligible store duration instead of promising a fixed week', () => {
  const deck = deckHarness({ planIntent: 'sleep', name: 'Sam', goalPhrase: 'sleep better', planPreset: { id: 'night', weeks: 6 }, offering: { ...offering, packages: [{ ...annual, trialDays: 14, trialLabel: '14-day free trial' }] } });
  deck.layout();
  deck.pressNext(); deck.transition(); deck.transition();
  assert.equal(deck.component('PaywallTrialReminderChoiceStep').props.trialDays, 14);
  deck.unmount();
});

test('deck reports after its entrance finishes, once across rerenders', () => {
  const deck = deckHarness();
  assert.deepEqual(deck.reports, []);
  deck.layout();
  assert.deepEqual(deck.reports, [{ step: 'benefits', index: 1, count: 3 }]);
  deck.layout(); deck.render(); deck.visible(false); deck.visible(true);
  assert.equal(deck.reports.length, 1);
  deck.unmount();
});

test('next and back report only completed entrances and include revisits', () => {
  const deck = deckHarness();
  deck.layout();
  deck.pressNext();
  deck.transition(); // Exit commits the next screen, which is still transparent.
  assert.equal(deck.reports.length, 1);
  deck.transition();
  deck.pressNext(); deck.transition(); deck.transition();
  deck.pressBack(); deck.transition(); deck.transition();
  assert.deepEqual(deck.reports, [
    { step: 'benefits', index: 1, count: 3 },
    { step: 'reminder', index: 2, count: 3 },
    { step: 'plan', index: 3, count: 3 },
    { step: 'reminder', index: 2, count: 3 },
  ]);
  deck.unmount();
});

test('canceled transitions never report their target', () => {
  const deck = deckHarness();
  deck.layout();
  deck.pressNext(); deck.transition(false);
  assert.equal(deck.reports.length, 1);
  deck.pressNext(); deck.transition(); deck.transition(false);
  assert.equal(deck.reports.length, 1);
  deck.unmount();
});

test('background completion waits for foreground and unmount blocks late callbacks', () => {
  const deck = deckHarness();
  deck.visible(false); deck.layout();
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
  compact.layout();
  assert.deepEqual(compact.reports, [{ step: 'plan', index: 1, count: 1 }]);
  compact.unmount();
  const preview = deckHarness({ preview: true });
  preview.layout(); preview.pressNext(); preview.transition(); preview.transition();
  assert.deepEqual(preview.reports, []);
  preview.unmount();
});

test('retry and eligibility changes report the current rendered step', () => {
  const retry = deckHarness({ offering: null, errorMessage: 'Failed' });
  retry.layout();
  assert.deepEqual(retry.reports, []);
  retry.render({ offering: noTrial });
  assert.deepEqual(retry.reports, [{ step: 'plan', index: 1, count: 1 }]);
  retry.unmount();
  const eligibility = deckHarness();
  eligibility.visible(false); eligibility.layout();
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

function paywallHarness({ loadedOffering = offering, cachedOffering = offering } = {}) {
  const engine = hooks(), captures = [];
  let resolveOffering, rejectOffering;
  let currentCachedOffering = cachedOffering;
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
      getCachedPaywallOffering: () => ({ offering: currentCachedOffering, revenueCatPackages: {} }),
      getPaywallOffering: () => result,
    },
    '../services/subscriptions/revenueCatIdentitySync': { syncRevenueCatAttributionForCurrentUser: () => Promise.resolve(true) },
    '../stores/authStore': { useAuthStore: auth },
    '../stores/revenueCatIdentityStore': { useRevenueCatIdentityStore: selector => selector({ status: 'ready', appUserId: 'user', lastErrorMessage: null, lastUnavailableReason: null }) },
    '../stores/paywallSeenStore': { usePaywallSeenStore: { getState: () => ({ markSeen() {} }) } },
    '../queries/subscriptions/entitlementCache': {},
    '../services/subscriptions/revenueCatClient': {},
    '../services/reviews/reviewPromptState': {},
  }).usePaywall;
  return {
    captures,
    cacheOffering(value) { currentCachedOffering = value; },
    render(patch = {}) { Object.assign(options, patch); return engine.render(() => paywall(options)); },
    async ready() { resolveOffering({ offering: loadedOffering, revenueCatPackages: {} }); await result; await Promise.resolve(); return this.render(); },
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

test('selection follows available packages when an offering loads or removes a plan', async () => {
  const monthlyOnly = { ...offering, packages: [{ ...annual, id: 'monthly', title: 'Monthly', billingPeriod: 'month', trialLabel: null }] };
  const harness = paywallHarness({ cachedOffering: monthlyOnly });
  assert.equal(harness.render().selectedPackageId, 'monthly');
  assert.equal((await harness.ready()).selectedPackageId, 'annual');
  harness.unmount();
  const fresh = paywallHarness({ loadedOffering: monthlyOnly });
  fresh.render();
  assert.equal((await fresh.ready()).selectedPackageId, 'monthly');
  fresh.unmount();
});

test('cached deck visits queue in order until canonical metadata is ready', async () => {
  const harness = paywallHarness();
  let paywall = harness.render();
  paywall.trackStepViewed({ step: 'benefits', index: 1, count: 3 });
  paywall = harness.render();
  paywall.trackStepViewed({ step: 'reminder', index: 2, count: 3 });
  harness.render();
  assert.deepEqual(harness.views(), []);
  paywall = await harness.ready();
  assert.deepEqual(harness.views().map(view => view.paywall_step), ['benefits', 'reminder']);
  const view = harness.views()[0];
  assert.ok(view.paywall_view_id);
  assert.equal(view.paywall_view_id, harness.views()[1].paywall_view_id);
  assert.equal(view.offering_id, 'trial');
  assert.equal(view.experiment_variant, 'A');
  assert.equal(view.annual_price_cents, 5999);
  assert.equal(view.paywall_layout, 'deck');
  assert.equal(view.paywall_step_index, 1);
  assert.equal(view.paywall_step_count, 3);
  paywall.trackStepViewed({ step: 'reminder', index: 2, count: 3 }); harness.render();
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


test('loading offers immediately shows status and a spinner, then exposes retry after eight seconds', () => {
  let retries = 0;
  const hold = deckHarness({ offering: null, isLoading: true, onRetry: () => retries++ }, {}, true);
  const tree = hold.renderHold();
  assert.equal(tree.props.accessibilityLiveRegion, 'polite');
  assert.ok(hold.component('ActivityIndicator'));
  assert.ok(hold.text('Your plan is ready'));
  assert.ok(hold.text('Preparing your subscription options…'));
  assert.equal(hold.component('Button'), undefined);
  assert.equal(hold.component('Pressable'), undefined);
  assert.deepEqual([...hold.timerDelays.values()], [8_000]);
  hold.advanceLoadingTimer();
  assert.ok(hold.text('This is taking longer than usual. You can try again.'));
  hold.component('Button').props.onPress();
  assert.equal(retries, 1);
  assert.equal(hold.component('Pressable'), undefined);
  hold.unmount();
});

test('slow offer loading only exposes continue when its owner supplies that action', () => {
  let continues = 0;
  const hold = deckHarness({ offering: null, isLoading: true, onContinueWithoutPro: () => continues++ }, {}, true);
  hold.renderHold();
  assert.equal(hold.text('Continue without Pro'), undefined);
  hold.advanceLoadingTimer();
  assert.ok(hold.text('Continue without Pro'));
  hold.component('Pressable').props.onPress();
  assert.equal(continues, 1);
  hold.unmount();
});

test('unmounting the offer loading screen cancels its delayed recovery timer', () => {
  const hold = deckHarness({ offering: null, isLoading: true }, {}, true);
  hold.renderHold();
  assert.equal(hold.timers.size, 1);
  hold.unmount();
  assert.equal(hold.timers.size, 0);
});

test('enabling the paywall adopts an offering prefetched after the initial disabled mount', () => {
  const harness = paywallHarness({ cachedOffering: null });
  assert.equal(harness.render({ enabled: false }).offering, null);
  harness.cacheOffering(offering);
  const paywall = harness.render({ enabled: true });
  assert.equal(paywall.offering, offering);
  assert.equal(paywall.selectedPackageId, 'annual');
  harness.unmount();
});

test('ten interrupted step entrances stop work and restore visible content on resume', () => {
  const deck = deckHarness();
  deck.layout();
  for (let cycle = 0; cycle < 10; cycle += 1) {
    deck.pressNext();
    deck.transition();
    const entering = deck.animations.at(-1);
    deck.visible(false);
    assert.equal(entering.stopped, true);
    assert.equal(deck.stepStyle().opacity.value, 1);
    assert.equal(deck.stepStyle().transform[0].translateX.value, 0);
    const reportCount = deck.reports.length;
    entering.complete();
    assert.equal(deck.reports.length, reportCount);
    deck.visible(true);
    assert.ok(deck.component('PaywallTrialReminderChoiceStep'));
    assert.equal(deck.reports.at(-1).step, 'reminder');
    deck.pressBack(); deck.transition(); deck.transition();
    assert.ok(deck.component('PaywallBenefitsStep'));
  }
  assert.equal(deck.reports.length, 21);
  deck.unmount();
});

test('the restored entrance waits for its delay and fade before reporting the first step', () => {
  const deck = deckHarness();
  deck.layout(false);
  assert.deepEqual(deck.reports, []);
  assert.equal(deck.timers.size, 1);
  assert.equal(deck.animations.length, 0);
  deck.entrance();
  assert.equal(deck.timers.size, 0);
  assert.equal(deck.animations.length, 1);
  assert.equal(deck.reports[0].step, 'benefits');
  deck.unmount();
});

test('backgrounding during the entrance delay cancels it and resumes with visible content', () => {
  const deck = deckHarness();
  deck.layout(false);
  deck.visible(false);
  assert.equal(deck.timers.size, 0);
  assert.equal(deck.component('AnimatedView').props.style.at(-1).opacity.value, 1);
  deck.visible(true);
  assert.equal(deck.reports.length, 1);
  deck.entrance();
  assert.equal(deck.animations.length, 0);
  deck.unmount();
});

test('an interrupted entrance fade restores full opacity', () => {
  const deck = deckHarness();
  deck.layout(false);
  deck.entrance(false);
  assert.equal(deck.component('AnimatedView').props.style.at(-1).opacity.value, 1);
  assert.equal(deck.reports.length, 1);
  deck.unmount();
});

test('paywall readiness waits for the whole-page fade and reports only once', () => {
  let ready = 0;
  const deck = deckHarness({ onReady: () => { ready += 1; } });
  deck.layout(false);
  assert.equal(ready, 0);
  assert.equal(deck.component('AnimatedView').props.style.at(-1).opacity.value, 0);
  deck.entrance();
  assert.equal(ready, 1);
  deck.layout(); deck.render(); deck.visible(false); deck.visible(true);
  assert.equal(ready, 1);
  deck.unmount();
});

test('readiness keeps the celebration underlay until an overlapping step transition is visible', () => {
  let ready = 0;
  const deck = deckHarness({ onReady: () => { ready += 1; } });
  deck.layout(false);
  deck.pressNext();
  const exit = deck.animations.at(-1);
  deck.entrance();
  assert.equal(ready, 0);
  exit.complete(); deck.render(); deck.transition();
  assert.equal(ready, 1);
  deck.unmount();
});

test('the completion handoff fallback immediately exposes retry without a second delay', () => {
  const retryCalls = [];
  const hold = deckHarness({ offering: null, isLoading: true, loadingRecoveryAvailable: true, onRetry: () => retryCalls.push('retry') }, {}, true);
  hold.renderHold();
  assert.equal(hold.timers.size, 0);
  hold.component('Button').props.onPress();
  assert.deepEqual(retryCalls, ['retry']);
  hold.unmount();
});
