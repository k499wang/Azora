import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(new URL('./AzoPlanScreen.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const flush = () => new Promise((resolve) => setImmediate(resolve));

function mount({ answer = { reply: 'Done', todos: [], changes: [] } } = {}) {
  const slots = [];
  const saves = [];
  let cursor = 0;
  let focused = true;
  let focusEffect;
  let cleanup;
  let onText;
  let cancellations = 0;
  const conversations = [];
  const voice = {
    phase: 'recording', transcript: 'Buy milk', durationMillis: 1000, metering: -20,
    cancel() { cancellations++; voice.phase = 'idle'; },
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => {
        slots[index] = typeof value === 'function' ? value(slots[index]) : value;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!slots[index] || !deps.every((dep, i) => dep === slots[index].deps[i])) {
        slots[index] = { deps, callback };
      }
      return slots[index].callback;
    },
  };
  const assist = {
    freeMessagesLeft: 3,
    openPaywall() { focused = false; cleanup?.(); cleanup = undefined; },
    saving: false,
    saveError: null,
    async ask(conversation) { conversations.push(conversation); return answer; },
    async save(todos, changes, onSaved) { saves.push({ todos, changes }); onSaved?.(); },
  };
  const exports = {};
  vm.runInNewContext(compiled, { exports, require(name) {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return {
      jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }),
    };
    if (name === '@react-navigation/native') return { useFocusEffect(effect) {
      if (focusEffect !== effect) { cleanup?.(); cleanup = undefined; focusEffect = effect; }
      if (focused && !cleanup) cleanup = effect();
    } };
    if (name === 'react-native') return { View: 'View', ScrollView: 'ScrollView', StyleSheet: { create: (value) => value } };
    if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ bottom: 0 }) };
    if (name === 'react-native-reanimated') return { useReducedMotion: () => true, default: { View: 'AnimatedView' } };
    if (name === './useAzoAssist') return { useAzoAssist: () => assist };
    if (name === './useVoiceNote') return { useVoiceNote(options) { onText = options.onText; return voice; } };
    if (name.endsWith('/useTodayLocalDate')) return { useTodayLocalDate: () => '2026-10-29' };
    if (name === './domain/todoChange') return {
      removesRepeat: (change) => change.kind === 'remove' && change.goal.recurrence !== 'once',
      todoChangeNote: (change) => `${change.kind} "${change.goal.title}"`,
    };
    if (name.endsWith('/ChunkyButton')) return { default: 'ChunkyButton', CHUNKY_TONE_DESTRUCTIVE: 'destructive' };
    if (name === './useAzoAssistCopy') return { useAzoAssistCopy: () => ({ planOpener: 'What is on your mind?', brainDumpHeading: 'Brain dump' }) };
    if (name.endsWith('/tapHaptics')) return { triggerSoftHaptic() {}, triggerSuccessHaptic() {} };
    if (name.endsWith('/card')) return { card: {} };
    if (name.endsWith('/colors')) return { colors: { background: {}, text: {}, error: {} } };
    if (name.endsWith('/motion')) return { duration: {}, easing: {}, stagger: {} };
    if (name.endsWith('/spacing')) return { padding: { screen: {} }, spacing: {} };
    if (name.endsWith('/typography')) return { fonts: {}, typography: { title: {}, body: { large: {} }, label: {} } };
    if (name.endsWith('/Text')) return { Text: 'Text' };
    return { default: name.split('/').at(-1) };
  } });
  return {
    conversations,
    saves,
    get cancellations() { return cancellations; },
    get phase() { return voice.phase; },
    get onText() { return onText; },
    render() {
      cursor = 0;
      return exports.default({ navigation: { isFocused: () => focused, goBack() {} } });
    },
    // Navigation state can change before the screen rerenders or receives blur cleanup.
    setFocused(value) { focused = value; },
    unmount() { cleanup?.(); cleanup = undefined; },
  };
}

function find(tree, type) {
  if (!tree || typeof tree !== 'object') return undefined;
  if (Array.isArray(tree)) return tree.map((child) => find(child, type)).find(Boolean);
  return tree.type === type ? tree : find(tree.props?.children, type);
}

test('Upgrade cancels dictation while mounted and late speech cannot consume an answer', async () => {
  const screen = mount();
  const tree = screen.render();
  const lateTranscript = screen.onText;
  find(tree, 'FreeMessagesCaption').props.onUpgrade();
  assert.equal(screen.cancellations, 1);
  assert.equal(screen.phase, 'idle');
  lateTranscript('Unrelated speech behind the paywall');
  await flush();
  assert.equal(screen.conversations.length, 0);
  screen.unmount();
});

test('speech checks live focus even before blur cleanup or a rerender', async () => {
  const screen = mount();
  screen.render();
  screen.setFocused(false);
  screen.onText('Do not submit this');
  await flush();
  assert.equal(screen.conversations.length, 0);
  screen.unmount();
});

test('returning from the paywall allows a fresh brain dump across repeated visits', async () => {
  const screen = mount();
  for (let visit = 0; visit < 5; visit++) {
    screen.setFocused(true);
    const tree = screen.render();
    screen.onText(`Fresh brain dump ${visit}`);
    await flush();
    assert.equal(screen.conversations.length, visit + 1);
    find(tree, 'FreeMessagesCaption').props.onUpgrade();
    screen.onText('Discarded speech');
    await flush();
    assert.equal(screen.conversations.length, visit + 1);
  }
  assert.equal(screen.cancellations, 5);
  screen.setFocused(true);
  screen.render();
  screen.unmount();
  assert.equal(screen.cancellations, 6);
});

function findAll(tree, type, found = []) {
  if (!tree || typeof tree !== 'object') return found;
  if (Array.isArray(tree)) {
    tree.forEach((child) => findAll(child, type, found));
    return found;
  }
  if (tree.type === type) found.push(tree);
  return findAll(tree.props?.children, type, found);
}

test('a change to an existing to-do shows as a card and is only saved on Apply', async () => {
  const gym = { id: 'g1', title: 'Go to the gym', recurrence: 'daily' };
  const screen = mount({ answer: { reply: 'Got it', todos: [], changes: [{ kind: 'remove', goal: gym }] } });
  screen.render();
  screen.onText('Drop the gym today');
  await flush();
  const tree = screen.render();
  assert.equal(findAll(tree, 'TodoChangeRow').length, 1);
  assert.equal(screen.saves.length, 0);
  const button = find(tree, 'ChunkyButton');
  assert.equal(button.props.label, 'Apply 1');
  assert.equal(button.props.tone, 'destructive');
  assert.match(screen.conversations[0].at(-1).text, /Drop the gym/);
  button.props.onPress();
  assert.equal(JSON.stringify(screen.saves), JSON.stringify([{ todos: [], changes: [{ kind: 'remove', goal: gym }] }]));
  screen.unmount();
});

test('an unticked change is not applied', async () => {
  const call = { id: 'g2', title: 'Call mom', recurrence: 'once' };
  const screen = mount({ answer: { reply: 'Sure', todos: [], changes: [{ kind: 'update', goal: call }] } });
  screen.render();
  screen.onText('Move call mom to tonight');
  await flush();
  find(screen.render(), 'TodoChangeRow').props.onToggle();
  const button = find(screen.render(), 'ChunkyButton');
  assert.equal(button.props.label, 'Add 0');
  assert.equal(button.props.disabled, true);
  assert.equal(button.props.tone, undefined);
  screen.unmount();
});
