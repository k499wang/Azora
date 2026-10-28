import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeTodoChanges, parseTodoRefs, todoRefsLine } from './todoChanges.ts';

const refs = parseTodoRefs([
  { ref: 't1', title: 'Go to the gym', daypart: 'evening', minutes: 45, repeats: true, done: false },
  { ref: 't2', title: 'Call mom', daypart: 'afternoon', minutes: 10, repeats: false, done: false },
  { ref: 't3', title: 'Make the bed', daypart: 'start', minutes: 2, repeats: true, done: true },
]);
const always = () => true;

test('an older app sends no refs, so it stays add-only', () => {
  assert.equal(parseTodoRefs(undefined), null);
  assert.equal(parseTodoRefs(['Call mom']).length, 0);
});

test('malformed and duplicate refs are dropped', () => {
  const parsed = parseTodoRefs([
    { ref: 't1', title: 'A' },
    { ref: 't1', title: 'B' },
    { ref: 'x', title: 'C' },
    { ref: 't2', title: '  ' },
    { ref: 't3', title: 'D', daypart: 'noon', minutes: 'ten' },
  ]);
  assert.deepEqual(parsed.map((todo) => todo.ref), ['t1', 't3']);
  assert.equal(parsed[1].daypart, null);
  assert.equal(parsed[1].minutes, null);
});

test('changes to unknown, finished or already-changed to-dos are dropped', () => {
  const changes = normalizeTodoChanges([
    { ref: 't9', action: 'remove', source: 'x' },
    { ref: 't3', action: 'remove', source: 'x' },
    { ref: 't2', action: 'remove', source: 'x' },
    { ref: 't2', action: 'update', title: 'Text mom', source: 'x' },
    { ref: 't1', action: 'archive', source: 'x' },
  ], refs, always);
  assert.deepEqual(changes, [{ ref: 't2', action: 'remove' }]);
});

test('a change that is not grounded in their words is dropped', () => {
  assert.deepEqual(normalizeTodoChanges([{ ref: 't2', action: 'remove', source: 'x' }], refs, () => false), []);
});

test('an update keeps only what actually changes', () => {
  const changes = normalizeTodoChanges([
    { ref: 't1', action: 'update', title: 'go to the GYM', daypart: 'start', minutes: 45, source: 'x' },
    { ref: 't2', action: 'update', title: 'Call mom', daypart: 'afternoon', source: 'x' },
  ], refs, always);
  assert.deepEqual(changes, [{ ref: 't1', action: 'update', daypart: 'start' }]);
});

test('update minutes are clamped and titles trimmed', () => {
  const [change] = normalizeTodoChanges(
    [{ ref: 't2', action: 'update', title: '  Call mom about Sunday  ', minutes: 500, source: 'x' }],
    refs,
    always,
  );
  assert.deepEqual(change, { ref: 't2', action: 'update', title: 'Call mom about Sunday', minutes: 120 });
});

test('the list line names refs, repeats and done', () => {
  const line = todoRefsLine(refs);
  assert.match(line, /t1: "Go to the gym" \(evening, 45 min, repeats\)/);
  assert.match(line, /t3: "Make the bed" \(start, 2 min, repeats, done\)/);
  assert.equal(todoRefsLine([]), 'They have no to-dos today yet.');
});
