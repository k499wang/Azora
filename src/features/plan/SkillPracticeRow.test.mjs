import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.createSourceFile('SkillPracticeRow.tsx', readFileSync(new URL('./SkillPracticeRow.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const resultFunction = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === 'skillPracticeResult');
const compiled = ts.transpileModule(resultFunction.getText(source), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
vm.runInNewContext(compiled, { exports });
const { skillPracticeResult } = exports;

test('explicit helpfulness takes precedence over the way a skill was tried', () => {
  for (const response of ['tried', 'adapted']) {
    assert.equal(skillPracticeResult({ response, helpful: true }), 'Helpful');
    assert.equal(skillPracticeResult({ response, helpful: false }), 'Not helpful yet');
  }
});

test('unrated practice keeps its tried or adapted context without implying a rating', () => {
  assert.equal(skillPracticeResult({ response: 'tried', helpful: null }), 'Tried · Not rated');
  assert.equal(skillPracticeResult({ response: 'adapted', helpful: null }), 'Adapted to fit · Not rated');
});
