import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { CommonActions, StackRouter } from '@react-navigation/routers';

const source = readFileSync(new URL('./ActivityRewardScreen.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source + '\nexport { TodoClaimReward, TodoClaimRewardPreview, ActivityRewardContent };', {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;

const rewardEntrance = {};
const cardSource = readFileSync(new URL('../components/common/HeaderStripStatCard.tsx', import.meta.url), 'utf8');
const sparkleLead = Number(cardSource.match(/export const STAT_CARD_SPARKLE_LEAD_MS = (\d+);/)[1]);
vm.runInNewContext(ts.transpileModule(
  readFileSync(new URL('../features/plan/rewardEntrance.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText, {
  exports: rewardEntrance,
  require: () => ({ STAT_CARD_SPARKLE_LEAD_MS: sparkleLead }),
});
const cardEnterAt = rewardEntrance.rewardCardEnterAt(0);

function setup(claim, { reducedMotion = false, dev = true, earnedShown = false, cardCount, onGoBack, openingTransitionComplete = true } = {}) {
  const exports = {};
  const sounds = [];
  const haptics = [];
  const flights = [];
  const handed = [];
  const options = [];
  const realClaims = [];
  const previewClaims = [];
  const afterClose = [];
  const celebrations = [];
  const frames = new Map();
  const cleanups = [];
  const stateSlots = new Map();
  let stateIndex = 0;
  let nextFrame = 0;
  let closedHome = 0;
  let backed = 0;
  let canCelebrate = true;
  const navigation = { goBack: () => { backed++; onGoBack?.(); }, setOptions: (value) => options.push(value) };
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    useCallback: (fn) => fn,
    useEffect: (effect) => { const cleanup = effect(); if (cleanup) cleanups.push(cleanup); },
    useRef: (current) => ({ current }),
    useState: (initial) => {
      const index = stateIndex++;
      if (!stateSlots.has(index)) stateSlots.set(index, typeof initial === 'function' ? initial() : initial);
      return [stateSlots.get(index), (value) => {
        stateSlots.set(index, typeof value === 'function' ? value(stateSlots.get(index)) : value);
      }];
    },
    useOpeningTransitionComplete: () => openingTransitionComplete,
    useCompletionSound: (...args) => { sounds.push(args); },
    useCompletionHaptic: (...args) => haptics.push(args),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
    useReducedMotion: () => reducedMotion,
    useTodoClaimReward: (request) => { realClaims.push(request); return claim; },
    useTodoClaimRewardPreview: (mode) => { previewClaims.push(mode); return claim; },
    useAuthStore: (select) => select({ user: { id: 'user' } }),
    useCoinRewardFlight: (options) => { flights.push(options); return { cardCoins: cardCount ?? options.coins, earnedShown, balanceRef: 'balanceRef' }; },
    useShareActivityResult: () => () => {},
    getActivityResultCopy: () => ({ title: 'Result', subtitle: 'Saved', shareMessage: 'share' }),
    useCloseOntoHome: () => () => { closedHome++; },
    useAfterScreenClosed: (_, onClosed) => afterClose.push(onClosed),
    useFirstWinOfDayStore: { getState: () => ({ revealAfterClose: () => celebrations.push('firstWin') }) },
    useTourStore: { getState: () => ({ endHandoff: () => celebrations.push('tour') }) },
    handDayCompleteToHome: (id) => handed.push(id),
    rewardCardEnterAt: rewardEntrance.rewardCardEnterAt,
    REWARD_BEAT: rewardEntrance.REWARD_BEAT,
    EARN_RATES: { todoStep: 10 },
    colors: { background: { canvas: 'canvas' }, primary: { blue500: 'blue' } },
    spacing: { sm: 8, md: 16 },
    padding: { screen: { horizontal: 18 } },
  };
  vm.runInNewContext(compiled, {
    exports,
    __DEV__: dev,
    requestAnimationFrame: (callback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id) => frames.delete(id),
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native') return {
        View: 'View', ActivityIndicator: 'ActivityIndicator',
        StyleSheet: { create: (style) => style, absoluteFillObject: { position: 'absolute' } },
        BackHandler: { addEventListener: () => ({ remove() {} }) },
      };
      return { ...dependencies, default: name, GlassIconButton: 'GlassIconButton', EarnedCoinsCard: 'EarnedCoinsCard', Land: 'Land' };
    },
  });
  function labels(tree) {
    if (!tree) return [];
    return [tree.props?.label, ...[tree.props?.children].flat().flatMap(labels)].filter(Boolean);
  }
  function renderContent(props) {
    stateIndex = 0;
    return exports.ActivityRewardContent(props);
  }
  return {
    exports, sounds, haptics, flights, handed, navigation, labels, options,
    realClaims, previewClaims, celebrations,
    renderContent,
    renderClaim: ({ heroReady = false } = {}) => {
      const shell = exports.TodoClaimReward({ navigation, request: {}, openingTransitionComplete });
      let tree = renderContent(shell.props);
      if (heroReady) {
        tree.props.children[1].props.onReady();
        tree = renderContent(shell.props);
      }
      return { shell, tree };
    },
    flushFrames: () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback()); },
    unmount: () => cleanups.forEach((cleanup) => cleanup()),
    close: () => afterClose.at(-1)?.(),
    closedHome: () => closedHome, backed: () => backed,
    invalidateDay: () => { canCelebrate = false; },
    resolveDay: () => canCelebrate ? 'todo:claim' : undefined,
  };
}

test('ten preview completion cycles return to the existing Settings route without growing the stack', () => {
  const router = StackRouter({});
  const options = { routeNames: ['MainTabs', 'Settings', 'ActivityReward'], routeParamList: {}, routeGetIdList: {} };
  let state = router.getInitialState(options);
  const dispatch = (action) => {
    state = router.getStateForAction(state, action, options);
    assert.ok(state);
  };
  dispatch(CommonActions.navigate('Settings'));
  const settingsKey = state.routes[state.index].key;
  for (let cycle = 0; cycle < 10; cycle++) {
    dispatch(CommonActions.navigate('ActivityReward', { kind: 'todo', previewClaim: 'quick' }));
    assert.equal(state.routes.length, 3);
    const claim = { response: null, failed: false, getDayCompleteUnitId: () => undefined };
    const harness = setup(claim, { onGoBack: () => dispatch(CommonActions.goBack()) });
    const screen = harness.exports.default({ navigation: harness.navigation, route: state.routes[state.index] });
    let shell = harness.exports.TodoClaimRewardPreview(screen.props);
    let tree = harness.renderContent(shell.props);
    tree.props.children[1].props.onReady();
    tree = harness.renderContent(shell.props);
    tree.props.children[2].props.children[1].props.children.props.onPress();
    assert.equal(state.routes.length, 3, 'pending Continue cannot leave the claim');
    claim.response = { outcome: 'recorded', coinsAwarded: 10 };
    shell = harness.exports.TodoClaimRewardPreview(screen.props);
    tree = harness.renderContent(shell.props);
    const onContinue = tree.props.children[2].props.children[1].props.children.props.onPress;
    onContinue();
    onContinue();
    assert.deepEqual(state.routes.map((route) => route.name), ['MainTabs', 'Settings']);
    assert.equal(state.routes[state.index].key, settingsKey);
    assert.equal(harness.backed(), 1, 'rapid Continue taps close exactly once');
    assert.equal(harness.handed.length, 0);
    harness.unmount();
  }
});

test('a pending claim immediately shows the normal completion copy and Continue without a saving screen', () => {
  const harness = setup({ response: null, failed: false });
  const { shell, tree } = harness.renderClaim();
  assert.equal(shell.type, harness.exports.ActivityRewardContent);
  const content = tree.props.children[1];
  assert.equal(content.props.title, 'Result');
  assert.equal(content.props.subtitle, 'Saved');
  assert.equal(content.props.pose, 'proud');
  assert.equal(content.props.entrance, undefined, 'claims use the common completion entrance');
  assert.equal(content.props.children.props.children.type, 'View', 'the card has no saving spinner');
  assert.deepEqual(harness.labels(tree), ['Continue']);
  const action = tree.props.children[2].props.children[1];
  assert.equal(action.props.delay, rewardEntrance.REWARD_BEAT.cta);
  assert.equal(action.props.when, false, 'Continue enters with the hero');
  assert.equal(action.props.children.props.disabled, true);
});

test('pending and failed claims keep coin flight and completion feedback off until confirmation', () => {
  for (const failed of [false, true]) {
    const harness = setup({ response: null, failed, canRetry: true, retry() {} });
    const { tree } = harness.renderClaim();
    assert.deepEqual(harness.labels(tree), failed ? ['Try again', 'Back'] : ['Continue']);
    assert.equal(harness.sounds[0][1].autoPlay, false);
    assert.equal(harness.sounds[0][1].active, false);
    assert.equal(harness.haptics[0][1], false);
    assert.equal(harness.flights[0].coins, 0);
    assert.equal(harness.handed.length, 0);
    assert.equal(tree.props.children[0].props.children[0].props.children, false, 'Share waits for the hero');
    const placeholder = tree.props.children[1].props.children.props.children;
    assert.equal(placeholder.props.style.opacity, 0);
    assert.equal(placeholder.props.accessibilityElementsHidden, true);
    assert.equal(placeholder.props.importantForAccessibility, 'no-hide-descendants');
    assert.equal(placeholder.props.children.props.enterAt, undefined);
    assert.equal(placeholder.props.children.props.sparkleRing, false);
  }
});

test('a ready pending claim shows its expected award and blocks Continue without changing real coins', () => {
  const harness = setup({ response: null, failed: false, getDayCompleteUnitId: () => 'day' });
  const { tree } = harness.renderClaim({ heroReady: true });
  const placeholder = tree.props.children[1].props.children.props.children;
  assert.equal(placeholder.props.style, false);
  assert.equal(placeholder.props.accessibilityElementsHidden, false);
  assert.equal(placeholder.props.children.props.coins, 10);
  assert.equal(placeholder.props.children.props.finalCoins, 10);
  assert.equal(placeholder.props.children.props.enterAt, cardEnterAt);
  assert.equal(placeholder.props.children.props.sparkleRing, true, 'the claim card shares the normal sparkle entrance');
  const action = tree.props.children[2].props.children[1];
  assert.equal(action.props.when, true);
  assert.equal(action.props.children.props.disabled, true);
  action.props.children.props.onPress();
  assert.equal(harness.backed(), 0);
  assert.equal(harness.closedHome(), 0);
  assert.deepEqual(harness.handed, []);
  assert.equal(tree.props.children[0].props.children[0].props.children.props.accessibilityLabel, 'Share result');
  assert.equal(tree.props.children[0].props.children[1].props.children.props.coins, 0);
  assert.ok(harness.flights.every((flight) => flight.coins === 0));
  assert.ok(harness.sounds.every((sound) => sound[1].autoPlay === false));
  assert.ok(harness.haptics.every((haptic) => haptic[1] === false));
});

test('confirmation preserves the hero, card and CTA entrance and uses the exact server award, including zero', () => {
  for (const coinsAwarded of [10, 0]) {
    const claim = { response: null, failed: false, getDayCompleteUnitId: () => undefined };
    const harness = setup(claim, { cardCount: 0 });
    const pending = harness.renderClaim({ heroReady: true });
    claim.response = { outcome: 'recorded', coinsAwarded };
    const confirmed = harness.renderClaim();
    assert.equal(confirmed.shell.type, pending.shell.type, 'the reward shell stays mounted');
    assert.equal(confirmed.shell.props.params.coins, coinsAwarded);
    assert.equal(confirmed.shell.props.openingTransitionComplete, true);
    const before = pending.tree.props.children[1];
    const after = confirmed.tree.props.children[1];
    assert.equal(after.type, before.type, 'the hero owner stays at the same child position');
    assert.equal(after.props.key, before.props.key);
    assert.equal(after.props.pose, before.props.pose);
    assert.equal(after.props.entrance, undefined);
    assert.equal(after.props.title, 'Result');
    assert.equal(after.props.title, before.props.title);
    assert.equal(after.props.subtitle, before.props.subtitle);
    const beforeCard = before.props.children.props.children.props.children;
    const afterCard = after.props.children.props.children.props.children;
    assert.equal(afterCard.type, beforeCard.type);
    assert.equal(afterCard.props.enterAt, beforeCard.props.enterAt);
    assert.equal(afterCard.props.sparkleRing, beforeCard.props.sparkleRing);
    assert.equal(afterCard.props.sparkleRing, true);
    assert.equal(afterCard.props.finalCoins, coinsAwarded);
    assert.equal(afterCard.props.coins, coinsAwarded, 'the card never resets to the flight count of zero');
    const beforeAction = pending.tree.props.children[2].props.children[1];
    const afterAction = confirmed.tree.props.children[2].props.children[1];
    assert.equal(afterAction.type, beforeAction.type);
    assert.equal(afterAction.props.delay, beforeAction.props.delay);
    assert.equal(afterAction.props.delay, rewardEntrance.REWARD_BEAT.cta);
    assert.equal(afterAction.props.when, beforeAction.props.when);
    assert.equal(beforeAction.props.children.props.disabled, true);
    assert.equal(afterAction.props.children.props.disabled, false);
    assert.deepEqual(harness.flights.map(({ coins, landedAfterMs }) => ({ coins, landedAfterMs })), [{ coins: 0, landedAfterMs: cardEnterAt }, { coins: 0, landedAfterMs: cardEnterAt }, { coins: coinsAwarded, landedAfterMs: cardEnterAt }]);
    assert.equal(harness.sounds[2][1].autoPlay, true);
    assert.equal(harness.haptics[2][1], true);
    assert.deepEqual(harness.labels(confirmed.tree), ['Continue']);
  }
});

test('a fast response holds the exact wallet award while waiting for the hero before flight and completion feedback', () => {
  for (const coinsAwarded of [10, 0]) {
    const harness = setup({ response: { outcome: 'recorded', coinsAwarded } });
    const waiting = harness.renderClaim();
    assert.deepEqual(harness.labels(waiting.tree), ['Continue']);
    assert.equal(waiting.tree.props.children[2].props.children[1].props.children.props.disabled, true);
    assert.equal(harness.flights[0].coins, 0);
    assert.equal(harness.sounds[0][1].autoPlay, false);
    assert.equal(harness.haptics[0][1], false);
    assert.equal(waiting.tree.props.children[0].props.children[0].props.children, false, 'Share waits for the hero');
    const waitingBalance = waiting.tree.props.children[0].props.children[1].props.children;
    assert.equal(waitingBalance.props.coins, coinsAwarded, 'the real balance masks the credited server award before the image is ready');
    assert.equal(waitingBalance.props.earnedShown, false);
    const placeholder = waiting.tree.props.children[1].props.children.props.children;
    assert.equal(placeholder.props.accessibilityElementsHidden, true);
    assert.equal(placeholder.props.children.props.finalCoins, coinsAwarded);
    waiting.tree.props.children[1].props.onReady();
    const ready = harness.renderClaim();
    assert.equal(ready.shell.type, waiting.shell.type);
    assert.equal(ready.tree.props.children[1].type, waiting.tree.props.children[1].type);
    assert.deepEqual(harness.labels(ready.tree), ['Continue']);
    assert.equal(ready.tree.props.children[2].props.children[1].props.children.props.disabled, false);
    const readyBalance = ready.tree.props.children[0].props.children[1].props.children;
    assert.equal(readyBalance.props.coins, coinsAwarded);
    assert.equal(readyBalance.props.earnedShown, false, 'the credited balance remains masked until the flight starts');
    assert.equal(harness.flights[1].coins, coinsAwarded);
    assert.equal(harness.flights[1].landedAfterMs, cardEnterAt);
    assert.equal(harness.sounds[1][1].autoPlay, true);
    assert.equal(harness.haptics[1][1], true);
  }
});

test('failure and retry keep the same content while allowing Retry and Back', () => {
  let retries = 0;
  const claim = { response: null, failed: false, canRetry: true, retry: () => { retries++; } };
  const harness = setup(claim);
  const pending = harness.renderClaim();
  claim.failed = true;
  const failed = harness.renderClaim();
  assert.equal(failed.shell.type, pending.shell.type);
  assert.equal(failed.tree.props.children[1].type, pending.tree.props.children[1].type);
  assert.equal(failed.tree.props.children[1].props.title, 'Let’s try that again');
  assert.equal(failed.tree.props.children[1].props.children.props.children.props.accessibilityElementsHidden, true);
  failed.tree.props.children[2].props.children[0].props.onPress();
  assert.equal(retries, 1);
  failed.tree.props.children[2].props.children[1].props.onPress();
  assert.equal(harness.backed(), 1);
  claim.failed = false;
  const retrying = harness.renderClaim();
  assert.equal(retrying.tree.props.children[1].type, pending.tree.props.children[1].type);
  assert.equal(retrying.tree.props.children[1].props.title, 'Result');
  assert.deepEqual(harness.labels(retrying.tree), ['Continue']);
  assert.equal(retrying.tree.props.children[2].props.children[1].props.children.props.disabled, true);
  retrying.tree.props.children[2].props.children[1].props.children.props.onPress();
  assert.equal(harness.backed(), 1);
  assert.equal(harness.handed.length, 0);
  claim.failed = true;
  claim.canRetry = false;
  assert.deepEqual(harness.labels(harness.renderClaim().tree), ['Back']);
});

test('a recorded claim stays successful when live claim context later reports failure', () => {
  const harness = setup({ response: { outcome: 'recorded', coinsAwarded: 10 }, failed: true, canRetry: true });
  const { tree } = harness.renderClaim({ heroReady: true });
  assert.equal(tree.props.children[1].props.title, 'Result');
  assert.equal(tree.props.children[1].props.children.props.children.props.accessibilityElementsHidden, false);
  assert.deepEqual(harness.labels(tree), ['Continue']);
  assert.equal(tree.props.children[2].props.children[1].props.children.props.disabled, false);
});

test('reduced motion claims reveal Continue with the hero and enable it after saving without another entrance', () => {
  const claim = { response: null, failed: false };
  const harness = setup(claim, { reducedMotion: true });
  const waiting = harness.renderClaim();
  const hiddenAction = waiting.tree.props.children[2].props.children[1];
  assert.equal(hiddenAction.type, 'View');
  assert.equal(hiddenAction.props.style.opacity, 0);
  assert.equal(hiddenAction.props.pointerEvents, 'none');
  assert.equal(hiddenAction.props.accessibilityElementsHidden, true);
  assert.equal(hiddenAction.props.importantForAccessibility, 'no-hide-descendants');
  assert.equal(hiddenAction.props.children.props.label, 'Continue');
  assert.equal(hiddenAction.props.children.props.disabled, true);
  waiting.tree.props.children[1].props.onReady();
  const ready = harness.renderClaim();
  const readyAction = ready.tree.props.children[2].props.children[1];
  assert.equal(readyAction.type, hiddenAction.type);
  assert.equal(readyAction.props.style, false);
  assert.equal(readyAction.props.pointerEvents, 'auto');
  assert.equal(readyAction.props.accessibilityElementsHidden, false);
  assert.equal(readyAction.props.importantForAccessibility, 'auto');
  assert.equal(readyAction.props.children.props.disabled, true);
  claim.response = { outcome: 'recorded', coinsAwarded: 10 };
  const saved = harness.renderClaim();
  const savedAction = saved.tree.props.children[2].props.children[1];
  assert.equal(savedAction.type, readyAction.type);
  assert.equal(savedAction.props.style, readyAction.props.style);
  assert.equal(savedAction.props.children.type, readyAction.props.children.type);
  assert.equal(savedAction.props.children.props.disabled, false);
  assert.equal(saved.tree.props.children[1].props.children.props.children.props.children.props.enterAt, undefined);
  assert.equal(saved.tree.props.children[1].props.children.props.children.props.children.props.sparkleRing, true);
});

test('Continue rechecks the live day before handing it to Home and runs once', () => {
  for (const change of [false, true]) {
    const claim = { response: { outcome: 'recorded', coinsAwarded: 10 } };
    const harness = setup(claim);
    claim.getDayCompleteUnitId = harness.resolveDay;
    const { tree } = harness.renderClaim({ heroReady: true });
    const footer = tree.props.children[2];
    const onContinue = footer.props.children[1].props.children.props.onPress;
    if (change) harness.invalidateDay();
    onContinue(); onContinue();
    assert.deepEqual(harness.handed, change ? [] : ['todo:claim']);
    assert.equal(harness.closedHome(), change ? 0 : 1);
    assert.equal(harness.backed(), change ? 1 : 0);
  }
});

test('other activity results retain their existing staggered card, flight and CTA timings', () => {
  const harness = setup({});
  const tree = harness.renderContent({
    navigation: harness.navigation, params: { kind: 'lesson', coins: 10 }, openingTransitionComplete: true,
  });
  assert.equal(tree.props.children[1].props.entrance, undefined);
  assert.equal(tree.props.children[1].props.children.props.children.props.children.props.enterAt, cardEnterAt);
  assert.equal(tree.props.children[1].props.children.props.children.props.children.props.sparkleRing, true);
  assert.equal(harness.flights[0].landedAfterMs, cardEnterAt);
  assert.equal(tree.props.children[2].props.children[1].props.delay, 660);
});

test('other reduced-motion activity results keep their existing CTA without a claim readiness wrapper', () => {
  const harness = setup({}, { reducedMotion: true });
  const tree = harness.renderContent({
    navigation: harness.navigation, params: { kind: 'lesson', coins: 10 }, openingTransitionComplete: true,
  });
  const action = tree.props.children[2].props.children[1];
  assert.equal(action.type, 'Land');
  assert.equal(action.props.delay, 660);
  assert.equal(action.props.when, true);
  assert.equal(action.props.style, undefined);
  assert.equal(action.props.children.props.disabled, false);
});

test('real claims preserve the normal native transition and wait for it before completion feedback', () => {
  const harness = setup({ response: { outcome: 'recorded', coinsAwarded: 10 }, failed: false }, { openingTransitionComplete: false });
  const request = { userId: 'user', enrollmentId: 'plan', localDate: '2026-10-11', programDay: 7 };
  const screen = harness.exports.default({ navigation: harness.navigation, route: { params: { kind: 'todo', claim: request } } });
  assert.equal(screen.props.openingTransitionComplete, false);
  harness.flushFrames();
  assert.equal(harness.options.length, 0, 'the screen never overrides its normal native fade');
  const shell = harness.exports.TodoClaimReward(screen.props);
  assert.equal(shell.props.openingTransitionComplete, false);
  const waiting = harness.renderContent(shell.props);
  waiting.props.children[1].props.onReady();
  harness.renderContent(shell.props);
  assert.equal(harness.sounds.at(-1)[1].autoPlay, false);
  assert.equal(harness.haptics.at(-1)[1], false);
  harness.renderContent({ ...shell.props, openingTransitionComplete: true });
  assert.equal(harness.sounds.at(-1)[1].autoPlay, true);
  assert.equal(harness.haptics.at(-1)[1], true);
});

test('each dev claim preview uses the common renderer and passes through the normal native transition', () => {
  for (const mode of ['quick', 'slow', 'retry']) {
    const harness = setup({ response: null, failed: false, getDayCompleteUnitId: () => undefined });
    const screen = harness.exports.default({ navigation: harness.navigation, route: { params: { kind: 'todo', previewClaim: mode } } });
    assert.equal(screen.type, harness.exports.TodoClaimRewardPreview);
    const shell = screen.type(screen.props);
    assert.equal(shell.type, harness.exports.ActivityRewardContent);
    assert.equal(shell.props.preview, true);
    assert.equal(shell.props.openingTransitionComplete, true);
    const tree = harness.renderContent(shell.props);
    assert.equal(tree.props.children[1].props.entrance, undefined);
    assert.equal(tree.props.children[1].props.pose, 'proud');
    assert.equal(tree.props.children[1].props.title, 'Result');
    assert.deepEqual(harness.labels(tree), ['Continue']);
    assert.equal(tree.props.children[2].props.children[1].props.children.props.disabled, true);
    assert.deepEqual(harness.previewClaims, [mode]);
    assert.deepEqual(harness.realClaims, []);
    assert.equal(harness.options.length, 0);
    harness.flushFrames();
    assert.equal(harness.options.length, 0);
  }
});

test('dev claim previews also wait for the native transition before completion feedback', () => {
  const harness = setup({ response: { outcome: 'recorded', coinsAwarded: 10 } }, { openingTransitionComplete: false });
  const screen = harness.exports.default({ navigation: harness.navigation, route: { params: { kind: 'todo', previewClaim: 'quick' } } });
  assert.equal(screen.props.openingTransitionComplete, false);
  const shell = harness.exports.TodoClaimRewardPreview(screen.props);
  assert.equal(shell.props.openingTransitionComplete, false);
  const waiting = harness.renderContent(shell.props);
  waiting.props.children[1].props.onReady();
  harness.renderContent(shell.props);
  assert.equal(harness.sounds.at(-1)[1].autoPlay, false);
  assert.equal(harness.haptics.at(-1)[1], false);
  harness.renderContent({ ...shell.props, openingTransitionComplete: true });
  assert.equal(harness.sounds.at(-1)[1].autoPlay, true);
  assert.equal(harness.haptics.at(-1)[1], true);
});

test('preview Continue returns to Settings and skips day, first-win and tour handoffs', () => {
  const harness = setup({ response: { coinsAwarded: 10 }, getDayCompleteUnitId: () => 'real-day' });
  const shell = harness.exports.TodoClaimRewardPreview({ navigation: harness.navigation, mode: 'quick', openingTransitionComplete: true });
  const loading = harness.renderContent(shell.props);
  loading.props.children[1].props.onReady();
  const tree = harness.renderContent(shell.props);
  const onContinue = tree.props.children[2].props.children[1].props.children.props.onPress;
  onContinue(); onContinue();
  assert.equal(harness.backed(), 1);
  assert.equal(harness.closedHome(), 0);
  assert.deepEqual(harness.handed, []);
  harness.close();
  assert.deepEqual(harness.celebrations, []);
  harness.renderContent({ navigation: harness.navigation, params: { kind: 'lesson', coins: 10 }, openingTransitionComplete: true, preview: true });
  harness.close();
  assert.deepEqual(harness.celebrations, [], 'even a lesson preview must leave real tour state untouched');
});

test('preview balances stay out of real wallet components and hide sharing', () => {
  for (const earnedShown of [false, true]) {
    const harness = setup({ response: { coinsAwarded: 10 }, getDayCompleteUnitId: () => undefined }, { earnedShown });
    const shell = harness.exports.TodoClaimRewardPreview({ navigation: harness.navigation, mode: 'quick', openingTransitionComplete: true });
    const loading = harness.renderContent(shell.props);
    loading.props.children[1].props.onReady();
    const tree = harness.renderContent(shell.props);
    const topBar = tree.props.children[0];
    assert.equal(topBar.props.children[0].props.children, false);
    const target = topBar.props.children[1];
    assert.equal(target.props.ref, 'balanceRef');
    const balance = target.props.children;
    assert.equal(balance.type, '../components/common/StatChip');
    assert.equal(balance.props.value, earnedShown ? 110 : 100);
    assert.equal(balance.props.mark.props.name, 'coin');
    assert.equal(balance.props.userId, undefined);
    assert.equal(tree.props.children[3].props.targetRef, target.props.ref);
  }
});

test('production rejects preview routes without mounting any claim hook or reward content', () => {
  const harness = setup({ response: null }, { dev: false });
  const screen = harness.exports.default({ navigation: harness.navigation, route: { params: { kind: 'todo', previewClaim: 'quick' } } });
  assert.equal(screen, null);
  assert.equal(harness.backed(), 1);
  assert.deepEqual(harness.previewClaims, []);
  assert.deepEqual(harness.realClaims, []);
  assert.deepEqual(harness.flights, []);
  harness.flushFrames();
  assert.deepEqual(harness.options, []);
});

test('Settings offers repeatable dev previews for quick save, slow save and retry', () => {
  const path = './SettingsScreen.tsx';
  const code = readFileSync(new URL(path, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let row;
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === 'SettingsRow') {
      const label = node.attributes.properties.find((attribute) => attribute.name?.getText(ast) === 'label');
      if (label?.initializer?.text === 'Preview habit claim (dev)') row = node;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(row);
  let parent = row.parent;
  while (parent && !(ts.isConditionalExpression(parent) && parent.condition.getText(ast) === '__DEV__')) parent = parent.parent;
  assert.ok(parent, 'the settings row is only rendered in development');
  const handler = row.attributes.properties.find((attribute) => attribute.name?.getText(ast) === 'onPress').initializer.expression.getText(ast);
  const navigations = [];
  let alert;
  const onPress = vm.runInNewContext('(' + handler + ')', {
    Alert: { alert: (...args) => { alert = args; } },
    navigation: { navigate: (...args) => navigations.push(args) },
  });
  onPress();
  assert.match(alert[1], /as often as you like/);
  assert.match(alert[1], /habits, coins and plan stay unchanged/);
  assert.deepEqual(Array.from(alert[2], (button) => button.text), ['Quick', 'Slow save', 'Fail then retry']);
  alert[2].forEach((button) => button.onPress());
  assert.deepEqual(navigations.map(([route, params]) => [route, { ...params }]), [
    ['ActivityReward', { kind: 'todo', previewClaim: 'quick' }],
    ['ActivityReward', { kind: 'todo', previewClaim: 'slow' }],
    ['ActivityReward', { kind: 'todo', previewClaim: 'retry' }],
  ]);
  onPress();
  alert[2][0].onPress();
  assert.equal(navigations.length, 4, 'previews remain available on later attempts');
});

test('ActivityReward uses the same constant native fade as SessionComplete for every route variant', () => {
  const path = '../app/navigation/RootNavigator.tsx';
  const code = readFileSync(new URL(path, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const expressions = {};
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === 'Stack.Screen') {
      const attributes = node.attributes.properties;
      const routeName = attributes.find((attribute) => attribute.name?.getText(ast) === 'name')?.initializer?.text;
      if (routeName === 'ActivityReward' || routeName === 'SessionComplete') {
        expressions[routeName] = attributes.find((attribute) => attribute.name?.getText(ast) === 'options').initializer.expression.getText(ast);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(expressions.ActivityReward);
  assert.ok(expressions.SessionComplete);
  const options = vm.runInNewContext('(' + expressions.ActivityReward + ')');
  const sessionOptions = vm.runInNewContext('(' + expressions.SessionComplete + ')');
  assert.deepEqual({ ...options }, { ...sessionOptions });
  assert.equal(typeof options, 'object', 'claim params never choose a different entrance');
  assert.equal(options.animation, 'fade');
  assert.equal(options.gestureEnabled, false);
});
