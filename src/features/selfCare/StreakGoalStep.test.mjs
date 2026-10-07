import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { formatStreakGoalFinish, streakGoalFinishDate } from './domain/routineFirstCompletion.ts';

function setup({ reducedMotion = false } = {}) {
  const hooks = [];
  const effects = [];
  const canceled = new Set();
  const values = [];
  const announced = [];
  const timers = new Set();
  const timingCalls = [];
  let successes = 0;
  let cursor = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = typeof initial === 'function' ? initial() : initial; return [hooks[i], next => { hooks[i] = next; }]; },
    useRef(initial) { const i = cursor++; return hooks[i] ??= { current: initial }; },
    useMemo(factory, deps) {
      const i = cursor++;
      if (!hooks[i]?.deps?.every((v, index) => v === deps[index])) hooks[i] = { deps, value: factory() };
      return hooks[i].value;
    },
    useEffect(callback, deps) {
      const i = cursor++;
      if (hooks[i]?.deps?.every((v, index) => v === deps[index])) return;
      hooks[i]?.cleanup?.();
      hooks[i] = { deps };
      effects.push(() => { hooks[i].cleanup = callback(); });
    },
  };
  const animation = {
    default: { View: 'AnimatedView', Text: 'AnimatedText' },
    useReducedMotion: () => reducedMotion,
    useSharedValue(initial) { const i = cursor++; if (!(i in hooks)) { hooks[i] = { value: initial }; values.push(hooks[i]); } return hooks[i]; },
    useAnimatedStyle: style => style(),
    cancelAnimation: value => canceled.add(value),
    interpolateColor: () => 'color',
    withTiming: (to, config) => { timingCalls.push({ to, config }); return { to, config }; }, withDelay: (delay, value) => ({ delay, value }),
    Easing: { out: x => x, cubic: () => {}, linear: () => {} },
  };
  function load(name) {
    const exports = {};
    vm.runInNewContext(ts.transpileModule(readFileSync(new URL(name, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText, {
      exports, React: react,
      require(name) {
        if (name === 'react') return react;
        if (name === 'react-native') return { View: 'View', Pressable: 'Pressable', StyleSheet: { create: x => x, absoluteFillObject: {} }, AccessibilityInfo: { announceForAccessibility: text => announced.push(text) } };
        if (name === 'react-native-reanimated') return animation;
        if (name === 'react-native-svg') return { default: 'Svg', Defs: 'Defs', LinearGradient: 'LinearGradient', Path: 'Path', Stop: 'Stop' };
        if (name.endsWith('/streakCelebrationMotion')) return load('./streakCelebrationMotion.ts');
        if (name.endsWith('/routineFirstCompletion')) return load('./domain/routineFirstCompletion.ts');
        if (name.endsWith('/colors')) return load('../../theme/colors.ts');
        if (name.endsWith('/spacing')) return { spacing: {} };
        if (name.endsWith('/typography')) return { fonts: {}, typography: { title: {}, body: {} } };
        if (name.endsWith('/Text')) return { Text: 'Text' };
        if (name.endsWith('/ChunkyButton')) return { default: 'ChunkyButton' };
        if (name.endsWith('/streakFlameArt')) return load('./streakFlameArt.ts');
        if (name.endsWith('/uiThreadTimer')) return { startUiTimer(ms, callback) { const timer = { ms, callback }; timers.add(timer); return () => timers.delete(timer); } };
        if (name.endsWith('/tapHaptics')) return { triggerSuccessHaptic() { successes++; } };
        throw new Error(`Unexpected dependency: ${name}`);
      },
    });
    return exports;
  }
  const component = load('./StreakGoalStep.tsx').default;
  let tree;
  const findAll = predicate => {
    const found = [];
    const visit = node => {
      if (!node || typeof node !== 'object') return;
      if (predicate(node)) found.push(node);
      [node.children ?? []].flat(Infinity).forEach(visit);
    };
    visit(tree);
    return found;
  };
  return {
    canceled, values, announced, timers, timingCalls,
    get successes() { return successes; },
    render(props) { cursor = 0; tree = component(props); effects.splice(0).forEach(effect => effect()); return tree; },
    calendar: () => findAll(node => node.type?.name === 'CalendarPageFace')[0].props.page,
    styles: () => findAll(node => node.props?.style).map(node => node.props.style),
    button: () => findAll(node => node.type === 'ChunkyButton')[0].props,
    find: predicate => findAll(predicate)[0],
    rows: () => findAll(node => node.type?.name === 'GoalRow').map(node => node.props),
    unmount() { hooks.forEach(hook => hook?.cleanup?.()); },
  };
}

const props = { streakDays: 1, selectedGoal: null, active: true, onSelect() {}, onCommit() {}, committing: false, onCommitFinished() {} };

test('commit stays disabled until a goal is picked, and nothing is preselected', () => {
  const h = setup();
  h.render(props);
  assert.equal(h.button().disabled, true);
  assert.ok(h.rows().every(row => !row.selected));
  h.render({ ...props, selectedGoal: 14 });
  assert.equal(h.button().disabled, false);
  assert.deepEqual(h.rows().map(row => row.selected), [false, true, false, false]);
});

test('picking a row reports its days, and commit reports through onCommit', () => {
  const h = setup();
  const picks = [];
  let commits = 0;
  h.render({ ...props, onSelect: days => picks.push(days), onCommit: () => commits++ });
  h.rows().forEach(row => row.onPress());
  assert.deepEqual(picks, [7, 14, 30, 50]);
  h.button().onPress();
  assert.equal(commits, 1);
});

test('rapid goal choices update the date and caption immediately without calendar animation', () => {
  for (const reducedMotion of [false, true]) {
    const h = setup({ reducedMotion });
    h.render(props);
    assert.equal(h.calendar().day, '?');
    const initialTimingCalls = h.timingCalls.length;
    for (const goal of [30, 7, 50, 14, 30, 7, 50, 14, 30, 7]) {
      h.render({ ...props, selectedGoal: goal });
      const finish = formatStreakGoalFinish(streakGoalFinishDate(new Date(), props.streakDays, goal));
      const page = h.calendar();
      assert.equal(page.goal, goal);
      assert.equal(page.month, finish.month);
      assert.equal(page.day, finish.day);
      const caption = `Day ${goal} lands on ${finish.label}`;
      assert.equal(h.find(node => node.props?.accessible).props.accessibilityLabel, caption);
      assert.equal(h.announced.at(-1), caption);
      assert.equal(h.timingCalls.length, initialTimingCalls);
    }
  }
});

test('commit keeps the latest selected date for the stamp', () => {
  const h = setup();
  h.render(props);
  h.render({ ...props, selectedGoal: 7 });
  h.render({ ...props, selectedGoal: 50 });
  const chosenDate = h.calendar().finish;
  h.render({ ...props, selectedGoal: 50, committing: true });
  assert.equal(h.calendar().goal, 50);
  assert.equal(h.calendar().finish, chosenDate);
  assert.equal(h.find(node => node.props?.accessible).props.accessibilityLabel, `Committed! See you on ${chosenDate}`);
  assert.equal(h.successes, 1);
});

test('entrance runs one clock while active and is cancelled when it leaves', () => {
  const h = setup();
  h.render(props);
  const [clock] = h.values;
  h.render({ ...props, active: false });
  assert.ok(h.canceled.has(clock));
});

test('the 3x promise sits under the title from the start and never changes on pick', () => {
  const h = setup();
  const text = tree => JSON.stringify(tree).includes('as likely to stick with your routine!');
  assert.ok(text(h.render(props)));
  assert.ok(text(h.render({ ...props, selectedGoal: 14 })));
});

test('date choices preserve calendar and caption layout', () => {
  const h = setup();
  const layout = () => JSON.stringify(h.styles(), (key, value) => key === 'opacity' || key === 'transform' ? undefined : value);
  h.render({ ...props, selectedGoal: 7 });
  const before = layout();
  h.render({ ...props, selectedGoal: 30 });
  assert.equal(layout(), before);
});

test('committing stamps the calendar and hands back only when the reaction ends', () => {
  const h = setup();
  let finished = 0;
  const picked = { ...props, selectedGoal: 30, onCommitFinished: () => finished++ };
  h.render(picked);
  h.render({ ...picked, committing: true });
  assert.equal(h.successes, 1);
  assert.match(h.announced.at(-1), /^Goal set\. See you on (Sun|Mon|Tue|Wed|Thu|Fri|Sat), [A-Z][a-z]{2} \d{1,2}$/);
  assert.deepEqual([...h.timers].map(timer => timer.ms), [2000]);
  assert.equal(finished, 0);
  [...h.timers][0].callback();
  assert.equal(finished, 1);
  assert.equal(h.find(node => node.props?.pointerEvents === 'none' && node.props?.accessibilityRole === 'radiogroup') != null, true);
});

test('reduced motion swaps the caption and hands back at 700ms without movement', () => {
  const h = setup({ reducedMotion: true });
  const picked = { ...props, selectedGoal: 7 };
  h.render(picked);
  h.render({ ...picked, committing: true });
  assert.deepEqual([...h.timers].map(timer => timer.ms), [700]);
  assert.equal(h.successes, 1);
  const commit = h.values[1];
  assert.equal(commit.value, 0);
  assert.equal(h.values[2].value, 1);
});

test('leaving or unmounting mid-reaction cancels the hand-back', () => {
  const h = setup();
  const picked = { ...props, selectedGoal: 14, committing: true };
  h.render({ ...picked, committing: false });
  h.render(picked);
  assert.equal(h.timers.size, 1);
  h.render({ ...picked, active: false });
  assert.equal(h.timers.size, 0);
  h.render(picked);
  assert.equal(h.timers.size, 1);
  h.unmount();
  assert.equal(h.timers.size, 0);
});
