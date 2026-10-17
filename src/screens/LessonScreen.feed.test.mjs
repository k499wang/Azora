import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('./LessonScreen.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;

function reader(blocks = Array.from({ length: 12 }, (_, index) => ({ kind: 'text', text: `Page ${index}` }))) {
  const slots = [];
  let cursor = 0;
  const scrolls = [];
  const lesson = { id: 'test.lesson', title: 'Test lesson', blocks };
  const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
  const tokens = new Proxy({}, { get: () => tokens });
  const stubs = {
    react: {
      useEffect: () => {},
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = initial;
        return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
      },
      useRef(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = { current: initial };
        return slots[index];
      },
    },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': { ScrollView: 'ScrollView', View: 'View', Pressable: 'Pressable', StyleSheet: { create: (styles) => styles }, useWindowDimensions: () => ({ height: 800 }) },
    'react-native-reanimated': { useReducedMotion: () => false },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    '../stores/authStore': { useAuthStore: (select) => select({ user: null }) },
    '../hooks/useTodayLocalDate': { useTodayLocalDate: () => '2026-10-16' },
    '../hooks/useTodayProgramDay': { useTodayProgramDay: () => ({ day: null }) },
    '../features/lessons/domain/lessonCatalogue': { lessonById: () => lesson },
    '../features/lessons/domain/lessonPages': { lessonPages: (blocks) => blocks },
    '../features/lessons/LessonBlockView': { default: 'LessonBlockView', FeedEntrance: 'FeedEntrance', isLessonActivity: () => false },
    '../features/room/useRoomClaim': { useRoomClaim: () => ({ dailies: { units: [] } }) },
    '../features/selfCare/useFirstWinOfDay': { useFirstWinOfDay: () => ({}) },
    '../queries/lessons/useRecordLessonReadMutation': { useRecordLessonReadMutation: () => ({}) },
    '../app/navigation/useCloseOntoHome': { useCloseOntoHome: () => () => {} },
    '../app/navigation/useAfterScreenClosed': { useAfterScreenClosed: () => {} },
    '../native/tapHaptics': { triggerSoftHaptic: () => {} },
    '../theme/spacing': { spacing: { lg: 24 }, padding: { screen: { horizontal: 24 } } },
  };
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, __DEV__: true,
    require: (name) => stubs[name] ?? new Proxy({ __esModule: true, default: name }, { get: (target, key) => key in target ? target[key] : tokens }),
  });
  const render = () => {
    cursor = 0;
    const tree = module.exports.default({ navigation: {}, route: { params: { previewLessonId: lesson.id } } });
    const find = (node, predicate) => {
      if (!node || typeof node !== 'object') return undefined;
      if (predicate(node)) return node;
      return [node.props?.children].flat(Infinity).map((child) => find(child, predicate)).find(Boolean);
    };
    const feed = find(tree, (node) => node.type === 'ScrollView');
    if (!feed) return { intro: tree };
    feed.props.ref.current = { scrollToEnd: (options) => scrolls.push(options) };
    return {
      feed,
      next: find(tree, (node) => node.props.label === 'Continue'),
      rows: (() => {
        const body = feed.props.children.props.children;
        return body.props.children[1];
      })(),
    };
  };
  return { render, scrolls };
}

const scroll = (feed, y) => feed.props.onScroll({ nativeEvent: {
  contentOffset: { y }, contentSize: { height: 2000 }, layoutMeasurement: { height: 600 },
} });

test('opening a lesson shows its introduction before revealing lesson content', () => {
  const harness = reader();
  const screen = harness.render();
  assert.equal(screen.feed, undefined);
  assert.equal(screen.intro.props.lesson.title, 'Test lesson');
  assert.equal(screen.intro.props.coins, 0, 'lab previews must not promise rewards');
  screen.intro.props.onStart();
  const started = harness.render();
  assert.ok(started.feed);
  assert.equal(started.rows.length, 0);
  assert.ok(started.next);
});

test('ten Continue and look-back cycles retain earlier rows and leave the reader in control', () => {
  const harness = reader();
  let screen = harness.render();
  screen.intro.props.onStart();
  screen = harness.render();
  assert.equal(screen.feed.props.removeClippedSubviews, false);
  for (let index = 0; index < 10; index++) {
    scroll(screen.feed, 0);
    const count = harness.scrolls.length;
    screen.feed.props.onContentSizeChange(400, 2000);
    assert.equal(harness.scrolls.length, count, 'layout must not pull a reader away from earlier text');
    screen.next.props.onPress();
    screen = harness.render();
    assert.equal(screen.rows.length, index + 1);
    assert.deepEqual(screen.rows.map((row) => row.props.children.props.block.text), Array.from({ length: index + 1 }, (_, page) => `Page ${page}`));
    assert.deepEqual(screen.rows.map((row) => row.key), Array.from({ length: index + 1 }, (_, page) => page));
    screen.feed.props.onContentSizeChange(400, 2000);
    assert.equal(harness.scrolls.length, count + 1, 'Continue resumes following the new page');
  }
  scroll(screen.feed, 1400);
  const count = harness.scrolls.length;
  screen.feed.props.onContentSizeChange(400, 2100);
  assert.equal(harness.scrolls.length, count + 1, 'feedback can follow when the reader is at the bottom');
});

test('a previous answer remains selected after more pages are revealed', () => {
  const harness = reader([
    { kind: 'choice', prompt: 'Choose a next step', options: [{ label: 'One step', feedback: 'Start here.' }] },
    { kind: 'text', text: 'Another page' },
    { kind: 'text', text: 'A later page' },
  ]);
  let screen = harness.render();
  screen.intro.props.onStart();
  screen = harness.render();
  screen.next.props.onPress();
  screen = harness.render();
  screen.rows[0].props.children.props.onSelectOption(0);
  screen = harness.render();
  screen.next.props.onPress();
  screen = harness.render();
  assert.equal(screen.rows[0].props.children.props.selectedOption, 0);
  assert.equal(screen.rows[1].props.children.props.block.text, 'Another page');
});

test('entrance text stays visible even before its animation completes and cleans up its work', () => {
  const source = readFileSync(new URL('../features/lessons/LessonBlockView.tsx', import.meta.url), 'utf8');
  const component = source.slice(source.indexOf('export function FeedEntrance('), source.indexOf('\ninterface FeedbackLineProps'));
  const code = ts.transpileModule(component, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  for (const reducedMotion of [false, true]) {
    const effects = [];
    const progress = { value: reducedMotion ? 1 : 0 };
    const cancelled = [];
    const module = { exports: {} };
    vm.runInNewContext(code, {
      module, exports: module.exports,
      require: () => ({ jsx: (type, props) => ({ type, props }) }),
      Animated: { View: 'Animated.View' },
      useReducedMotion: () => reducedMotion,
      useSharedValue: () => progress,
      useEffect: (effect) => effects.push(effect),
      useAnimatedStyle: (getStyle) => getStyle(),
      // A stalled animation must not leave text invisible.
      withTiming: () => 0,
      cancelAnimation: (value) => cancelled.push(value),
      ENTRANCE_MS: 200, ENTRANCE_RISE: 10, easing: { enter: null },
    });
    const row = module.exports.FeedEntrance({ children: 'Earlier text' });
    assert.equal(row.props.style[1].opacity, undefined);
    const cleanup = effects[0]();
    if (reducedMotion) {
      assert.equal(progress.value, 1);
    } else {
      cleanup();
      assert.equal(cancelled[0], progress);
    }
  }
});
