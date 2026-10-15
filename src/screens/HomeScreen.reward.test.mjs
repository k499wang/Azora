import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const current = readFileSync(new URL('./HomeScreen.tsx', import.meta.url), 'utf8');
const snapshotSource = readFileSync(new URL('../features/room/useDailyCompleteSnapshot.ts', import.meta.url), 'utf8');
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

// Run Home and its real snapshot hook. Native UI, queries, and the reward stage
// are boundaries: this checks Home's effects and callback wiring, not animation.
export function mount(source = current) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let dirty = false;
  let tree;
  let focused = true;
  let seen = null;
  let handoff = { stage: 'idle', unitId: null };
  let claim;
  const timers = new Map();
  const placements = [];
  const trace = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (next) => {
        const value = typeof next === 'function' ? next(slots[index]) : next;
        if (!Object.is(value, slots[index])) { slots[index] = value; dirty = true; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useMemo(factory, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => !Object.is(value, slots[index].deps[i]))) {
        slots[index] = { value: factory(), deps };
      }
      return slots[index].value;
    },
    useCallback(fn, deps) { return react.useMemo(() => fn, deps); },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (previous && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
      slots[index] = { deps };
      effects.push(() => {
        previous?.cleanup?.();
        slots[index].cleanup = effect();
      });
    },
  };
  const progressSeen = {
    readSeenDailies: (date) => seen?.date === date ? seen.done : null,
    markSeenDailies: (date, done) => { seen = { date, done }; },
    wasDayCelebrationSeen: (date, total) => seen?.date === date && total > 0 && seen.done >= total,
  };
  const reward = {
    decorating: false, handingOver: false, sealing: false, sealFrom: null,
    open(options) { reward.decorating = true; reward.handingOver = options?.handOver === true; dirty = true; },
    close() { reward.decorating = false; reward.handingOver = false; dirty = true; },
    startSeal() { reward.sealing = true; dirty = true; },
    endSeal() { reward.sealing = false; dirty = true; },
    setSealFrom() {},
    place(option) { placements.push(option); },
  };
  const replay = { count: 0 };
  const useAuthStore = (select) => select({ user: { id: 'user-a' } });
  const inert = () => {};
  const dependencies = {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'react-native': { View: 'View', ScrollView: 'ScrollView', StyleSheet: { create: (styles) => styles }, useWindowDimensions: () => ({ width: 390 }) },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    '@react-navigation/native': { useIsFocused: () => focused },
    '@tanstack/react-query': { useQueryClient: () => ({ prefetchQuery: inert }) },
    colors: { colors: { background: { canvas: 'white' } } },
    spacing: { spacing: new Proxy({}, { get: () => 8 }), margin: { itemGap: 8 } },
    card: { radius: { hero: 20 } },
    authStore: { useAuthStore },
    useRoomClaim: { useRoomClaim: () => claim },
    useDailyRewardStage: { useDailyRewardStage: () => reward },
    dailyProgressSeen: progressSeen,
    homeDayCompleteHandoff: {
      useHomeDayCompleteHandoff: () => handoff,
      clearDayCompleteForHome() { handoff = { stage: 'idle', unitId: null }; dirty = true; },
    },
    useTrackDailyCompletion: { useTrackDailyCompletion: inert },
    devRoomOverride: { useRewardFlowReplay: () => replay },
    useTodayLocalDate: { useTodayLocalDate: () => claim.dailies.todayLocalDate },
    useAzoraScore: { useAzoraScore: () => ({ score: 1 }) },
    useTodayProgramDay: { useTodayProgramDay: () => ({ day: null, isLoading: false }) },
    useUserEntitlementQuery: { useUserEntitlementQuery: () => ({ data: { isPro: true }, isPending: false }) },
    usePlanPosition: { usePlanPosition: () => ({ daysDone: 0 }) },
    planDayGate: { isPlanDayGated: () => false },
    useStartDaily: { useStartDaily: () => ({ start: inert, startProgramActivity: inert, accessAllowed: true }) },
    useTodoStepAction: { useTodoStepAction: () => ({ state: null }) },
    useMoodCheckInQuery: { useMoodCheckInQuery: () => ({ data: { available: false } }) },
    useDailyPlanScheduleQuery: { useDailyPlanScheduleQuery: () => ({ data: null }) },
    useProfileSummaryQuery: { useProfileSummaryQuery: () => ({ data: null }) },
    useSelfCareGoalsQuery: { getSelfCareGoalsQueryOptions: inert },
    useDashboardLayout: { useDashboardLayout: () => ({ contentInset: 16 }) },
    useIsRegularWidth: { useIsRegularWidth: () => false },
    useSurveyOfferNotice: { useSurveyOfferNotice: () => ({ visible: false }) },
    tourTargets: { useTourScroller: () => ({ ref: { current: null } }), useTourTarget: () => ({}) },
    todayJourneyOrder: { LESSON_JOURNEY_ID: 'lesson', MOOD_JOURNEY_ID: 'mood', TODO_STEP_JOURNEY_ID: 'todo' },
    TodaysDailiesSection: { buildLessonDailyRow: (row) => row },
    paywall: { PaywallPlacement: {} },
    HomeRoom: { default: 'HomeRoom', homeRoomTopSlack: () => 0 },
  };
  function load(source) {
    const exports = {};
    vm.runInNewContext(compile(source), {
      exports,
      setTimeout(callback) { const key = {}; timers.set(key, callback); return key; },
      clearTimeout(key) { timers.delete(key); },
      require(name) {
        const base = name.split('/').at(-1);
        if (name in dependencies) return dependencies[name];
        if (base in dependencies) return dependencies[base];
        // PascalCase imports are leaf UI components, left unrendered here.
        if (/^[A-Z]/.test(base)) return { default: base };
        throw new Error(`Unexpected behavioral dependency: ${name}`);
      },
    });
    return exports;
  }
  dependencies.useDailyCompleteSnapshot = load(snapshotSource);
  const Home = load(source).default;
  const api = {
    setDay({ complete = false, date = '2026-10-15', kind = 'todo', unitId = 'last', claimed = false, full = false, loading = false, settling = false } = {}) {
      const units = [{ id: 'first', kind: 'exercise', completed: true }, { id: unitId, kind, completed: complete }];
      claim = {
        room: { floor: 1 }, isLoading: loading,
        dailies: { todayLocalDate: date, dailiesTotal: 2, units },
        day: { allCompleted: complete, isSettling: settling },
        progress: { canClaim: complete && !claimed && !full, claimedToday: claimed, isComplete: full, nextSlot: full ? null : 'day1', placedCount: full ? 7 : 0 },
      };
    },
    handoff(unitId = 'last') { handoff = { stage: 'ready', unitId }; },
    focus(value) { focused = value; },
    step() {
      cursor = 0; effects = []; dirty = false;
      tree = Home({ navigation: { navigate: inert } });
      trace.push({
        surface: api.find('DailyRewardSurface').visible,
        gift: api.find('DailyCompleteSheet')?.state.unlocked === true,
        picker: api.find('DailyRewardFlow') != null,
      });
      effects.forEach((run) => run());
      return dirty;
    },
    render() {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        if (!api.step()) return tree;
      }
      throw new Error('Home effects did not settle');
    },
    find(type) {
      function visit(node) {
        if (!node || typeof node !== 'object') return null;
        if (node.type === type) return node.props;
        for (const child of [node.props?.children].flat(Infinity)) {
          const found = visit(child);
          if (found) return found;
        }
        return null;
      }
      return visit(tree);
    },
    finishReward() { reward.close(); api.render(); },
    placements,
    takeTrace() { return trace.splice(0); },
    finishSnapshotDeadline() {
      for (const callback of [...timers.values()]) callback();
      api.render();
    },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); assert.equal(timers.size, 0); },
  };
  api.setDay();
  return api;
}

test(`current: completing the last daily still opens gift, then choose and place`, () => {
  const home = mount();
  home.render();
  home.setDay({ complete: true });
  home.render();
  const gift = home.find('DailyCompleteSheet');
  assert.equal(gift?.state.unlocked, true);
  gift.onShow();
  gift.onChoosePiece();
  home.render();
  assert.equal(home.find('DailyRewardSurface').visible, true);
  const picker = home.find('DailyRewardFlow');
  assert.equal(picker.rewardReady, true);
  picker.onPlace('rug-blue');
  assert.deepEqual(home.placements, ['rug-blue']);
  home.finishReward();
  assert.equal(home.find('DailyRewardSurface').visible, false);
  home.unmount();
});

for (const [kind, unitId] of [['lesson', 'lesson:last'], ['mood', 'mood:last'], ['exercise', 'reset:54321'], ['todo', 'todo:last']]) {
  test(`current: final ${unitId} handed to Home opens the same gift`, () => {
    const home = mount();
    home.setDay({ kind, unitId });
    home.render();
    home.focus(false);
    home.handoff(unitId);
    home.render();
    assert.equal(home.find('DailyCompleteSheet'), null);
    home.focus(true);
    home.render();
    assert.equal(home.find('DailyCompleteSheet')?.state.unlocked, true);
    home.setDay({ kind, unitId, complete: true });
    home.render();
    home.find('DailyCompleteSheet').onChoosePiece();
    home.render();
    assert.equal(home.find('DailyRewardFlow')?.rewardReady, true);
    home.unmount();
  });
}

test(`current: opening an already complete day does not automatically celebrate`, () => {
  const home = mount();
  home.setDay({ complete: true });
  home.render();
  assert.equal(home.find('DailyCompleteSheet'), null);
  home.find('RoomProgressCard').onClaim();
  home.render();
  assert.ok(home.find('DailyRewardFlow'));
  home.unmount();
});

test('current: claimed and full-room handoffs never open generic completion UI', () => {
  for (const unavailable of [{ claimed: true }, { full: true }]) {
    const home = mount();
    home.render();
    home.setDay({ ...unavailable, complete: true });
    home.handoff();
    home.render();
    assert.equal(home.find('DailyCompleteSheet'), null);
    assert.equal(home.find('DailyRewardSurface').visible, false);
    assert.equal(home.find('FirstWinOfDayPresenter').active, true);
    home.unmount();
  }
});

test('current: a cold final-activity handoff opens immediately, then fills in its gift', () => {
  const home = mount();
  home.setDay({ loading: true });
  home.handoff();
  home.render();
  assert.equal(home.find('DailyRewardSurface').visible, true);
  assert.equal(home.find('DailyCompleteSheet'), null);
  assert.equal(home.find('FirstWinOfDayPresenter').active, false);
  home.setDay({ complete: true });
  home.render();
  assert.equal(home.find('DailyCompleteSheet')?.state.unlocked, true);
  home.unmount();
});

test('current: a frozen non-reward snapshot closes without showing generic completion', () => {
  const home = mount();
  home.render();
  home.setDay({ settling: true });
  home.handoff('reset:54321');
  home.render();
  assert.equal(home.find('DailyRewardSurface').visible, false);
  assert.equal(home.find('DailyCompleteSheet'), null);
  assert.equal(home.find('FirstWinOfDayPresenter').active, true);
  home.unmount();
});

test('current: ten completion/placement cycles remain repeatable without replaying a seen gift', () => {
  const home = mount();
  for (let day = 1; day <= 10; day += 1) {
    const date = `2026-10-${String(day).padStart(2, '0')}`;
    home.setDay({ date });
    home.render();
    home.setDay({ date, complete: true });
    home.render();
    const gift = home.find('DailyCompleteSheet');
    assert.equal(gift?.state.unlocked, true, date);
    gift.onShow();
    gift.onChoosePiece();
    home.render();
    home.find('DailyRewardFlow').onPlace(`piece-${day}`);
    home.finishReward();
    home.setDay({ date });
    home.render();
    home.setDay({ date, complete: true });
    home.render();
    assert.equal(home.find('DailyCompleteSheet'), null, `seen gift replayed on ${date}`);
  }
  assert.equal(home.placements.length, 10);
  home.unmount();
});
