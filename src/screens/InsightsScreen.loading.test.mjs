import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { pathGoldDays } from '../features/plan/domain/pathGold.ts';

const compiled = ts.transpileModule(readFileSync(new URL('./InsightsScreen.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function screenHarness() {
  const noop = () => {};
  let retries = 0;
  const state = {
    plan: {
      enrollment: { enrollmentId: 'first', planId: 'stress' },
      position: { planId: 'stress', daysDone: 2, finishedToday: false, isFinished: false },
      isLoading: false, isError: false, hasEnrollment: true, refetch: () => { retries++; },
    },
    entitlement: { data: { isPro: true }, isPending: false },
    dates: { isSuccess: true, isError: false, isFetching: false, data: [
      { programDay: 1, localDate: '2026-10-12' }, { programDay: 2, localDate: '2026-10-13' },
    ] },
    placement: 'pending', startNext: noop, preview: false,
  };
  const slots = [];
  let cursor = 0, tree, jumpOptions;
  const jsx = (type, props, key) => ({ type, props, key });
  const dependencies = {
    react: {
      useMemo: fn => fn(), useCallback: fn => fn,
      useState(initial) {
        const at = cursor++;
        if (!(at in slots)) slots[at] = initial;
        return [slots[at], value => { slots[at] = typeof value === 'function' ? value(slots[at]) : value; }];
      },
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@react-navigation/native': { useIsFocused: () => true },
    'react-native': {
      View: 'View', Pressable: 'Pressable', ActivityIndicator: 'ActivityIndicator',
      StyleSheet: { create: value => value }, useWindowDimensions: () => ({ width: 390, height: 844 }),
    },
    'react-native-reanimated': { default: { ScrollView: 'ScrollView' }, useSharedValue: value => ({ value }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 44, bottom: 34 }) },
    '../hooks/useIsRegularWidth': { useIsRegularWidth: () => false },
    '../components/common/CollapsingTitleBar': {
      default: 'TitleBar', useCollapsingContentInset: () => 100, useCollapsingTitleBarBottom: () => 100,
      useCollapsingTitle: () => ({ scrollY: { value: 0 }, onScroll: noop }),
    },
    '../features/plan/useNextTodayStep': { useNextTodayStep: () => ({ startNext: state.startNext, completion: undefined }) },
    '../features/plan/StartSessionBar': { default: 'StartSessionBar', START_SESSION_BAR_HEIGHT: 64 },
    '../features/plan/useTodayJump': { useTodayJump: options => {
      jumpOptions = options;
      return { placement: state.placement, todayRef: noop, remeasure: noop, jump: noop };
    } },
    '../features/plan/domain/planCalendar': { planCalendar: (_id, daysDone) => ({ daysDone, weeks: [] }) },
    '../features/plan/domain/planStart': { planStartOffer: () => ({ planId: 'stress' }) },
    '../features/plan/domain/planDayGate': { isPlanDayGated: () => false },
    '../features/plan/domain/pathGold': { pathGoldDays },
    '../queries/program/useProgramDayFinishDatesQuery': { useProgramDayFinishDatesQuery: () => state.dates },
    '../features/plan/useAzoraScore': { useAzoraScore: () => ({ score: 0, isLoading: false }) },
    '../hooks/usePlanPosition': { usePlanPositionState: () => state.plan },
    '../hooks/useTodayLocalDate': { useTodayLocalDate: () => '2026-10-14' },
    '../queries/profile/useSavedOnboardingProfileQuery': { useSavedOnboardingProfileQuery: () => ({ isPending: false }) },
    '../queries/profile/useProfileSummaryQuery': { useProfileSummaryQuery: () => ({ data: undefined }) },
    '../queries/program/useStartProgramEnrollmentMutation': { useStartProgramEnrollmentMutation: () => ({ mutate: noop }) },
    '../queries/subscriptions/useUserEntitlementQuery': { useUserEntitlementQuery: () => state.entitlement },
    '../components/onboarding/data/intentOptions': { ONBOARDING_INTENT_LOOKUP_OPTIONS: [] },
    '../features/lessons/domain/pressureLessonTrack': { pressureLessonTrackForIntent: () => null },
    '../lib/planProgress': { buildIntentTitleLookup: () => ({}), resolvePlanIntent: () => null },
    '../lib/onboardingArchetype': { ARCHETYPE_FOR_PLAN: { stress: { planName: 'Stress relief' } } },
    '../stores/authStore': { useAuthStore: select => select({ user: { id: 'user' } }) },
    '../services/paywall': { PaywallPlacement: {} },
    '../theme/card': { card: {} },
    '../theme/colors': { colors: { background: {}, text: {}, playful: { sky: {} } } },
    '../theme/spacing': { padding: { screen: {} }, spacing: { xs: 4, sm: 8, md: 16, xl: 24 } },
    '../theme/typography': { fonts: {}, typography: { title: {}, body: {} } },
    '../features/tour/tourTargets': { useTourScroller: () => ({ ref: { current: null }, onScroll: noop }), useTourTarget: () => ({}) },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, __DEV__: true,
    require(name) {
      if (name in dependencies) return dependencies[name];
      const component = name.split('/').at(-1);
      assert.match(name, /components\/common|features\/plan|features\/selfCare/);
      return { default: component, [component]: component };
    },
  });
  const find = (type, node = tree) => {
    if (node == null || typeof node !== 'object') return undefined;
    if (node.type === type) return node;
    for (const child of [node.props?.children].flat(Infinity)) {
      if (child == null) continue;
      const match = find(type, child);
      if (match) return match;
    }
  };
  const harness = {
    state, find,
    render() {
      cursor = 0;
      tree = exports.default({ navigation: { navigate: noop, setParams: noop }, route: { params: { previewFinishedPlan: state.preview } } });
      return tree;
    },
    ready() { find('PlanPath').props.onDrawn(); harness.render(); },
    controls() { return { start: find('StartSessionBar').props.visible, jump: find('TodayJumpButton').props.direction }; },
    nodeKey: () => jumpOptions.nodeKey,
    retries: () => retries,
  };
  harness.render();
  return harness;
}

test('cold plan load shows loading rather than a start offer or floating control', () => {
  const screen = screenHarness();
  Object.assign(screen.state.plan, { enrollment: null, position: null, hasEnrollment: false, isLoading: true });
  screen.render();
  assert.ok(screen.find('ActivityIndicator'));
  assert.equal(screen.find('PlanStartEmptyState'), undefined);
  assert.equal(screen.find('PlanPath'), undefined);
  assert.deepEqual(screen.controls(), { start: false, jump: null });
});

test('the first control is the measured arrow, with no intermediate Start button', () => {
  const screen = screenHarness();
  screen.ready();
  assert.deepEqual(screen.controls(), { start: false, jump: null });
  screen.state.placement = 'up'; screen.render();
  assert.deepEqual(screen.controls(), { start: false, jump: 'up' });
  screen.state.placement = 'on-screen'; screen.render();
  assert.deepEqual(screen.controls(), { start: true, jump: null });
  screen.state.placement = 'down'; screen.render();
  assert.deepEqual(screen.controls(), { start: false, jump: 'down' });
});

test('initial entitlement and completion dates settle before the path is mounted', () => {
  const screen = screenHarness();
  screen.state.entitlement.isPending = true; screen.render();
  assert.equal(screen.find('PlanPath'), undefined);
  screen.state.entitlement.isPending = false;
  screen.state.dates = { isSuccess: false, isError: false, isFetching: true };
  screen.render();
  assert.ok(screen.find('ActivityIndicator'));
  screen.state.dates = { isSuccess: true, isError: false, isFetching: false, data: [] };
  screen.render();
  assert.ok(screen.find('PlanPath'));
  assert.equal(screen.find('ActivityIndicator'), undefined);
});

test('day one, failed decoration reads, and another enrollment’s cached dates cannot hide the path', () => {
  for (const dates of [
    { isSuccess: true, isError: false, data: undefined },
    { isSuccess: false, isError: true, data: undefined },
  ]) {
    const screen = screenHarness();
    screen.state.dates = dates; screen.render();
    assert.ok(screen.find('PlanPath'));
    assert.equal(screen.find('PlanPath').props.goldDays.size, 0);
  }
  const screen = screenHarness();
  screen.state.plan.position = { ...screen.state.plan.position, daysDone: 0 };
  screen.state.dates = { isSuccess: false, isError: false, isFetching: true };
  screen.render();
  assert.ok(screen.find('PlanPath'));
});

test('ten background refresh cycles keep the cached path, gold and current control', () => {
  const screen = screenHarness();
  screen.state.placement = 'up'; screen.ready();
  for (let cycle = 0; cycle < 10; cycle++) {
    screen.state.dates.isFetching = true; screen.render();
    assert.equal(screen.find('PlanPath').key, 'first');
    assert.deepEqual([...screen.find('PlanPath').props.goldDays], [1, 2]);
    assert.deepEqual(screen.controls(), { start: false, jump: 'up' });
    assert.equal(screen.find('ActivityIndicator'), undefined);
    screen.state.dates.isFetching = false; screen.render();
  }
});

test('a new enrollment of the same plan gets fresh layout readiness and today identity', () => {
  const screen = screenHarness();
  screen.state.placement = 'on-screen'; screen.ready();
  const previousIdentity = screen.nodeKey();
  screen.state.plan.enrollment = { ...screen.state.plan.enrollment, enrollmentId: 'second' };
  screen.render();
  assert.equal(screen.find('PlanPath').key, 'second');
  assert.notEqual(screen.nodeKey(), previousIdentity);
  assert.deepEqual(screen.controls(), { start: false, jump: null });
  screen.state.placement = 'pending'; screen.ready();
  assert.deepEqual(screen.controls(), { start: false, jump: null });
});

test('a failed enrollment read offers retry and finished/preview screens have no floats', () => {
  const screen = screenHarness();
  Object.assign(screen.state.plan, { enrollment: null, position: null, hasEnrollment: false, isError: true });
  screen.render();
  assert.equal(screen.find('ActivityIndicator'), undefined);
  assert.equal(screen.find('PlanStartEmptyState'), undefined);
  screen.find('Pressable').props.onPress();
  assert.equal(screen.retries(), 1);
  const finished = screenHarness();
  finished.state.placement = 'on-screen'; finished.ready();
  finished.state.plan.position = { ...finished.state.plan.position, isFinished: true };
  finished.render();
  assert.ok(finished.find('PlanFinishedState'));
  assert.deepEqual(finished.controls(), { start: false, jump: null });
  const preview = screenHarness();
  preview.state.placement = 'on-screen'; preview.ready();
  preview.state.preview = true; preview.render();
  assert.deepEqual(preview.controls(), { start: false, jump: null });
});
