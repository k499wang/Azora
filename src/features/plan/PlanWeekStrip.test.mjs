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
        useMemo: (factory) => factory(),
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
      return exports.default({
        todayLocalDate: '2026-10-02',
        selectedLocalDate: '2026-10-02',
        activity: [{ activityDate: '2026-10-01', qualifiesForStreak: true }],
        onSelectDay: (date) => selected.push(date),
        hue: { ink: '#123456' },
        ...overrides,
      });
    },
    selected,
  };
}

function find(tree, type) {
  if (tree == null || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap((child) => find(child, type));
  return [...(tree.type === type ? [tree] : []), ...find(tree.props?.children, type)];
}

function measure(tree, width) {
  tree.props.onLayout({ nativeEvent: { layout: { width } } });
}

function pressAll(days) {
  days.forEach((day) => day.props.onPress());
}

const THIS_WEEK = [
  '2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30',
  '2026-10-01', '2026-10-02', '2026-10-03',
];

test('first render shows only the seven dates in the current week', () => {
  const harness = setup();
  const tree = harness.render();
  assert.equal(find(tree, 'ScrollView').length, 0);
  const days = find(tree, 'Pressable');
  assert.equal(days.length, 7);
  pressAll(days);
  assert.deepEqual(harness.selected, THIS_WEEK);
  assert.equal(days.filter((day) => day.props.accessibilityState.selected).length, 1);
  assert.equal(days.at(-1).props.disabled, true);
});

test('once measured, the pager opens on the current week with nothing hidden', () => {
  const harness = setup();
  measure(harness.render(), 320);
  const tree = harness.render();
  const scrolls = find(tree, 'ScrollView');
  assert.equal(scrolls.length, 1);
  const scroll = scrolls[0];
  assert.equal(scroll.props.pagingEnabled, true);
  assert.equal(scroll.props.style.opacity, undefined);
  assert.equal(scroll.props.pointerEvents, undefined);
  assert.equal(scroll.props.style.transform[0].scaleX, -1);
  assert.equal(find(tree, 'Pressable').length, 56);

  const pages = scroll.props.children;
  assert.equal(pages.length, 8);
  pages.forEach((page) => {
    assert.ok(page.props.style.flat().some((style) => style?.width === 320));
    assert.ok(page.props.style.flat().some((style) => style?.transform?.[0]?.scaleX === -1));
  });
  pressAll(find(pages[0], 'Pressable'));
  assert.deepEqual(harness.selected, THIS_WEEK);
});

test('earlier pages walk back one whole week at a time', () => {
  const harness = setup();
  measure(harness.render(), 320);
  const pages = find(harness.render(), 'ScrollView')[0].props.children;
  pressAll(find(pages[1], 'Pressable'));
  assert.deepEqual(harness.selected, [
    '2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23',
    '2026-09-24', '2026-09-25', '2026-09-26',
  ]);
  const oldest = find(pages[7], 'Pressable');
  oldest[0].props.onPress();
  assert.equal(harness.selected.at(-1), '2026-08-09');
});

test('a date change remounts the pager back on the current week', () => {
  const harness = setup();
  measure(harness.render(), 320);
  assert.equal(find(harness.render(), 'ScrollView')[0].key, '2026-10-02');
  assert.equal(find(harness.render({ todayLocalDate: '2026-10-04' }), 'ScrollView')[0].key, '2026-10-04');
});
