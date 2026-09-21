import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useRoutineSelection.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function setup(initiallySelectAll = true) {
  const hooks = [];
  let cursor = 0;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      assert.equal(name, 'react');
      return {
        useState(initial) {
          const index = cursor++;
          if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial;
          return [hooks[index], (next) => { hooks[index] = typeof next === 'function' ? next(hooks[index]) : next; }];
        },
        useRef(initial) {
          const index = cursor++;
          if (!(index in hooks)) hooks[index] = { current: initial };
          return hooks[index];
        },
      };
    },
  });
  return (slots = 3, ready = true, pending = false) => {
    cursor = 0;
    return exports.useRoutineSelection(['a', 'b', 'c'], slots, ready, pending, initiallySelectAll);
  };
}

test('capacity refresh preserves the exact selection and blocks partial submission', async () => {
  const render = setup();
  render();
  const reduced = render(1);
  assert.deepEqual(Array.from(reduced.selectedIds), ['a', 'b', 'c']);
  assert.equal(reduced.overCapacity, true);
  let writes = 0;
  await reduced.submit(async () => { writes++; });
  assert.equal(writes, 0);
  reduced.toggle('a');
  render(1).toggle('b');
  assert.deepEqual(Array.from(render(1).selectedIds), ['c']);
  assert.equal(render(1).canSubmit, true);
});

test('duplicate presses submit once before React renders pending state', async () => {
  const render = setup();
  const selection = render();
  let finish;
  let writes = 0;
  const action = () => { writes++; return new Promise((resolve) => { finish = resolve; }); };
  const first = selection.submit(action);
  await selection.submit(action);
  selection.toggle('a');
  assert.deepEqual(Array.from(render().selectedIds), ['a', 'b', 'c']);
  finish();
  await first;
  await render().submit(action);
  assert.equal(writes, 1);
});

test('failed submission retains selection and allows a retry', async () => {
  const render = setup();
  await render().submit(async () => { throw new Error('offline'); });
  assert.deepEqual(Array.from(render().selectedIds), ['a', 'b', 'c']);
  let writes = 0;
  await render().submit(async () => { writes++; });
  assert.equal(writes, 1);
  assert.deepEqual(Array.from(render().selectedIds), []);
});

test('unavailable query and pending mutation lock selection and submission', async () => {
  for (const [ready, pending] of [[false, false], [true, true]]) {
    const render = setup(false);
    const selection = render(3, ready, pending);
    selection.toggle('a');
    selection.toggleAll();
    assert.equal(render().selectedIds.length, 0);
    assert.equal(selection.canSubmit, false);
  }
});
