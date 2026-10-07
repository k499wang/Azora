import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ reducedMotion = false } = {}) {
  const hooks = [];
  const effects = [];
  const canceled = new Set();
  let cursor = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], next => { hooks[i] = next; }]; },
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
    useSharedValue(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = { value: initial }; return hooks[i]; },
    useAnimatedStyle: style => style(),
    cancelAnimation: value => canceled.add(value),
    interpolateColor: () => 'color',
    withTiming: (to, config) => ({ to, config }), withSequence: (...values) => ({ values }), withSpring: to => ({ to }),
    Easing: { out: x => x, cubic: () => {}, linear: () => {} },
  };
  function load(name) {
    const exports = {};
    vm.runInNewContext(ts.transpileModule(readFileSync(new URL(name, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText, {
      exports, React: react,
      require(name) {
        if (name === 'react') return react;
        if (name === 'react-native') return { View: 'View', Pressable: 'Pressable', StyleSheet: { create: x => x, absoluteFillObject: {} } };
        if (name === 'react-native-reanimated') return animation;
        if (name === 'react-native-svg') return { default: 'Svg', Defs: 'Defs', LinearGradient: 'LinearGradient', Path: 'Path', Rect: 'Rect', Stop: 'Stop' };
        if (name.endsWith('/streakCelebrationMotion')) return load('./streakCelebrationMotion.ts');
        if (name.endsWith('/streakFlameArt')) return load('./streakFlameArt.ts');
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
    canceled,
    render(props) { cursor = 0; tree = component(props); effects.splice(0).forEach(effect => effect()); return tree; },
    button: () => findAll(node => node.type === 'ChunkyButton')[0].props,
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

test('entrance runs one clock while active and is cancelled when it leaves', () => {
  const h = setup();
  h.render(props);
  h.render({ ...props, active: false });
  assert.equal(h.canceled.size, 1);
});
