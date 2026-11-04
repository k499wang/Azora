import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./walletService.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function loadService(entries) {
  const client = {
    from() {
      const filters = [];
      let inserted = null;
      const builder = {
        select: () => builder,
        eq(key, value) { filters.push([key, value]); return builder; },
        limit: () => builder,
        insert(row) { inserted = { id: `entry-${entries.length}`, created_at: 'now', ...row }; entries.push(inserted); return builder; },
        single: async () => ({ data: inserted, error: null }),
        then: (resolve) => resolve({
          data: entries.filter((row) => filters.every(([key, value]) => row[key] === value)),
          error: null,
        }),
      };
      return builder;
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: () => ({ requireSupabaseClient: () => client }),
  });
  return module.exports;
}

const STEP = { amount: 10, reason: 'routine_run:kitchen-close:do-dishes', localDate: '2026-11-04' };

test('a once-a-day grant pays the first time and nothing more that day', async () => {
  const entries = [];
  const { grantCoinsOncePerDay } = loadService(entries);
  const first = await grantCoinsOncePerDay('user', STEP);
  assert.equal(first.delta, 10);
  assert.equal(await grantCoinsOncePerDay('user', STEP), null);
  assert.equal(entries.length, 1);
});

test('a once-a-day grant pays again on a new day, for another step, and for another user', async () => {
  const entries = [];
  const { grantCoinsOncePerDay } = loadService(entries);
  await grantCoinsOncePerDay('user', STEP);
  assert.equal((await grantCoinsOncePerDay('user', { ...STEP, localDate: '2026-11-05' })).delta, 10);
  assert.equal((await grantCoinsOncePerDay('user', { ...STEP, reason: 'routine_run:kitchen-close:trash' })).delta, 10);
  assert.equal((await grantCoinsOncePerDay('other', STEP)).delta, 10);
  assert.equal(entries.length, 4);
});
