import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('./HomeScreen.tsx', import.meta.url), 'utf8');
const helpers = source.slice(source.indexOf('function withPlanAccess'), source.indexOf('export default function HomeScreen'));
const exports = {};
vm.runInNewContext(ts.transpileModule(helpers + '\nexport { withPlanAccess };', {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const onPress = () => {};
const upgrade = () => {};

test('Home keeps plan rows neutral and disabled while entitlement is loading', () => {
  const rows = { exercise: { title: 'Reset', completed: false, locked: true, onPress } };
  const pending = exports.withPlanAccess(rows, upgrade, true).exercise;
  assert.equal(pending.title, 'Reset');
  assert.equal(pending.loading, true);
  assert.equal(pending.locked, false);
  assert.equal(pending.onPress, onPress);
  assert.equal(rows.exercise.locked, true);
});

test('resolved free access gates only unfinished rows without changing completed actions', () => {
  const rows = {
    exercise: { completed: false, locked: false, onPress },
    lesson: { completed: true, locked: false, onPress },
  };
  const gated = exports.withPlanAccess(rows, upgrade, false);
  assert.equal(gated.exercise.locked, true);
  assert.equal(gated.exercise.onPress, upgrade);
  assert.equal(gated.lesson.locked, false);
  assert.equal(gated.lesson.onPress, onPress);
});
