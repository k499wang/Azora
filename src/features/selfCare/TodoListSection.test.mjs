import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { useFirstWinOfDayStore } from './firstWinOfDayStore.ts';
import { LESSON_JOURNEY_ID, MOOD_JOURNEY_ID, nextTodayJourneyId } from '../../components/home/journey/todayJourneyOrder.ts';

const source = ts.createSourceFile(
  'TodoListSection.tsx',
  readFileSync(new URL('./TodoListSection.tsx', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
let toggleSource;
function findToggle(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'toggleCompleted') {
    toggleSource = node.initializer.getText(source);
  }
  ts.forEachChild(node, findToggle);
}
findToggle(source);
assert.ok(toggleSource, 'Exercise the actual routine completion handler');
let revealSource;
function findReveal(node) {
  if (
    ts.isCallExpression(node) &&
    node.expression.getText(source) === 'useAnimatedReaction' &&
    node.arguments[1]?.getText(source).includes('listRevealStarted')
  ) {
    revealSource = node.getText(source);
  }
  ts.forEachChild(node, findReveal);
}
findReveal(source);
assert.ok(revealSource, 'Exercise the actual routine list reveal');
const compiledReveal = ts.transpileModule(revealSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiled = ts.transpileModule(`const toggle = ${toggleSource}`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function setup(goal = { id: 'goal', title: 'Drink water', completedToday: false, recurrence: 'daily' }) {
  const write = deferred();
  const motion = deferred();
  const focused = { current: true };
  const feedback = [];
  const store = useFirstWinOfDayStore;
  store.setState({ claimedDay: null, showing: false, heldForClose: false, forced: false });
  const toggle = vm.runInNewContext(`${compiled}\ntoggle;`, {
    readOnly: false,
    togglesInFlight: { current: new Set() },
    tasksOnly: true,
    localDate: '2026-10-05',
    todayLocalDate: '2026-10-05',
    playCompletionSound() {},
    firstWin: {
      claim: () => store.getState().claim('user:2026-10-05'),
      release: () => store.getState().release('user:2026-10-05'),
    },
    toggleGoal: { toggle: () => write.promise },
    settlingGoals: { hold() {}, release() {} },
    holdMotionQuiet() {},
    GOAL_SETTLED_MS: 0,
    selfCareGoalCoins: () => 1,
    props: { onCompleted(completion) { feedback.push(completion); store.getState().show(); } },
    focused,
    goalCompletionMotionSettled: () => motion.promise,
    useFirstWinOfDayStore: store,
  });
  toggle(goal);
  return { write, motion, focused, feedback, store };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

const nextActionNames = ['nextId', 'nextRow', 'startNextPress'];
const nextActionSources = {};
function findNextAction(node) {
  if (ts.isVariableDeclaration(node) && nextActionNames.includes(node.name.getText(source))) {
    nextActionSources[node.name.getText(source)] = node.initializer.getText(source);
  }
  ts.forEachChild(node, findNextAction);
}
findNextAction(source);
const compiledNextAction = ts.transpileModule(
  nextActionNames.map((name) => `const ${name} = ${nextActionSources[name]};`).join('\n'),
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
).outputText;

function homeNextAction(rows, overrides = {}) {
  const ids = Object.keys(rows);
  return vm.runInNewContext(`${compiledNextAction}\n({ nextId, nextRow, startNextPress });`, {
    journeyIds: ids,
    doneRows: Object.fromEntries(ids.map((id) => [id, rows[id].completed])),
    fullOrder: ids,
    tasksOnly: false,
    props: { preferredNextId: LESSON_JOURNEY_ID },
    journeyRow: (id) => rows[id],
    nextTodayJourneyId,
    lead() {},
    ...overrides,
  });
}

test('Home primary action opens the goal lesson using the supplied gated callback and title', () => {
  const opened = [];
  const mood = { title: 'Check in', completed: false, onPress: () => opened.push('mood') };
  const lesson = { title: 'Clear one small spot', completed: false, locked: true, onPress: () => opened.push('paywall') };
  const next = homeNextAction({ [MOOD_JOURNEY_ID]: mood, [LESSON_JOURNEY_ID]: lesson });
  assert.equal(next.nextRow.title, 'Clear one small spot');
  assert.equal(next.startNextPress, lesson.onPress);
  next.startNextPress();
  assert.deepEqual(opened, ['paywall']);
});

test('Home disables a loading primary row and falls back after the lesson is complete', () => {
  const mood = { title: 'Check in', completed: false, onPress() {} };
  const lesson = { title: 'Clear one small spot', completed: false, loading: true, onPress() {} };
  assert.equal(homeNextAction({ [MOOD_JOURNEY_ID]: mood, [LESSON_JOURNEY_ID]: lesson }).startNextPress, undefined);
  assert.equal(homeNextAction({ [MOOD_JOURNEY_ID]: mood, [LESSON_JOURNEY_ID]: { ...lesson, completed: true } }).startNextPress, mood.onPress);
  assert.equal(homeNextAction({ [MOOD_JOURNEY_ID]: mood }).startNextPress, mood.onPress);
  assert.equal(homeNextAction({}).startNextPress, undefined);
});

function setupReveal(overrides = {}) {
  let prepare, react;
  const fades = [];
  const state = {
    listReady: true,
    showAllDone: false,
    listPlaced: true,
    readOnly: false,
    reducedMotion: false,
    drawerNeedsLayout: true,
    rowsDrawnEnd: { value: -1 },
    drawerHeight: { value: 0 },
    listOpacity: { value: 0 },
    listRevealStarted: { value: false },
    duration: { base: 250 },
    easing: { enter: 'enter' },
    cancelAnimation() {},
    withTiming(value, options) { fades.push(options); return value; },
    useAnimatedReaction(nextPrepare, nextReact) { prepare = nextPrepare; react = nextReact; },
    ...overrides,
  };
  vm.runInNewContext(compiledReveal, state);
  return { state, fades, frame: () => react(prepare()) };
}

test('routine list reentry waits for row and drawer placement, then reveals together once', () => {
  const { state, fades, frame } = setupReveal({
    showAllDone: true,
    listOpacity: { value: 1 },
    listRevealStarted: { value: true },
  });
  frame();
  assert.equal(state.listOpacity.value, 0);
  assert.equal(state.listRevealStarted.value, false);
  state.showAllDone = false;
  frame();
  state.rowsDrawnEnd.value = 100;
  frame();
  assert.equal(state.listOpacity.value, 0);
  assert.equal(fades.length, 0);
  state.drawerHeight.value = 46;
  frame();
  frame();
  assert.equal(state.listOpacity.value, 1);
  assert.equal(fades.length, 1);
  assert.equal(fades[0].duration, state.duration.base);
  for (let cycle = 0; cycle < 8; cycle += 1) {
    state.showAllDone = true;
    frame();
    assert.equal(state.listOpacity.value, 0);
    state.rowsDrawnEnd.value = -1;
    state.drawerHeight.value = 0;
    state.showAllDone = false;
    frame();
    assert.equal(state.listOpacity.value, 0);
    state.rowsDrawnEnd.value = 100;
    state.drawerHeight.value = 46;
    frame();
    assert.equal(state.listOpacity.value, 1);
    assert.equal(fades.length, cycle + 2);
  }
});

test('filing habits into a new drawer leaves the already visible routine list visible', () => {
  const { state, fades, frame } = setupReveal({ drawerNeedsLayout: false });
  state.rowsDrawnEnd.value = 100;
  frame();
  state.drawerNeedsLayout = true;
  frame();
  assert.equal(state.listOpacity.value, 1);
  state.drawerHeight.value = 46;
  frame();
  assert.equal(fades.length, 1);
});

test('routine list loading resets the reveal and reduced motion reveals immediately', () => {
  const { state, fades, frame } = setupReveal({
    listReady: false,
    reducedMotion: true,
    rowsDrawnEnd: { value: 100 },
    drawerHeight: { value: 46 },
    listOpacity: { value: 1 },
    listRevealStarted: { value: true },
  });
  frame();
  assert.equal(state.listOpacity.value, 0);
  state.listReady = true;
  frame();
  assert.equal(state.listOpacity.value, 1);
  assert.equal(fades.length, 0);
});

test('a successful routine win queues the popup after leaving the screen', async () => {
  const state = setup();
  state.focused.current = false;
  state.write.resolve();
  await flush();
  assert.equal(state.store.getState().showing, false);
  state.motion.resolve();
  await flush();
  assert.equal(state.store.getState().showing, true);
  assert.equal(state.feedback.length, 0);
});

test('a focused routine win uses its existing completion feedback once', async () => {
  const state = setup();
  state.motion.resolve();
  state.write.resolve();
  await flush();
  assert.equal(state.feedback.length, 1);
  assert.equal(state.feedback[0].isFirstWinToday, true);
  assert.equal(state.store.getState().showing, true);
});

test('a failed routine write releases the claim without queuing a popup after blur', async () => {
  const state = setup();
  state.focused.current = false;
  state.motion.resolve();
  state.write.reject(new Error('offline'));
  await flush();
  assert.equal(state.store.getState().showing, false);
  assert.equal(state.store.getState().claimedDay, null);
  assert.equal(state.feedback.length, 0);
});

 test('undoing a completed habit does not claim a win or show completion feedback', async () => {
  const state = setup({ id: 'goal', title: 'Drink water', completedToday: true, recurrence: 'daily' });
  state.write.resolve();
  state.motion.resolve();
  await flush();
  assert.equal(state.feedback.length, 0);
  assert.equal(state.store.getState().showing, false);
  assert.equal(state.store.getState().claimedDay, null);
});
