import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the real event callback with a React commit deliberately held back.
// This reproduces two native press events queued against the same render.
const file = ts.createSourceFile('DailyRewardFlow.tsx',
  readFileSync(new URL('./DailyRewardFlow.tsx', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'handlePlace') {
    callback = node.initializer.arguments[0].getText(file);
  }
  ts.forEachChild(node, visit);
}
visit(file);
assert.ok(callback);

function setup(overrides = {}) {
  let writes = 0;
  let landings = 0;
  let seals = 0;
  const context = {
    commitStarted: { current: false }, committed: false, leaving: false,
    unlocked: true, selected: 'rug', selectedOption: { id: 'rug' }, slot: 'day1',
    triggerTapHaptic() {}, railOut: { value: 0 },
    withTiming: (value) => value, reducedMotion: false, easing: { enter: 0 },
    setCommitted() {}, completesRoom: false, onSealFrom() { seals++; },
    stageLeft: 0, stageTop: 0, roomWidth: 300, stageScale: 1,
    setLanding() { landings++; }, placedPicks: {}, onPlace() { writes++; },
    ...overrides,
  };
  const press = vm.runInNewContext(`(${callback})`, context);
  return { press, context, get writes() { return writes; },
    get landings() { return landings; }, get seals() { return seals; } };
}

test('queued placement presses write and animate exactly once before a React commit', () => {
  const state = setup();
  state.press();
  state.press();
  assert.equal(state.writes, 1);
  assert.equal(state.landings, 1);
});

test('last-piece presses hand off to the room seal exactly once', () => {
  const state = setup({ completesRoom: true });
  state.press();
  state.press();
  assert.equal(state.writes, 1);
  assert.equal(state.seals, 1);
  assert.equal(state.landings, 0);
});

for (const unavailable of [
  { committed: true }, { leaving: true }, { unlocked: false },
  { selected: null }, { selectedOption: null }, { slot: null },
]) {
  test(`placement does nothing when unavailable: ${JSON.stringify(unavailable)}`, () => {
    const state = setup(unavailable);
    state.press();
    assert.equal(state.writes, 0);
    assert.equal(state.context.commitStarted.current, false);
  });
}
