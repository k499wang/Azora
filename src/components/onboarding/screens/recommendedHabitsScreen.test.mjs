import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(new URL('./RecommendedHabitsScreen.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;

function mount({ itemCount = 3, deferDecisions = false, reducedMotion = false } = {}) {
  const hooks = [], effects = [], commits = [], haptics = [], announcements = [], pendingDecisions = [], animations = [], sharedValues = [];
  let cursor = 0, backs = 0;
  const sameDeps = (a, b) => a?.length === b?.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useRef(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], next => { hooks[index] = typeof next === 'function' ? next(hooks[index]) : next; }];
    },
    useMemo(callback, deps) {
      const index = cursor++;
      if (!sameDeps(hooks[index]?.deps, deps)) hooks[index] = { deps, value: callback() };
      return hooks[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(callback, deps) {
      const index = cursor++, previous = hooks[index];
      if (sameDeps(previous?.deps, deps)) return;
      const record = { deps };
      hooks[index] = record;
      effects.push(() => { previous?.cleanup?.(); record.cleanup = callback(); });
    },
  };
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'View', StyleSheet: { create: value => value }, AccessibilityInfo: {
      announceForAccessibility: text => announcements.push(text),
    } },
    'react-native-reanimated': {
      default: { View: 'AnimatedView' },
      runOnJS: callback => callback,
      useReducedMotion: () => reducedMotion,
      useAnimatedStyle: callback => new Proxy({}, { get: (_, key) => callback()[key] }),
      useSharedValue(initial) {
        return react.useMemo(() => {
          const shared = {
            current: initial, pending: null,
            get value() { return this.current; },
            set value(next) {
              if (next?.kind) {
                this.pending = next;
                animations.push({ shared: this, from: this.current, ...next });
              } else { this.current = next; this.pending = null; }
            },
          };
          sharedValues.push(shared);
          return shared;
        }, []);
      },
      cancelAnimation(shared) { shared.pending = null; },
      withTiming: (to, config, callback) => ({ kind: 'timing', to, config, callback }),
      withSpring: (to, config, callback) => ({ kind: 'spring', to, config, callback }),
    },
    'react-native-gesture-handler': { GestureDetector: 'GestureDetector', Gesture: { Pan() {
      const handlers = {};
      const builder = new Proxy({ handlers }, { get: (target, key) => key in target ? target[key] : value => {
        handlers[key] = value;
        return builder;
      } });
      return builder;
    } } },
    '../../common/ChunkyButton': { default: 'ChunkyButton', CHUNKY_TONE_SOFT: {} },
    '../../common/Text': { Text: 'Text' }, '../../common/icons/Icon': { default: 'Icon' },
    '../../../theme/card': { card: { paper: {} }, radius: { card: 24 } },
    '../../../theme/colors': { colors: { text: {}, primary: { blue100: 'blue' } } },
    '../../../theme/spacing': { spacing: { sm: 8, md: 16, lg: 24, xl: 32 } },
    '../../../theme/typography': { fonts: {}, typography: { title: { title2: {} }, body: { large: {} }, label: { detail: {} } } },
    '../../../native/tapHaptics': { triggerMediumHaptic: () => haptics.push('medium') },
    '../../../theme/motion': { duration: { fast: 180, base: 260 }, easing: {}, spring: { settle: { damping: 18 } } },
    '../../../lib/onboardingHabitSwipe': { habitSwipeDecision: x => Math.abs(x) > 100 ? x > 0 ? 'accepted' : 'rejected' : null },
    '../OnboardingOptionIcon': { default: 'OptionIcon' }, '../OnboardingPrimaryButton': { default: 'PrimaryButton' },
    '../OnboardingScreenLayout': { default: 'ScreenLayout' },
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require(name) {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  const props = {
    items: Array.from({ length: itemCount }, (_, i) => ({ id: `habit-${i}`, title: `Habit ${i}`, icon: 'star' })),
    decisions: {}, stepIndex: 1, stepCount: 3,
    onDecide(id, decision) {
      commits.push([id, decision]);
      if (deferDecisions) pendingDecisions.push([id, decision]);
      else props.decisions = { ...props.decisions, [id]: decision };
    },
    onRestart() { props.decisions = {}; }, onContinue() {}, onBack() { backs++; },
  };
  const render = (patch = {}) => {
    Object.assign(props, patch);
    cursor = 0;
    const tree = exports.default(props);
    effects.splice(0).forEach(run => run());
    return tree;
  };
  const nodes = (tree, predicate) => {
    if (!tree || typeof tree !== 'object') return [];
    if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate));
    return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate), ...nodes(tree.props?.footer, predicate)];
  };
  const button = (tree, label) => nodes(tree, node => node.props?.label === label)[0];
  const cards = tree => nodes(tree, node => typeof node.type === 'function');
  const deck = tree => nodes(tree, node => node.props?.index === itemCount)[0];
  function complete(shared) {
    const pending = shared.pending;
    assert.ok(pending, 'expected a pending animation');
    shared.pending = null;
    shared.current = pending.to;
    pending.callback?.(true);
  }
  return {
    render, nodes, button, cards, deck, complete, commits, haptics, animations, sharedValues,
    get backs() { return backs; },
    applyDecisions() { pendingDecisions.splice(0).forEach(([id, decision]) => { props.decisions = { ...props.decisions, [id]: decision }; }); },
    child(node) { return node.type(node.props); },
    unmount() { hooks.forEach(hook => hook?.cleanup?.()); },
    refresh() { render(); return render(); },
  };
}

test('10 choice/edit cycles preserve swipe exits and commit each choice once without celebration', () => {
  const h = mount();
  for (let cycle = 0; cycle < 10; cycle++) {
    for (let index = 0; index < 3; index++) {
      const tree = h.render();
      assert.equal(tree.props.animateEntrance, undefined);
      const button = h.button(tree, 'Build this habit');
      assert.equal(button.props.haptic, 'none');
      button.props.onPress();
      button.props.onPress();
      assert.equal(h.commits.length, cycle * 3 + index, 'commit waits for the exit');
      const values = h.deck(h.render()).props;
      assert.equal(values.deckPosition.pending.kind, 'timing');
      const exitCallback = values.deckPosition.pending.callback;
      h.complete(values.dragX);
      h.complete(values.deckPosition);
      exitCallback(true);
      assert.equal(h.commits.length, cycle * 3 + index + 1);
      assert.equal(h.button(h.refresh(), index === 2 ? 'Continue' : 'Build this habit').props.disabled, false);
    }
    const review = h.deck(h.render()).props.children;
    assert.equal(review.props.keptCount, 3);
    h.button(h.child(review), 'Edit choices').props.onPress();
    const fadeOut = h.animations.at(-1).shared;
    h.complete(fadeOut);
    h.render();
    h.complete(fadeOut);
    const next = h.refresh();
    assert.equal(h.button(next, 'Build this habit').props.disabled, false);
    assert.equal(h.deck(next).props.deckPosition.value, 0);
  }
  assert.equal(h.haptics.length, 30);
  assert.ok(h.haptics.every(kind => kind === 'medium'));
  assert.ok(h.animations.every(animation => animation.kind === 'timing'), 'acceptance never creates a celebration spring');
});

test('all review outcomes reserve space before swiping and cards keep one height through choices and restarts', () => {
  const h = mount();
  const initial = h.render();
  const measurementGroup = h.nodes(initial, node => node.type === 'View' && node.props?.style?.[1]?.opacity === 0)[0];
  assert.equal(measurementGroup.props.pointerEvents, 'none');
  assert.equal(measurementGroup.props.accessibilityElementsHidden, true);
  assert.equal(measurementGroup.props.importantForAccessibility, 'no-hide-descendants');
  const measurements = h.nodes(measurementGroup, node => typeof node.props?.onLayout === 'function');
  assert.deepEqual(Array.from(measurements, node => node.props.children.props.keptCount), [0, 1, 2, 3]);
  measurements.forEach((node, count) => {
    const card = h.child(node.props.children);
    assert.equal(card.props.style[1].minHeight, 300, 'measurement cards retain intrinsic sizing');
    node.props.onLayout({ nativeEvent: { layout: { height: [350, 380, 420, 390][count] } } });
  });
  // A longer habit or larger text can determine the common height instead.
  h.nodes(initial, node => node.props?.index === 0)[0].props.onLayout({ nativeEvent: { layout: { height: 460 } } });

  const assertHeight = tree => {
    const stack = h.nodes(tree, node => node.type === 'GestureDetector')[0].props.children;
    assert.equal(stack.props.style[1].minHeight, 460);
    const cards = h.nodes(tree, node => typeof node.props?.index === 'number');
    assert.equal(cards.length, 4);
    cards.forEach(node => {
      const surface = h.child(node.props.children);
      assert.equal(surface.props.style[1].minHeight, 460);
      assert.equal(surface.props.style[1].height, undefined, 'content remains free to grow without clipping');
      node.props.onLayout({ nativeEvent: { layout: { height: 460 } } });
    });
  };

  for (const choices of [
    ['rejected', 'rejected', 'rejected'],
    ['accepted', 'rejected', 'rejected'],
    ['accepted', 'accepted', 'accepted'],
  ]) {
    for (const decision of choices) {
      const tree = h.refresh();
      assertHeight(tree);
      h.button(tree, decision === 'accepted' ? 'Build this habit' : 'Remove this habit').props.onPress();
      const values = h.deck(h.render()).props;
      h.complete(values.dragX);
      h.complete(values.deckPosition);
    }
    const complete = h.refresh();
    assertHeight(complete);
    h.button(h.child(h.deck(complete).props.children), 'Edit choices').props.onPress();
    const fade = h.animations.at(-1).shared;
    h.complete(fade);
    h.render();
    h.complete(fade);
    assertHeight(h.refresh());
  }
});

test('finger drag moves and rotates the card; a short swipe returns with the original settle spring', () => {
  const h = mount();
  const tree = h.render();
  const gesture = h.nodes(tree, node => node.type === 'GestureDetector')[0].props.gesture;
  const front = h.nodes(tree, node => node.props?.index === 0)[0];
  gesture.handlers.onUpdate({ translationX: 40 });
  assert.equal(front.props.dragX.value, 40);
  const style = h.child(front).props.style[1];
  assert.equal(style.transform[0].translateX, 40);
  assert.equal(style.transform[3].rotate, `${40 / 24}deg`);
  gesture.handlers.onEnd({ translationX: 40, velocityX: 0 });
  assert.equal(front.props.dragX.pending.kind, 'spring');
  assert.equal(front.props.dragX.pending.config.damping, 18);
  h.complete(front.props.dragX);
  assert.equal(style.transform[0].translateX, 0);
  assert.equal(h.commits.length, 0);
});

test('button/swipe choices use the same exit and final review motion with accurate counts', () => {
  for (const decision of ['accepted', 'rejected']) {
    for (const input of ['swipe', 'button']) {
      const h = mount({ itemCount: 1 });
      const tree = h.render();
      const final = h.deck(tree);
      const first = h.nodes(tree, node => node.props?.index === 0)[0];
      assert.equal(final.type, first.type, 'review uses the same animated DeckCard');
      assert.equal(h.child(final).props.style[1].transform[1].translateY, 12);
      if (input === 'swipe') {
        const gesture = h.nodes(tree, node => node.type === 'GestureDetector')[0].props.gesture;
        gesture.handlers.onEnd({ translationX: decision === 'accepted' ? 180 : -180, velocityX: 0 });
      } else {
        h.button(tree, decision === 'accepted' ? 'Build this habit' : 'Remove this habit').props.onPress();
      }
      assert.deepEqual(h.haptics, ['medium']);
      assert.equal(h.commits.length, 0);
      h.complete(final.props.dragX);
      h.complete(final.props.deckPosition);
      const next = h.refresh();
      assert.deepEqual(h.commits, [['habit-0', decision]]);
      const review = h.deck(next);
      assert.equal(h.child(review).props.style[1].transform[1].translateY, 0);
      assert.equal(review.props.children.props.keptCount, decision === 'accepted' ? 1 : 0);
      const copy = h.nodes(h.child(review.props.children), n => n.type === 'Text').map(n => n.props.children).join(' ');
      assert.match(copy, decision === 'accepted' ? /Your routine is taking shape!/ : /No habits added yet/);
    }
  }
});

test('Back queues once until exit and canonical choices finish, while duplicate taps stay locked', () => {
  const h = mount({ itemCount: 1, deferDecisions: true });
  const tree = h.render();
  h.button(tree, 'Build this habit').props.onPress();
  tree.props.onBack();
  tree.props.onBack();
  const values = h.deck(h.render()).props;
  h.complete(values.dragX);
  h.complete(values.deckPosition);
  const pending = h.render();
  h.button(pending, 'Remove this habit').props.onPress();
  assert.equal(h.button(pending, 'Build this habit').props.disabled, true);
  assert.equal(h.commits.length, 1);
  assert.equal(h.backs, 0);
  h.applyDecisions();
  h.refresh().props.onBack();
  assert.equal(h.backs, 1);
});

test('unmount cancels owned animations and queued callbacks; reduced motion skips swipe return spring', () => {
  const h = mount({ itemCount: 1 });
  h.button(h.render(), 'Build this habit').props.onPress();
  const values = h.deck(h.render()).props;
  const callback = values.deckPosition.pending.callback;
  callback(false);
  assert.equal(h.commits.length, 0);
  h.unmount();
  callback(true);
  assert.ok(h.sharedValues.every(shared => shared.pending === null));
  assert.equal(h.commits.length, 0);
  const quiet = mount({ itemCount: 1, reducedMotion: true });
  const tree = quiet.render();
  const gesture = quiet.nodes(tree, node => node.type === 'GestureDetector')[0].props.gesture;
  gesture.handlers.onEnd({ translationX: 40, velocityX: 0 });
  assert.equal(quiet.animations.length, 0);
  quiet.button(tree, 'Build this habit').props.onPress();
  assert.ok(quiet.animations.every(animation => animation.kind === 'timing' && animation.config.duration === 0));
});
