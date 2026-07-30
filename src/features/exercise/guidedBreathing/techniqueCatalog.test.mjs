import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TECHNIQUE_CATALOG } from './techniqueCatalog.ts';

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../supabase/migrations',
);

const INSERT_BLOCK =
  /insert\s+into\s+public\.breathing_technique_catalog\s*\([^)]*\)\s*values([\s\S]*?);/gi;
const ROW = /\(\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*\)/g;

/**
 * The technique ids the database will actually accept, replayed from the
 * migrations in filename order the way Supabase applies them.
 */
function readMigratedCatalog() {
  const migrated = new Map();

  for (const file of readdirSync(MIGRATIONS_DIR).sort()) {
    if (!file.endsWith('.sql')) continue;

    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    for (const [, values] of sql.matchAll(INSERT_BLOCK)) {
      for (const [, id, displayName] of values.matchAll(ROW)) {
        migrated.set(id, displayName.replace(/''/g, "'"));
      }
    }
  }

  return migrated;
}

test('every client technique id exists in the database catalog', () => {
  const migrated = readMigratedCatalog();
  assert.ok(
    migrated.size > 0,
    'parsed no breathing_technique_catalog rows — the migration parser is broken, not the catalog',
  );

  const missing = TECHNIQUE_CATALOG.filter((entry) => !migrated.has(entry.id)).map(
    (entry) => entry.id,
  );

  assert.deepEqual(
    missing,
    [],
    `techniqueCatalog.ts lists ids with no migration row: ${missing.join(', ')}. ` +
      'Sessions using them are rejected by complete_breathing_session and never persist. ' +
      'Add them in a new supabase/migrations file.',
  );
});

test('the database catalog has no ids the client cannot run', () => {
  const clientIds = new Set(TECHNIQUE_CATALOG.map((entry) => entry.id));
  const orphaned = [...readMigratedCatalog().keys()].filter((id) => !clientIds.has(id));

  assert.deepEqual(
    orphaned,
    [],
    `migrations register ids that techniqueCatalog.ts does not: ${orphaned.join(', ')}`,
  );
});

test('display names match between the client catalog and the migrations', () => {
  const migrated = readMigratedCatalog();
  const mismatched = TECHNIQUE_CATALOG.filter(
    (entry) => migrated.has(entry.id) && migrated.get(entry.id) !== entry.displayName,
  ).map((entry) => `${entry.id}: '${entry.displayName}' vs '${migrated.get(entry.id)}'`);

  assert.deepEqual(mismatched, []);
});

test('technique ids are unique', () => {
  const ids = TECHNIQUE_CATALOG.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
});
