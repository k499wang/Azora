import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./profileBootstrapService.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

function harness(timezone, failure = null) {
  let profile = { user_id: 'user', timezone: 'America/Toronto', display_name: 'Ari' };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    Intl: { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: timezone }) }) },
    require: () => ({ requireSupabaseClient: () => ({
      from(table) {
        assert.equal(table, 'profiles');
        return {
          async upsert(values, options) {
            assert.equal(options.onConflict, 'user_id');
            if (!options.ignoreDuplicates && failure == null) profile = { ...profile, ...values };
            return { error: failure };
          },
        };
      },
    }) }),
  });
  return { ensure: exports.ensureUserProfile, profile: () => profile };
}

test('existing profiles follow the device timezone without overwriting user fields', async () => {
  const app = harness('Asia/Taipei');
  await app.ensure('user');
  assert.deepEqual(app.profile(), {
    user_id: 'user', timezone: 'Asia/Taipei', display_name: 'Ari',
  });
  await app.ensure('user');
  assert.equal(app.profile().timezone, 'Asia/Taipei');
});

test('a missing device timezone falls back to UTC', async () => {
  const app = harness(undefined);
  await app.ensure('user');
  assert.equal(app.profile().timezone, 'UTC');
});

test('profile synchronization failures are propagated', async () => {
  const failure = new Error('Profile update failed');
  const app = harness('Asia/Taipei', failure);
  await assert.rejects(app.ensure('user'), (error) => error === failure);
});
