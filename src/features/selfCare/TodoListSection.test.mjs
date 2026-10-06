import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { useFirstWinOfDayStore } from './firstWinOfDayStore.ts';

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
