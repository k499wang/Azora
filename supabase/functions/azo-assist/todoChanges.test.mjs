import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cleanPlanDay,
  mentionsDay,
  normalizeTodoChanges,
  parsePlanDays,
  parseTodoRefs,
  planInstruction,
  todoRefsLine,
} from './todoChanges.ts';

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

const now = Date.UTC(2026, 9, 29, 12);
const days = parsePlanDays('2026-10-29', now);

test('an app that sends its today can plan the coming week; an older one cannot', () => {
  assert.deepEqual(days, ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04']);
  assert.equal(parsePlanDays(undefined, now), null);
  assert.equal(parsePlanDays('29/10/2026', now), null);
  assert.equal(parsePlanDays('2026-12-25', now), null);
  assert.deepEqual(parsePlanDays('2026-10-30', now)?.[0], '2026-10-30');
});

test('a day is kept only when it is plannable, named and a move', () => {
  assert.equal(cleanPlanDay('2026-11-01', days, true, days[0]), '2026-11-01');
  assert.equal(cleanPlanDay('2026-11-01', days, false, days[0]), null);
  assert.equal(cleanPlanDay('2026-11-09', days, true, days[0]), null);
  assert.equal(cleanPlanDay(days[0], days, true, days[0]), null);
  assert.equal(cleanPlanDay('2026-11-01', null, true, days[0]), null);
});

test('day words count, ordinary words do not', () => {
  assert.equal(mentionsDay('clean the bathroom on Saturday'), true);
  assert.equal(mentionsDay('move it to tomorrow'), true);
  assert.equal(mentionsDay('this weekend'), true);
  assert.equal(mentionsDay('do the dishes and call mom'), false);
  assert.equal(mentionsDay('the sunscreen and the mondo'), false);
});

test('a change can move a one-off to a later day or back, never a repeat', () => {
  const planned = parseTodoRefs([
    { ref: 't1', title: 'Go to the gym', daypart: 'evening', repeats: true },
    { ref: 't2', title: 'Clean bathroom', daypart: 'start' },
    { ref: 't3', title: 'Mop floors', daypart: 'start', day: '2026-11-01' },
  ]);
  const plan = { days, named: true };
  const changes = normalizeTodoChanges([
    { ref: 't1', action: 'update', day: '2026-11-01', source: 'x' },
    { ref: 't2', action: 'update', day: '2026-10-31', source: 'x' },
    { ref: 't3', action: 'update', day: '2026-10-29', source: 'x' },
  ], planned, always, plan);
  assert.deepEqual(changes, [
    { ref: 't2', action: 'update', day: '2026-10-31' },
    { ref: 't3', action: 'update', day: '2026-10-29' },
  ]);
  assert.deepEqual(normalizeTodoChanges([{ ref: 't2', action: 'update', day: '2026-10-31', source: 'x' }], planned, always, null), []);
  assert.match(todoRefsLine(planned), /t3: "Mop floors" \(start, planned for Sunday 2026-11-01/);
});

test('the plan lists its days by weekday', () => {
  assert.match(planInstruction(days), /2026-10-29 \(Thursday, today\), 2026-10-30 \(Friday, tomorrow\)/);
});
