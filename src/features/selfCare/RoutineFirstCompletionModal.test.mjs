import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { shouldOfferStreakGoal } from './domain/routineFirstCompletion.ts';

const compiled = ts.transpileModule(readFileSync(new URL('./RoutineFirstCompletionModal.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount({ reducedMotion = false, streakDays = 3 } = {}) {
  const slots = [], animations = [], listeners = new Set();
  let cursor = 0, dirty = false, effects = [], tree, continued = 0;
  const commits = [];
  let taps = 0;
  const props = { visible: true, streakDays, completedDaysAgo: [0],
    onIgnite() {}, onContinue() { continued++; props.visible = false; },
    onCommitStreakGoal(days) { commits.push(days); } };
  class Value {
    constructor(value) { this.value = value; this.stops = 0; }
    setValue(value) { this.value = value; }
    interpolate(config) { return { value: this, config }; }
    stopAnimation() { this.stops++; animations.filter(a => a.value === this).forEach(a => { a.cancelled = true; }); }
  }
  const react = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { if (slots[index] !== value) { slots[index] = value; dirty = true; } }]; },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    useEffect(effect, deps) { const index = cursor++, previous = slots[index];
      if (previous && deps.every((dep, i) => dep === previous.deps[i])) return;
      const next = { deps }; slots[index] = next;
      effects.push(() => { previous?.cleanup?.(); next.cleanup = effect(); }); },
  };
  const jsx = (type, props) => ({ type, props });
  const ease = x => x;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
    if (name === 'react-native') return {
      Animated: { Value, View: 'AnimatedView', timing(value, config) { return { start(callback) { animations.push({ value, config, callback }); } }; } },
      AppState: { currentState: 'active', addEventListener(_, listener) { listeners.add(listener); return { remove() { listeners.delete(listener); } }; } },
      Easing: { out: ease, in: ease, inOut: ease, cubic: ease }, Modal: 'Modal', View: 'View',
      StyleSheet: { create: x => x },
    };
    if (name === 'react-native-reanimated') return { useReducedMotion: () => reducedMotion };
    if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 44, bottom: 34 }) };
    if (name === 'expo-status-bar') return { StatusBar: 'StatusBar' };
    if (name === './StreakExtendStep') return { default: 'StreakExtendStep' };
    if (name === './StreakGoalStep') return { default: 'StreakGoalStep' };
    if (name.endsWith('/routineFirstCompletion')) return { shouldOfferStreakGoal };
    if (name.endsWith('/tapHaptics')) return { triggerTapHaptic() { taps++; } };
    if (name.endsWith('/colors')) return { colors: { background: {}, text: {}, orange: {}, border: {}, streakCelebration: { night: 'night' } } };
    if (name.endsWith('/spacing')) return { spacing: { lg: 24, xl: 32 } };
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  const find = type => {
    function visit(node) { if (!node || typeof node !== 'object') return; if (node.type === type) return node;
      for (const child of [node.props?.children].flat(Infinity)) { const found = visit(child); if (found) return found; } }
    return visit(tree);
  };
  function render(patch = {}) { Object.assign(props, patch); let passes = 0;
    do { dirty = false; cursor = 0; effects = []; tree = exports.default(props); effects.forEach(run => run());
      assert.ok(++passes < 20, 'render effects settle'); } while (dirty);
    return tree;
  }
  render();
  return { render, find, animations, commits, get continued() { return continued; }, get taps() { return taps; },
    background(state) { listeners.forEach(listener => listener(state)); render(); },
    finishExit() { const exit = animations.findLast(a => a.config.toValue === 0 && !a.cancelled); assert.ok(exit); exit.callback?.({ finished: true }); render(); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); }, get listeners() { return listeners.size; } };
}

test('fullscreen entrance is one root opacity over the night stage, with no delayed bloom', () => {
  const modal = mount();
  const root = modal.find('Modal').props.children;
  assert.equal(root.props.style[0].flex, 1);
  assert.equal(root.props.style[0].backgroundColor, 'night');
  assert.equal(root.props.style[1].transform, undefined);
  assert.equal(modal.animations.length, 1);
  assert.equal(modal.animations[0].config.useNativeDriver, true);
});

test('background and hiding deactivate the child without reporting Continue', () => {
  const modal = mount();
  modal.background('background');
  assert.equal(modal.find('StreakExtendStep').props.active, false);
  modal.background('active');
  assert.equal(modal.find('StreakExtendStep').props.active, true);
  modal.render({ visible: false });
  assert.equal(modal.find('StreakExtendStep').props.active, false);
  modal.finishExit();
  assert.equal(modal.find('Modal').props.visible, false);
  assert.equal(modal.continued, 0);
});

test('ten open/close cycles each report Continue once and release owned work', () => {
  const modal = mount();
  for (let cycle = 0; cycle < 10; cycle++) {
    modal.render({ visible: true });
    assert.equal(modal.find('StreakExtendStep').props.active, true);
    modal.find('StreakExtendStep').props.onContinue();
    modal.find('Modal').props.onRequestClose();
    modal.render();
    assert.equal(modal.find('StreakExtendStep').props.active, false);
    modal.find('Modal').props.onRequestClose();
    modal.finishExit();
    assert.equal(modal.continued, cycle + 1);
    assert.equal(modal.find('Modal').props.visible, false);
  }
  modal.unmount();
  assert.equal(modal.listeners, 0);
  assert.ok(modal.animations.every(a => a.cancelled));
});

test('day one moves to the goal step with nothing picked, and commits only a picked goal once', () => {
  const modal = mount({ streakDays: 1 });
  assert.equal(modal.find('StreakGoalStep').props.active, false);
  modal.find('StreakExtendStep').props.onContinue();
  modal.render();
  assert.equal(modal.find('StreakExtendStep').props.active, false);
  const goal = modal.find('StreakGoalStep').props;
  assert.equal(goal.active, true);
  assert.equal(goal.selectedGoal, null);
  goal.onCommit();
  assert.deepEqual(modal.commits, []);
  goal.onSelect(30);
  assert.equal(modal.taps, 1);
  modal.render();
  assert.equal(modal.find('StreakGoalStep').props.selectedGoal, 30);
  modal.find('StreakGoalStep').props.onCommit();
  modal.find('StreakGoalStep').props.onCommit();
  modal.render();
  modal.find('StreakGoalStep').props.onCommit();
  assert.deepEqual(modal.commits, [30]);
  assert.equal(modal.continued, 0);
  modal.finishExit();
  assert.equal(modal.continued, 1);
  modal.render({ visible: true });
  assert.equal(modal.find('StreakExtendStep').props.active, true);
  assert.equal(modal.find('StreakGoalStep').props.selectedGoal, null);
});

test('the modal no longer takes a previous streak goal', () => {
  const source = readFileSync(new URL('./RoutineFirstCompletionModal.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\bstreakGoal\b/);
});

test('reduced motion skips the entrance/exit duration', () => {
  const modal = mount({ reducedMotion: true });
  assert.equal(modal.animations[0].config.duration, 0);
  modal.find('StreakExtendStep').props.onContinue();
  modal.render();
  assert.equal(modal.animations.at(-1).config.duration, 0);
  modal.finishExit();
  assert.equal(modal.continued, 1);
});
