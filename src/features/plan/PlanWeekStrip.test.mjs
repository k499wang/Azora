import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function compile(path) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
}

function setup() {
  const hooks = [];
  const selected = [];
  const scrolls = [];
  let cursor = 0;
  const calendar = {};
  vm.runInNewContext(compile('../../lib/calendar/weekCalendarDays.ts'), { exports: calendar });
  const exports = {};
  vm.runInNewContext(compile('./PlanWeekStrip.tsx'), {
    exports,
    require(name) {
      if (name === 'react') return {
        useState(initial) {
          const index = cursor++;
          if (!(index in hooks)) hooks[index] = initial;
          return [hooks[index], (next) => { hooks[index] = typeof next === 'function' ? next(hooks[index]) : next; }];
        },
        useRef(initial) {
          const index = cursor++;
          if (!(index in hooks)) hooks[index] = { current: initial };
          return hooks[index];
        },
        useCallback: (callback) => callback,
      };
      if (name === 'react/jsx-runtime') return {
        jsx: (type, props, key) => ({ type, props, key }),
        jsxs: (type, props, key) => ({ type, props, key }),
      };
      if (name === 'react-native') return {
        View: 'View', ScrollView: 'ScrollView', Pressable: 'Pressable',
        StyleSheet: { create: (styles) => styles },
      };
      if (name.endsWith('weekCalendarDays')) return calendar;
      if (name.endsWith('/Text')) return { Text: 'Text' };
      if (name.endsWith('/colors')) return { colors: { onBlock: {}, text: {} } };
      if (name.endsWith('/spacing')) return { spacing: {} };
      if (name.endsWith('/typography')) return { fonts: {}, typography: { label: { small: {}, large: {} } } };
      throw new Error(`Unexpected module ${name}`);
    },
  });
  return {
    render(overrides = {}) {
      cursor = 0;
      const tree = exports.default({
        todayLocalDate: '2026-10-02',
        selectedLocalDate: '2026-10-02',
        activity: [{ activityDate: '2026-10-01', qualifiesForStreak: true }],
        onSelectDay: (date) => selected.push(date),
        hue: { ink: '#123456' },
        ...overrides,
      });
      const scroll = find(tree, 'ScrollView')[0];
      if (scroll) scroll.props.ref.current = { scrollToEnd: (options) => scrolls.push(options) };
      return tree;
    },
    selected,
    scrolls,
  };
}

function find(tree, type) {
  if (tree == null || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap((child) => find(child, type));
  return [...(tree.type === type ? [tree] : []), ...find(tree.props?.children, type)];
}

function measure(tree, width) {
  const owner = find(tree, 'View').find((node) => node.props.onLayout);
  assert.ok(owner, 'the outer view measures width before mounting the pager');
  owner.props.onLayout({ nativeEvent: { layout: { width } } });
}

test('first render shows only the seven dates in the current week', () => {
  const harness = setup();
  const tree = harness.render();
  assert.equal(find(tree, 'ScrollView').length, 0);
  const days = find(tree, 'Pressable');
  assert.equal(days.length, 7);
  days.forEach((day) => day.props.onPress());
  assert.deepEqual(harness.selected, [
    '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30',
    '2026-10-01', '2026-10-02', '2026-10-03',
  ]);
  assert.equal(days.filter((day) => day.props.accessibilityState.selected).length, 1);
  assert.equal(days.at(-1).props.disabled, true);
});

test('measurement keeps the current week visible until native paging reaches it', () => {
  const harness = setup();
  measure(harness.render(), 320);
  const tree = harness.render();
  const scroll = find(tree, 'ScrollView')[0];
  assert.ok(scroll);
  assert.equal(find(tree, 'Pressable').length, 63);
  assert.equal(scroll.props.style.opacity, 0);
  assert.equal(scroll.props.pointerEvents, 'none');
  assert.equal(scroll.props.accessibilityElementsHidden, true);
  assert.equal(scroll.props.contentOffset, undefined);
  assert.equal(scroll.props.pagingEnabled, true);
  const pages = scroll.props.children;
  assert.equal(pages.length, 8);
  pages.forEach((page) => assert.ok(page.props.style.some((style) => style?.width === 320)));
  scroll.props.onContentSizeChange(2560);
  scroll.props.onScroll({ nativeEvent: { contentOffset: { x: 320 } } });
  assert.equal(find(harness.render(), 'ScrollView')[0].props.style.opacity, 0);
  scroll.props.onScroll({ nativeEvent: { contentOffset: { x: 2240 } } });
  const positioned = harness.render();
  assert.equal(find(positioned, 'Pressable').length, 56);
  assert.equal(find(positioned, 'ScrollView')[0].props.pointerEvents, 'auto');
  assert.equal(find(positioned, 'ScrollView')[0].props.accessibilityElementsHidden, false);
});

test('a width change keeps today visible until the resized pager is positioned', () => {
  const harness = setup();
  measure(harness.render(), 320);
  let scroll = find(harness.render(), 'ScrollView')[0];
  scroll.props.onContentSizeChange(2560);
  scroll.props.onScroll({ nativeEvent: { contentOffset: { x: 2240 } } });
  measure(harness.render(), 400);
  scroll = find(harness.render(), 'ScrollView')[0];
  assert.equal(scroll.props.style.opacity, 0);
  scroll.props.onContentSizeChange(3200);
  scroll.props.onScroll({ nativeEvent: { contentOffset: { x: 2800 } } });
  assert.equal(find(harness.render(), 'ScrollView')[0].props.pointerEvents, 'auto');
});

test('content-size updates position once and preserve subsequent user swipes', () => {
  const harness = setup();
  measure(harness.render(), 320);
  let scroll = find(harness.render(), 'ScrollView')[0];
  scroll.props.onContentSizeChange(0);
  scroll.props.onContentSizeChange(320);
  assert.equal(harness.scrolls.length, 0);
  scroll.props.onContentSizeChange(2560);
  assert.deepEqual(harness.scrolls.map((options) => ({ ...options })), [{ animated: false }]);
  // A swipe does not change React state; subsequent content layouts must not
  // issue another imperative position change after it.
  for (let update = 0; update < 10; update++) {
    scroll = find(harness.render(), 'ScrollView')[0];
    scroll.props.onContentSizeChange(2560);
    scroll.props.onContentSizeChange(2559.5);
  }
  assert.equal(harness.scrolls.length, 1);
});

test('a date change remounts the pager even when its content width is unchanged', () => {
  const harness = setup();
  measure(harness.render(), 320);
  let scroll = find(harness.render(), 'ScrollView')[0];
  scroll.props.onContentSizeChange(2560);
  scroll.props.onScroll({ nativeEvent: { contentOffset: { x: 2240 } } });
  scroll = find(harness.render({ todayLocalDate: '2026-10-03' }), 'ScrollView')[0];
  assert.equal(scroll.key, '2026-10-03:320');
  assert.equal(scroll.props.style.opacity, 0);
  scroll.props.onContentSizeChange(2560);
  scroll.props.onScroll({ nativeEvent: { contentOffset: { x: 2240 } } });
  assert.equal(find(harness.render({ todayLocalDate: '2026-10-03' }), 'ScrollView')[0].props.pointerEvents, 'auto');
  assert.equal(harness.scrolls.length, 2);
});
