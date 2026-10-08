import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { attentionScriptForDate } from '../features/attention/domain/attentionScripts.ts';

const compiled = ts.transpileModule(readFileSync(new URL('./AttentionSessionScreen.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function screen(scriptId, { claim = true, plan = false, lastUnit = false } = {}) {
  const slots = [];
  const events = [];
  let cursor = 0;
  let onClosed;
  let countdown;
  let resolve;
  let reject;
  const activityId = `reset:${scriptId}`;
  const element = (type, props) => ({ type, props });
  const animation = new Proxy({}, { get: () => () => animation });
  const store = {
    show: options => events.push(['show', options.heldForClose]),
    revealAfterClose: () => events.push(['reveal']),
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, Date, require(name) {
    if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element };
    if (name === 'react') return {
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
        return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
      },
      useRef(initial) { return slots[cursor++] ??= { current: initial }; },
      useCallback: fn => fn,
      useEffect() {},
    };
    if (name === 'react-native') return { View: 'View', StyleSheet: { create: value => value } };
    if (name === 'react-native-reanimated') return { default: { View: 'Animated.View' }, FadeInDown: animation, FadeOut: animation, ReduceMotion: {} };
    if (name === '@react-navigation/native') return { useIsFocused: () => true };
    if (name === 'expo-keep-awake') return { useKeepAwake() {} };
    if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
    if (name.endsWith('/useAfterScreenClosed')) return { useAfterScreenClosed: (_, callback) => { onClosed = callback; } };
    if (name.endsWith('/useCloseOntoHome')) return { useCloseOntoHome: () => () => events.push(['home']) };
    if (name.includes('/components/common/')) return { default: name.split('/').at(-1), Text: 'Text' };
    if (name.endsWith('/AttentionCountDots') || name.endsWith('/AttentionSqueezeShape')) return { default: name.split('/').at(-1) };
    if (name.endsWith('/attentionScripts')) return { attentionScriptForDate };
    if (name.endsWith('/useAttentionStepCountdown')) return { useAttentionStepCountdown: options => { countdown = options; return 0; } };
    if (name.endsWith('/useAttentionCueSounds')) return { useAttentionCueSounds() {} };
    if (name.endsWith('/useAttentionTapCount')) return { useAttentionTapCount: () => ({ full: true, counted: 0 }) };
    if (name.endsWith('/programCatalogue')) return { PROGRAM_ACTIVITIES: new Map([[activityId, { delivery: { modality: 'attention', scriptId } }]]) };
    if (name.endsWith('/devDayCompleteOverride')) return { takeForcedDayComplete: () => false };
    if (name.endsWith('/homeDayCompleteHandoff')) return { handDayCompleteToHome: id => events.push(['handoff', id]) };
    if (name.endsWith('/useRoomClaim')) return { useRoomClaim: () => ({ dailies: { units: lastUnit ? [{ id: activityId }] : [] }, progress: {} }) };
    if (name.endsWith('/dayUnit')) return { isLastUnfinishedDayUnit: () => lastUnit };
    if (name.endsWith('/roomProgress')) return { hasPieceToEarn: () => lastUnit };
    if (name.endsWith('/coins')) return { EARN_RATES: { planActivity: 20 } };
    if (name.endsWith('/useTodayLocalDate')) return { useTodayLocalDate: () => '2026-10-05' };
    if (name.endsWith('/useTodayProgramDay')) return { useTodayProgramDay: () => ({ day: plan ? { activities: [{ activityId, completed: false }], enrollment: { enrollmentId: 'enrollment' }, programDay: 2 } : null }) };
    if (name.endsWith('/tapHaptics')) return { triggerLightHaptic() {}, triggerTapHaptic() {} };
    if (name.endsWith('/useCompleteAttentionSessionMutation')) return { useCompleteAttentionSessionMutation: () => ({ mutateAsync: variables => { events.push(['save', variables]); return new Promise((yes, no) => { resolve = yes; reject = no; }); } }) };
    if (name.endsWith('/useFirstWinOfDay')) return { useFirstWinOfDay: () => ({ claim: () => { events.push(['claim']); return claim; }, withdraw: () => events.push(['withdraw']) }) };
    if (name.endsWith('/firstWinOfDayStore')) return { useFirstWinOfDayStore: { getState: () => store } };
    if (name.endsWith('/tracking')) return { trackAttentionSessionStarted() {}, trackAttentionSessionAbandoned() {}, trackAttentionSessionCompleted() {} };
    if (name.endsWith('/authStore')) return { useAuthStore: selector => selector({ user: { id: 'user' } }) };
    if (name.endsWith('/colors')) return { colors: { background: {}, text: {} } };
    if (name.endsWith('/RewardAnimationPreload')) return { default: 'RewardAnimationPreload' };
    if (name.endsWith('/motion')) return { duration: {} };
    if (name.endsWith('/spacing')) return { padding: { screen: {} }, spacing: {} };
    if (name.endsWith('/typography')) return { fonts: {}, typography: { title: {}, body: {} } };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  const navigation = { goBack: () => events.push(['back']), replace: (route, params) => events.push(['replace', route, params]) };
  function render() { cursor = 0; return exports.default({ navigation, route: { params: { activityId } } }); }
  function findButton(node) {
    if (node == null || typeof node !== 'object') return undefined;
    if (node?.type === 'ChunkyButton') return node;
    return [node?.props?.children].flat(Infinity).map(findButton).find(Boolean);
  }
  function finish() {
    const script = attentionScriptForDate(scriptId, '2026-10-05');
    for (const step of script.steps) {
      const tree = render();
      if (step.kind === 'timed') countdown.onElapsed();
      else findButton(tree).props.onPress();
    }
  }
  return { events, finish, close: () => onClosed(), succeed: counted => resolve(counted), fail: () => reject(new Error('offline')) };
}

for (const scriptId of ['54321', 'muscle-release']) {
  test(`${scriptId}: first win is claimed before save and held until close`, async () => {
    const app = screen(scriptId);
    app.finish();
    assert.deepEqual(app.events.map(event => event[0]), ['claim', 'show', 'save', 'back']);
    assert.equal(app.events[1][1], true);
    app.succeed(true);
    await Promise.resolve();
    app.close();
    assert.equal(app.events.at(-1)[0], 'reveal');
  });
  test(`${scriptId}: same-day completion does not show another popup`, async () => {
    const app = screen(scriptId, { claim: false });
    app.finish();
    app.succeed(true);
    await Promise.resolve();
    assert.equal(app.events.some(event => event[0] === 'show'), false);
  });
}

test('failed and unrecorded writes withdraw the popup after leaving the screen', async () => {
  for (const outcome of ['failure', 'unrecorded']) {
    const app = screen('54321');
    app.finish();
    app.close();
    if (outcome === 'failure') app.fail();
    else app.succeed(false);
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(app.events.at(-1)[0], 'withdraw');
  }
});

test('plan coins transfer the popup hold to ActivityReward and preserve the day-complete unit', async () => {
  const app = screen('54321', { plan: true, lastUnit: true });
  app.finish();
  const reward = app.events.find(event => event[0] === 'replace');
  assert.equal(reward[1], 'ActivityReward');
  assert.equal(reward[2].coins, 20);
  assert.equal(reward[2].dayCompleteUnitId, 'reset:54321');
  app.succeed(true);
  await Promise.resolve();
  app.close();
  assert.equal(app.events.some(event => event[0] === 'reveal'), false);
});

test('a final daily unit without coins still closes onto Home before revealing', () => {
  const app = screen('54321', { lastUnit: true });
  app.finish();
  assert.deepEqual(app.events.slice(-2).map(event => event[0]), ['handoff', 'home']);
  app.close();
  assert.equal(app.events.at(-1)[0], 'reveal');
});
