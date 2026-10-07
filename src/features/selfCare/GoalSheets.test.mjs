import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

/** Run the actual form with layout effects before paint and passive effects after. */
function mount(filename, initialProps) {
  const hooks = [];
  const layoutEffects = [];
  const effects = [];
  const paints = [];
  let cursor = 0;
  let dirty = false;
  let tree;
  let props = initialProps;
  const effect = queue => (callback, deps) => {
    const index = cursor++;
    const previous = hooks[index];
    if (previous?.deps?.every((value, i) => Object.is(value, deps[i]))) return;
    const record = { deps };
    hooks[index] = record;
    queue.push(() => {
      previous?.cleanup?.();
      record.cleanup = callback();
    });
  };
  const react = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    useRef(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], next => {
        const value = typeof next === 'function' ? next(hooks[index]) : next;
        if (Object.is(value, hooks[index])) return;
        hooks[index] = value;
        dirty = true;
      }];
    },
    useCallback: callback => callback,
    useLayoutEffect: effect(layoutEffects),
    useEffect: effect(effects),
  };
  const native = {
    KeyboardAvoidingView: 'KeyboardAvoidingView', Modal: 'Modal', Pressable: 'Pressable',
    ScrollView: 'ScrollView', View: 'View', experimental_LayoutConformance: 'LayoutConformance',
    Platform: { OS: 'ios' }, StyleSheet: { create: styles => styles },
  };
  const modules = new Map();
  function load(relative) {
    if (modules.has(relative)) return modules.get(relative);
    const exports = {};
    modules.set(relative, exports);
    const compiled = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
    }).outputText;
    vm.runInNewContext(compiled, {
      exports, React: react,
      require(name) {
        if (name === 'react') return react;
        if (name === 'react-native') return native;
        if (name === 'react-native-reanimated') return { default: { View: 'AnimatedView' } };
        if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
        if (name === 'expo-linear-gradient') return { LinearGradient: 'LinearGradient' };
        if (name === 'expo-status-bar') return { StatusBar: 'StatusBar' };
        if (name.endsWith('/Text')) return { Text: 'Text', TextInput: 'TextInput' };
        if (['colors', 'spacing', 'card', 'pressable'].includes(name.split('/').at(-1))) return load(`../../theme/${name.split('/').at(-1)}.ts`);
        if (name.endsWith('/typography')) return {
          fonts: {}, wrappedLineHeight: () => 24,
          typography: { title: { title2: {} }, body: { small: {} }, heading: { heading1: {} }, overline: {} },
        };
        if (name.endsWith('/tapHaptics')) return { triggerTapHaptic() {} };
        if (name.endsWith('/paths')) return { ICON_PATHS: {} };
        if (name === './domain/selfCareGoal') return load('./domain/selfCareGoal.ts');
        if (name === './goalSuggestions') return load('./goalSuggestions.ts');
        if (name === './GoalScheduleOptions') return { GoalTimeOptions: 'GoalTimeOptions', GoalRepeatOptions: 'GoalRepeatOptions' };
        const component = name.split('/').at(-1);
        if (['GlassIconButton', 'ChunkyButton', 'BottomSheet', 'SlideUpSheet', 'GoalIconPicker', 'CoinWorth', 'Icon', 'TaskIllustration', 'Collapsible', 'CloseButton'].includes(component)) return { default: component };
        throw new Error(`Unexpected dependency: ${name}`);
      },
    });
    return exports;
  }
  const component = load(filename).default;
  function flush() {
    dirty = true;
    let iterations = 0;
    while (dirty || effects.length > 0) {
      assert.ok(++iterations < 30, 'form settles after effects');
      if (dirty) {
        dirty = false;
        cursor = 0;
        tree = component(props);
        layoutEffects.splice(0).forEach(run => run());
        if (dirty) continue;
        paints.push(tree);
      }
      effects.splice(0).forEach(run => run());
    }
  }
  function find(predicate, root = tree) {
    if (root == null || typeof root !== 'object') return undefined;
    if (predicate(root)) return root;
    for (const child of (root.children ?? []).flat(Infinity)) {
      const found = find(predicate, child);
      if (found) return found;
    }
    return undefined;
  }
  flush();
  return {
    paints, find,
    node: type => find(node => node.type === type),
    render(next) { props = next; paints.length = 0; flush(); },
    act(callback) { paints.length = 0; callback(); flush(); },
  };
}

const addProps = { visible: true, onClose() {}, onSubmit() {}, pending: false, error: null };
const goal = { id: 'habit-1', title: 'Walk', icon: 'sun', recurrence: 'daily', scheduledTime: '07:00' };
const editProps = { goal, onClose() {}, onSave() {}, pending: false, error: null };
const field = (h, label) => h.find(node => node.props.label === label);
const draft = (h, root) => h.find(node => node.type === 'TextInput', root).props.value;

test('closing the repeat picker retains its title, options and selection during exit', () => {
  const h = mount('./AddGoalSheet.tsx', addProps);
  for (let cycle = 0; cycle < 8; cycle++) {
    h.act(() => h.find(node => node.props.label?.startsWith('Repeat,')).props.onPress());
    h.act(() => h.node('GoalRepeatOptions').props.onSelect('weekly'));
    h.act(() => h.node('BottomSheet').props.onClose());
    assert.equal(h.node('BottomSheet').props.visible, false);
    assert.equal(h.node('BottomSheet').props.title, 'Repeat');
    assert.equal(h.node('GoalRepeatOptions').props.recurrence, 'weekly');
    assert.equal(h.node('GoalTimeOptions'), undefined);
    h.act(() => field(h, 'Time of day').props.onPress());
    assert.equal(h.node('BottomSheet').props.title, 'Time of day');
    assert.ok(h.node('GoalTimeOptions'));
    h.act(() => h.node('BottomSheet').props.onClose());
    assert.equal(h.node('BottomSheet').props.title, 'Time of day');
  }
});

test('add form retains its draft and icon shelf on exit and starts fresh before repaint', () => {
  const h = mount('./AddGoalSheet.tsx', addProps);
  for (let cycle = 0; cycle < 8; cycle++) {
    const title = `Custom habit ${cycle}`;
    h.act(() => h.node('TextInput').props.onChangeText(title));
    h.act(() => h.find(node => node.props.accessibilityLabel === 'Change the icon').props.onPress());
    h.act(() => h.find(node => node.props.label?.startsWith('Repeat,')).props.onPress());
    h.render({ ...addProps, visible: false });
    assert.equal(draft(h), title);
    assert.ok(h.node('GoalIconPicker'));
    assert.equal(h.node('BottomSheet').props.visible, false);
    assert.equal(h.node('BottomSheet').props.title, 'Repeat');
    assert.ok(h.node('GoalRepeatOptions'));
    h.render(addProps);
    assert.ok(h.paints.every(frame => draft(h, frame) === ''));
    assert.equal(h.node('GoalIconPicker'), undefined);
    assert.equal(h.node('BottomSheet').props.visible, false);
  }
});

test('suggestions seed the add form before paint and submission preserves edits', () => {
  let submitted;
  const initialSuggestion = { title: 'Stretch', icon: 'sun', recurrence: 'daily', scheduledTime: '07:00' };
  const props = { ...addProps, initialSuggestion, onSubmit: value => { submitted = value; } };
  const h = mount('./AddGoalSheet.tsx', props);
  assert.ok(h.paints.every(frame => draft(h, frame) === 'Stretch'));
  h.act(() => h.node('TextInput').props.onChangeText('  Morning stretch  '));
  h.act(() => h.find(node => node.props.label?.startsWith('Repeat,')).props.onPress());
  h.act(() => h.node('GoalRepeatOptions').props.onSelect('weekly'));
  h.act(() => h.node('BottomSheet').props.onClose());
  h.act(() => h.node('ChunkyButton').props.onPress());
  assert.equal(submitted.title, 'Morning stretch');
  assert.equal(submitted.recurrence, 'weekly');
});

test('edit dismissal preserves the expanded section and draft across repeated cycles', () => {
  const h = mount('./GoalEditSheet.tsx', editProps);
  for (let cycle = 0; cycle < 8; cycle++) {
    h.act(() => field(h, 'Repeat').props.onToggle());
    h.act(() => h.node('TextInput').props.onChangeText(`Edited ${cycle}`));
    h.render({ ...editProps, goal: null });
    assert.equal(h.node('SlideUpSheet').props.visible, false);
    assert.equal(field(h, 'Repeat').props.open, true);
    assert.equal(draft(h), `Edited ${cycle}`);
    h.render(editProps);
    assert.ok(h.paints.every(frame => draft(h, frame) === goal.title));
    assert.equal(field(h, 'Repeat').props.open, false);
  }
});

test('same-goal refetch keeps unsaved edits; opening a different goal seeds before paint', () => {
  const h = mount('./GoalEditSheet.tsx', editProps);
  h.act(() => field(h, 'Time of day').props.onToggle());
  h.act(() => h.node('TextInput').props.onChangeText('Unsaved'));
  h.render({ ...editProps, goal: { ...goal, title: 'Refetched' } });
  assert.equal(draft(h), 'Unsaved');
  assert.equal(field(h, 'Time of day').props.open, true);
  h.render({ ...editProps, goal: { ...goal, id: 'habit-2', title: 'Read' } });
  assert.ok(h.paints.every(frame => draft(h, frame) === 'Read'));
  assert.equal(field(h, 'Time of day').props.open, false);
});
