import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as exerciseSearch from '../../lib/exerciseSearch.ts';
import { requireAttentionDelivery } from '../../features/program/domain/attentionActivities.ts';

// `techniques.ts` loads image assets through Metro's `require`, which no Node
// test can execute, so the catalogue is compiled and run against an empty one.
function loadCatalog() {
  const source = readFileSync(new URL('./exerciseCatalog.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: (name) => {
      if (name.endsWith('/techniques')) return { default: [], __esModule: true };
      if (name.endsWith('/exerciseSearch')) return exerciseSearch;
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return module.exports;
}

const { searchAttentionResets } = loadCatalog();

const ids = (query, filter) =>
  Array.from(searchAttentionResets(query, filter), (entry) => entry.activityId);

test('search finds the guided attention Resets by the words people use', () => {
  for (const query of ['grounding', '5-4-3-2-1', 'Come back']) {
    assert.deepEqual(ids(query), ['attention.54321.2'], query);
  }
  for (const query of ['muscle', 'relax', 'tense', 'Tension']) {
    assert.deepEqual(ids(query), ['attention.muscle-release.2'], query);
  }
  assert.deepEqual(ids('box breathing'), []);
});

test('an empty search shows them only under their own category chip', () => {
  assert.deepEqual(ids(''), []);
  assert.deepEqual(ids('', 'calm'), ['attention.54321.2']);
  assert.deepEqual(ids('', 'sleep'), ['attention.muscle-release.2']);
  assert.deepEqual(ids('muscle', 'calm'), []);
});

test('every searchable attention Reset is a real attention activity', () => {
  for (const entry of searchAttentionResets('', 'calm').concat(searchAttentionResets('', 'sleep'))) {
    assert.equal(requireAttentionDelivery(entry.activityId).modality, 'attention');
  }
  assert.throws(() => requireAttentionDelivery('breathing.box.4'));
});
