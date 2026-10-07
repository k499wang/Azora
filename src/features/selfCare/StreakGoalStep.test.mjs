import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ reducedMotion = false } = {}) {
  const hooks = [];
  const effects = [];
  const canceled = new Set();
  const values = [];
  const announced = [];
  let cursor = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = typeof initial === 'function' ? initial() : initial; return [hooks[i], next => { hooks[i] = next; }]; },
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
    withTiming: (to, config) => ({ to, config }),
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
        if (name === 'react-native-svg') return { default: 'Svg', Path: 'Path' };
        if (name.endsWith('/streakCelebrationMotion')) return load('./streakCelebrationMotion.ts');
        if (name.endsWith('/routineFirstCompletion')) return load('./domain/routineFirstCompletion.ts');
        if (name.endsWith('/colors')) return load('../../theme/colors.ts');
        if (name.endsWith('/spacing')) return { spacing: {} };
        if (name.endsWith('/typography')) return { fonts: {}, typography: { title: {}, body: {} } };
        if (name.endsWith('/Text')) return { Text: 'Text' };
        if (name.endsWith('/ChunkyButton')) return { default: 'ChunkyButton' };
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
    canceled, values, announced,
    render(props) { cursor = 0; tree = component(props); effects.splice(0).forEach(effect => effect()); return tree; },
    button: () => findAll(node => node.type === 'ChunkyButton')[0].props,
    find: predicate => findAll(predicate)[0],
    rows: () => findAll(node => node.type?.name === 'GoalRow').map(node => node.props),
    unmount() { hooks.forEach(hook => hook?.cleanup?.()); },
  };
}

const props = { streakDays: 1, selectedGoal: null, active: true, onSelect() {}, onCommit() {} };

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

const flipValues = h => { const [, flip, fromPage, toPage] = h.values; return { flip, fromPage, toPage }; };

test('entrance runs one clock while active and is cancelled when it leaves', () => {
  const h = setup();
  h.render(props);
  const [clock] = h.values;
  h.render({ ...props, active: false });
  assert.ok(h.canceled.has(clock));
});

test('a pick flips the page toward the goal and announces its finish line', () => {
  const h = setup();
  h.render(props);
  h.render({ ...props, selectedGoal: 30 });
  const { flip, fromPage, toPage } = flipValues(h);
  assert.equal(fromPage.value, 0);
  assert.equal(toPage.value, 3);
  assert.deepEqual(flip.value.config.duration, 300);
  assert.equal(h.announced.length, 1);
  assert.match(h.announced[0], /^Day 30 lands on (Sun|Mon|Tue|Wed|Thu|Fri|Sat), [A-Z][a-z]{2} \d{1,2}$/);
  assert.equal(h.find(node => node.props?.accessibilityLabel?.startsWith('Day')).props.accessibilityLabel, h.announced[0]);
});

test('a re-pick before the swap keeps flipping the shown page; after it, flips from the new one', () => {
  const h = setup();
  h.render(props);
  h.render({ ...props, selectedGoal: 7 });
  const { flip, fromPage, toPage } = flipValues(h);
  flip.value = 0.2;
  h.render({ ...props, selectedGoal: 50 });
  assert.deepEqual([fromPage.value, toPage.value], [0, 4]);
  assert.ok(Math.abs(flip.value.config.duration - 240) < 1e-9);
  flip.value = 0.7;
  h.render({ ...props, selectedGoal: 14 });
  assert.deepEqual([fromPage.value, toPage.value], [4, 2]);
  assert.equal(flip.value.config.duration, 300);
});

test('reduced motion swaps the page at once', () => {
  const h = setup({ reducedMotion: true });
  h.render(props);
  h.render({ ...props, selectedGoal: 30 });
  const { flip, fromPage, toPage } = flipValues(h);
  assert.deepEqual([fromPage.value, toPage.value, flip.value], [3, 3, 1]);
});

test('a pick changes only colour, opacity and transforms, never layout', () => {
  const animatedOnly = new Set(['opacity', 'transform', 'clock', 'state', 'selected', 'disabled', 'accessibilityLabel', 'accessibilityElementsHidden', 'importantForAccessibility']);
  const layout = tree => JSON.stringify(tree, (key, value) => (typeof value === 'function' || animatedOnly.has(key) ? undefined : value));
  const h = setup();
  const before = layout(h.render(props));
  assert.equal(layout(h.render({ ...props, selectedGoal: 30 })), before);
});
