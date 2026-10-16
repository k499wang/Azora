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
    placement: 'pending', preview: false, focused: true,
    scoreLoading: true, profileSummary: undefined,
  };
  const slots = [];
  const effects = [];
  let cursor = 0, tree, jumpOptions;
  const slot = (initial) => {
    const at = cursor++;
    if (!(at in slots)) slots[at] = initial();
    return slots[at];
  };
  const jsx = (type, props, key) => ({ type, props, key });
  const dependencies = {
    react: {
      useMemo: fn => fn(), useCallback: fn => fn,
      useEffect(callback, dependencies) {
        const state = slot(() => ({}));
        if (state.dependencies?.length === dependencies?.length &&
            dependencies?.every((value, index) => Object.is(value, state.dependencies[index]))) return;
        state.dependencies = dependencies;
        effects.push(() => { state.cleanup?.(); state.cleanup = callback(); });
      },
      useState(initial) {
        const state = slot(() => ({ value: initial }));
        return [state.value, value => { state.value = typeof value === 'function' ? value(state.value) : value; }];
      },
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    '@react-navigation/native': { useIsFocused: () => state.focused },
    'react-native': {
      View: 'View', Pressable: 'Pressable', ActivityIndicator: 'ActivityIndicator',
      StyleSheet: { create: value => value }, useWindowDimensions: () => ({ width: 390, height: 844 }),
    },
    'react-native-reanimated': {
      default: { ScrollView: 'ScrollView', View: 'AnimatedView' },
      useSharedValue: value => slot(() => ({ value })),
      useAnimatedStyle: callback => Object.defineProperties({}, Object.fromEntries(
        Object.keys(callback()).map(key => [key, { enumerable: true, get: () => callback()[key] }]),
      )),
      useReducedMotion: () => false, withTiming: value => value,
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 44, bottom: 34 }) },
    '../hooks/useIsRegularWidth': { useIsRegularWidth: () => false },
    '../components/common/CollapsingTitleBar': {
      default: 'TitleBar', useCollapsingContentInset: () => 100, useCollapsingTitleBarBottom: () => 100,
      useCollapsingTitle: () => ({ scrollY: { value: 0 }, onScroll: noop }),
    },
    '../features/plan/usePathDayCompletion': { usePathDayCompletion: () => undefined },
    '../features/plan/PlanWeekBanner': { TopBarWeekBanner: 'TopBarWeekBanner' },
    '../features/plan/useTodayJump': { useTodayJump: options => {
      jumpOptions = options;
      return { placement: state.placement, todayRef: noop, remeasure: noop, jump: noop };
    } },
    '../features/plan/domain/planCalendar': { planCalendar: (_id, daysDone) => ({ daysDone, weeks: [{ week: 1 }, { week: 2 }] }) },
    '../features/plan/domain/planStart': { planStartOffer: () => ({ planId: 'stress' }) },
    '../features/plan/domain/planDayGate': { isPlanDayGated: () => false },
    '../features/plan/domain/pathGold': { pathGoldDays },
    '../queries/program/useProgramDayFinishDatesQuery': { useProgramDayFinishDatesQuery: () => state.dates },
    '../features/plan/useAzoraScore': { useAzoraScore: () => ({ score: 0, isLoading: state.scoreLoading }) },
    '../hooks/usePlanPosition': { usePlanPositionState: () => state.plan },
    '../hooks/useTodayLocalDate': { useTodayLocalDate: () => '2026-10-14' },
    '../queries/profile/useSavedOnboardingProfileQuery': { useSavedOnboardingProfileQuery: () => ({ isPending: false }) },
    '../queries/profile/useProfileSummaryQuery': { useProfileSummaryQuery: () => ({ data: state.profileSummary }) },
    '../queries/program/useStartProgramEnrollmentMutation': { useStartProgramEnrollmentMutation: () => ({ mutate: noop }) },
    '../queries/subscriptions/useUserEntitlementQuery': { useUserEntitlementQuery: () => state.entitlement },
    '../components/onboarding/data/intentOptions': { ONBOARDING_INTENT_LOOKUP_OPTIONS: [] },
    '../features/lessons/domain/phoneLessonTrack': { phoneLessonTrackForIntent: () => 'work', phoneLessonTrackForEnrollment: () => undefined },
    '../features/lessons/domain/pressureLessonTrack': { pressureLessonTrackForIntent: () => null, pressureLessonTrackForEnrollment: () => undefined },
    '../lib/planProgress': { buildIntentTitleLookup: () => ({}), resolvePlanIntent: () => null },
    '../lib/onboardingArchetype': { ARCHETYPE_FOR_PLAN: { stress: { planName: 'Stress relief' } } },
    '../stores/authStore': { useAuthStore: select => select({ user: { id: 'user' } }) },
    '../services/paywall': { PaywallPlacement: {} },
    '../theme/card': { card: {} },
    '../theme/colors': { colors: { background: {}, text: {}, playful: { sky: {} } } },
    '../theme/motion': { duration: {}, easing: {} },
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
    state, find, tree: () => tree,
    render() {
      cursor = 0;
      tree = exports.default({ navigation: { navigate: noop, setParams: noop }, route: { params: { previewFinishedPlan: state.preview } } });
      while (effects.length) effects.shift()();
      return tree;
    },
    header: () => tree.props.children.find(node => node?.props?.onLayout),
    measureHeader(height = 100) {
      harness.header()?.props.onLayout({ nativeEvent: { layout: { y: 0, height } } });
      harness.render();
    },
    ready() { find('PlanPath').props.onDrawn(); harness.render(); },
    controls() { return { jump: find('TodayJumpButton').props.direction }; },
    nodeKey: () => jumpOptions.nodeKey,
    visibleTop: () => jumpOptions.visibleTop,
    retries: () => retries,
  };
  harness.render();
  return harness;
}

function assertPageVisible(screen) {
  const pathTo = (type, node) => {
    if (node == null || typeof node !== 'object') return null;
    if (node.type === type) return [node];
    for (const child of [node.props?.children].flat(Infinity)) {
      const path = pathTo(type, child);
      if (path != null) return [node, ...path];
    }
    return null;
  };
  for (const type of ['ScrollView', ...(screen.find('TopBarWeekBanner') ? ['TopBarWeekBanner'] : [])]) {
    const path = pathTo(type, screen.tree());
    assert.ok(path);
    for (const node of path) {
      const style = Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean));
      assert.equal(style.opacity ?? 1, 1, `${type} and its ancestors must be visible without sizing callbacks`);
    }
  }
}

test('cold loading, error and active plan stay visible before title or banner measurements', () => {
  const loading = screenHarness();
  Object.assign(loading.state.plan, { enrollment: null, position: null, hasEnrollment: false, isLoading: true });
  loading.render();
  assert.ok(loading.find('ActivityIndicator'));
  assertPageVisible(loading);

  const failed = screenHarness();
  Object.assign(failed.state.plan, { enrollment: null, position: null, hasEnrollment: false, isError: true });
  failed.render();
  assert.ok(failed.find('Pressable'));
  assertPageVisible(failed);

  const active = screenHarness();
  assert.ok(active.find('PlanPath'));
  assert.ok(active.find('TopBarWeekBanner'));
  assertPageVisible(active);
  active.measureHeader();
  // No banner sizing callback is needed to show the page.
  assertPageVisible(active);
});

test('ten focus and background refresh cycles preserve visible plan content without banner measurements', () => {
  const screen = screenHarness();
  screen.measureHeader();
  for (let cycle = 0; cycle < 10; cycle++) {
    screen.state.focused = false;
    screen.state.dates.isFetching = true;
    screen.render();
    assert.ok(screen.find('PlanPath'));
    assertPageVisible(screen);

    screen.state.focused = true;
    screen.state.dates.isFetching = false;
    screen.render();
    assert.ok(screen.find('PlanPath'));
    assertPageVisible(screen);
  }
});

test('the title and banner share a native header before the scroll, without guessed offsets', () => {
  const screen = screenHarness();
  const root = screen.render();
  const header = screen.header();
  assert.ok(root.props.children.indexOf(header) < root.props.children.indexOf(screen.find('ScrollView')));
  assert.ok(screen.find('TabTitleRow', header));
  assert.ok(screen.find('TopBarWeekBanner', header));
  const headerStyle = Object.assign({}, ...header.props.style);
  assert.notEqual(headerStyle.position, 'absolute');

  const before = screen.find('ScrollView').props.contentContainerStyle.paddingTop;
  assert.equal(before, 16);
  screen.measureHeader(260);
  assert.equal(screen.find('ScrollView').props.contentContainerStyle.paddingTop, before);
  assert.deepEqual(screen.header().props.style, header.props.style);
  assert.equal(screen.visibleTop(), 260, 'today measurements still use window coordinates');
  assert.equal(screen.find('PlanPath').props.revealTop, 276);
  assert.equal(screen.find('TopBarWeekBanner').props.visibleTop, undefined, 'week switching uses scroll content coordinates');
  assert.equal(screen.find('TopBarWeekBanner').props.onSized, undefined);
  assertPageVisible(screen);
});

test('the stat group keeps a fixed footprint and right-aligns the natural pill widths as values load', () => {
  const screen = screenHarness();
  const group = () => screen.find('TabTitleRow').props.action;
  const initial = group().props.style;
  assert.equal(initial.width, 160);
  assert.equal(initial.justifyContent, 'flex-end');
  assert.equal(initial.alignItems, 'center');
  assert.equal(initial.gap, 4);
  for (const child of group().props.children) {
    assert.equal(child.props.style?.width, undefined, 'the pills keep their natural widths');
  }
  assert.equal(group().props.children[1].type, 'TopBarStreak');

  screen.state.scoreLoading = false;
  screen.state.profileSummary = { currentStreak: 123 };
  screen.render();
  assert.deepEqual(group().props.style, initial);
});

test('cold plan load shows loading rather than a start offer or floating control', () => {
  const screen = screenHarness();
  Object.assign(screen.state.plan, { enrollment: null, position: null, hasEnrollment: false, isLoading: true });
  screen.render();
  assert.ok(screen.find('ActivityIndicator'));
  assert.equal(screen.find('PlanStartEmptyState'), undefined);
  assert.equal(screen.find('PlanPath'), undefined);
  assert.deepEqual(screen.controls(), { jump: null });
});

test('the first control is the measured arrow, with no intermediate Start button', () => {
  const screen = screenHarness();
  screen.ready();
  assert.deepEqual(screen.controls(), { jump: null });
  screen.state.placement = 'up'; screen.render();
  assert.deepEqual(screen.controls(), { jump: 'up' });
  screen.state.placement = 'on-screen'; screen.render();
  assert.deepEqual(screen.controls(), { jump: null });
  screen.state.placement = 'down'; screen.render();
  assert.deepEqual(screen.controls(), { jump: 'down' });
});

test('the initial pills, week card and path appear together after required query data settles', () => {
  const screen = screenHarness();
  screen.state.entitlement.isPending = true; screen.render();
  assert.equal(screen.find('PlanPath'), undefined);
  assert.equal(screen.find('TopBarWeekBanner'), undefined);
  assert.equal(screen.find('TabTitleRow').props.action, undefined);
  assert.ok(screen.find('ActivityIndicator'));
  assertPageVisible(screen);
  screen.state.entitlement.isPending = false;
  screen.state.dates = { isSuccess: false, isError: false, isFetching: true };
  screen.render();
  assert.ok(screen.find('ActivityIndicator'));
  assert.equal(screen.find('TopBarWeekBanner'), undefined);
  assert.equal(screen.find('TabTitleRow').props.action, undefined);
  assertPageVisible(screen);
  screen.state.dates = { isSuccess: true, isError: false, isFetching: false, data: [] };
  screen.render();
  assert.ok(screen.find('PlanPath'));
  assert.ok(screen.find('TopBarWeekBanner'));
  assert.ok(screen.find('TabTitleRow').props.action);
  assert.equal(screen.find('ActivityIndicator'), undefined);
  assertPageVisible(screen);
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
    assert.deepEqual(screen.controls(), { jump: 'up' });
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
  assert.deepEqual(screen.controls(), { jump: null });
  screen.state.placement = 'pending'; screen.ready();
  assert.deepEqual(screen.controls(), { jump: null });
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
  assert.deepEqual(finished.controls(), { jump: null });
  const preview = screenHarness();
  preview.state.placement = 'on-screen'; preview.ready();
  preview.state.preview = true; preview.render();
  assert.deepEqual(preview.controls(), { jump: null });
});
