import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function mount(relativePath, props) {
  const hooks = [], effects = [], interpolations = [], timings = [];
  let cursor = 0;
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
      return [hooks[index], next => {
        hooks[index] = typeof next === 'function' ? next(hooks[index]) : next;
      }];
    },
    useMemo(callback, deps) {
      const index = cursor++;
      if (!sameDeps(hooks[index]?.deps, deps)) hooks[index] = { deps, value: callback() };
      return hooks[index].value;
    },
    useEffect(callback, deps) {
      const index = cursor++, previous = hooks[index];
      if (sameDeps(previous?.deps, deps)) return;
      const record = { deps };
      hooks[index] = record;
      effects.push(() => { previous?.cleanup?.(); record.cleanup = callback(); });
    },
  };
  class Value {
    constructor(value) { this.value = value; }
    setValue(value) { this.value = value; }
    interpolate(config) {
      const node = { parent: this, config };
      interpolations.push(node);
      return node;
    }
  }
  const Animated = {
    Value, View: 'AnimatedView',
    timing(value, config) {
      timings.push({ value, config });
      return { start() {}, stop() {} };
    },
    stagger: () => ({ start() {}, stop() {} }),
  };
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
      Animated, View: 'View', Pressable: 'Pressable',
      StyleSheet: {
        create: value => value, absoluteFill: {},
        absoluteFillObject: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
      },
      Easing: { out: value => value, cubic: 'cubic' },
    },
    'react-native-reanimated': {
      default: { View: 'ReanimatedView' },
      useAnimatedStyle: callback => react.useMemo(() => new Proxy({}, {
        get: (_, property) => callback()[property],
      }), []),
      useReducedMotion: () => false,
      useSharedValue: initial => react.useRef({ value: initial }).current,
    },
    '../../hooks/usePopOnChange': { usePopOnChange: () => ({ value: 1 }) },
    '../../lib/ui/uiThreadTimer': { startUiTimer: () => () => {} },
    '../../native/tapHaptics': { triggerTapHaptic() {} },
    '../../services/analytics/sessionReplay': { pauseSessionReplay: () => () => {} },
    './entranceTiming': { entranceTiming: { option: 720, optionDelay: 290, optionStagger: 65 } },
    '../../theme/card': { card: { base: { borderRadius: 22, borderCurve: 'continuous' } } },
    '../../theme/colors': { colors: {
      background: { card: 'white' }, text: { primary: 'black' },
      neutral: { 0: 'white', 300: 'grey' }, primary: { blue500: 'blue' },
    } },
    '../../theme/motion': { duration: { beat: 420 }, emphasis: { choose: 1.04 } },
    '../../theme/spacing': { spacing: { sm: 8, md: 16 } },
    '../../theme/typography': { fonts: { semibold: 'font' }, typography: { label: { large: {} } } },
    '../common/AnimatedSelectionToggle': { default: 'SelectionToggle' },
    '../common/Text': { Text: 'Text' },
    './OnboardingOptionIcon': { default: 'OptionIcon' },
    './icons/Icon': { default: 'Icon' },
  };
  const compiled = ts.transpileModule(readFileSync(new URL(relativePath, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require(name) {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  let component = exports.default;
  return {
    interpolations, timings,
    mountRow(index = 0) {
      const row = this.render().props.children[index].props.children;
      hooks.forEach(hook => hook?.cleanup?.());
      hooks.length = 0;
      props = row.props;
      component = row.type;
      return this.render();
    },
    render(patch = {}) {
      Object.assign(props, patch);
      cursor = 0;
      const tree = component(props);
      effects.splice(0).forEach(run => run());
      return tree;
    },
  };
}

const options = [
  { id: 'calm', title: 'Feel calm', accent: 'blue' },
  { id: 'sleep', title: 'Sleep well', accent: 'purple' },
];
const rows = tree => tree.props.children;

test('answer selection and repeated taps keep stable entrance animation node identities', () => {
  const h = mount('./OnboardingOptionList.tsx', { options, selectedIds: [], onSelect() {} });
  const original = rows(h.render()).map(row => row.props.style);
  assert.equal(h.interpolations.length, options.length);
  for (let cycle = 0; cycle < 10; cycle++) {
    const index = cycle % options.length;
    const tree = h.render({ options: options.map(option => ({ ...option })), selectedIds: [options[index].id] });
    rows(tree)[index].props.children.props.onPress();
    rows(h.render()).forEach((row, i) => {
      assert.equal(row.props.style, original[i]);
      assert.equal(row.props.style.opacity, original[i].opacity);
      assert.equal(row.props.style.transform[0].translateY, original[i].transform[0].translateY);
    });
  }
  assert.equal(h.interpolations.length, options.length, 'selection must not recreate entrance interpolation nodes');
  assert.equal(h.timings.length, options.length, 'selection must not restart entrances');
});

test('a new question creates fresh entrance nodes even when its option count is unchanged', () => {
  const h = mount('./OnboardingOptionList.tsx', { options, selectedIds: [], onSelect() {} });
  const original = rows(h.render()).map(row => row.props.style);
  const nextOptions = options.map(option => ({ ...option, id: `${option.id}-next` }));
  const next = rows(h.render({ options: nextOptions })).map(row => row.props.style);
  next.forEach((style, i) => {
    assert.notEqual(style.opacity, original[i].opacity);
    assert.notEqual(style.transform[0].translateY, original[i].transform[0].translateY);
    assert.equal(style.opacity.value, 0);
  });
  assert.equal(h.interpolations.length, options.length * 2);
  rows(h.render({ selectedIds: [nextOptions[0].id] })).forEach((row, i) => {
    assert.equal(row.props.style, next[i]);
  });
  assert.equal(h.interpolations.length, options.length * 2);
});

test('toggle transitions keep full-size symbols centered and reuse their fade nodes', () => {
  const h = mount('../common/AnimatedSelectionToggle.tsx', { selected: false });
  const animatedStyles = tree => {
    assert.equal(tree.type, 'AnimatedView');
    assert.equal(tree.props.pointerEvents, 'none');
    for (const mark of tree.props.children) {
      const style = Object.assign({}, ...mark.props.style);
      assert.equal(style.transform, undefined, 'glyphs must not scale or rotate during the fade');
      assert.equal(mark.props.children.props.size, 16);
      assert.equal(style.position, 'absolute');
      for (const edge of ['top', 'right', 'bottom', 'left']) assert.equal(style[edge], 0);
      assert.equal(style.alignItems, 'center');
      assert.equal(style.justifyContent, 'center');
    }
    return [tree.props.style[1], ...tree.props.children.map(mark => mark.props.style[1])];
  };
  const original = animatedStyles(h.render());
  assert.equal(h.interpolations.length, 3);
  for (let cycle = 0; cycle < 10; cycle++) {
    const selected = cycle % 2 === 0;
    animatedStyles(h.render({ selected })).forEach((style, i) => assert.equal(style, original[i]));
    assert.equal(h.timings.at(-1).config.toValue, selected ? 1 : 0);
    assert.equal(h.timings.at(-1).value, h.interpolations[0].parent);
    assert.equal(h.timings.at(-1).config.duration, 220);
  }
  assert.equal(h.interpolations.length, 3);
});

test('selection keeps the bouncing row surface and outline geometry fixed', () => {
  const h = mount('./OnboardingOptionList.tsx', { options, selectedIds: [], onSelect() {} });
  const original = h.mountRow();
  const layers = tree => tree.props.children.props.children.slice(0, 2);
  const [surface, outline] = layers(original);
  const surfaceStyle = surface.props.style[1];
  const outlineStyle = outline.props.style[1];
  const selectionStyle = outline.props.style[2];
  assert.equal(surfaceStyle.borderWidth, 1);
  assert.equal(outlineStyle.borderWidth, 2);
  assert.equal(outlineStyle.backgroundColor, 'transparent');
  assert.equal(outlineStyle.borderRadius, surfaceStyle.borderRadius);
  assert.equal(outlineStyle.borderCurve, surfaceStyle.borderCurve);
  assert.equal(selectionStyle.opacity, 0);
  for (let cycle = 0; cycle < 10; cycle++) {
    const selected = cycle % 2 === 0;
    const tree = h.render({ selected, pressCount: cycle + 1 });
    const [nextSurface, nextOutline] = layers(tree);
    assert.equal(tree.props.style, original.props.style, 'whole-row spring retains its animation style');
    assert.equal(nextSurface.props.style[1], surfaceStyle);
    assert.equal(nextOutline.props.style[1], outlineStyle);
    assert.equal(nextOutline.props.style[2], selectionStyle);
    assert.equal(selectionStyle.opacity, selected ? 1 : 0);
    assert.equal(tree.props.children.props.accessibilityState.selected, selected);
  }
});
