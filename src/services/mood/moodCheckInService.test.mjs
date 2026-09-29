import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('./moodCheckInService.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

const BASE = ['id', 'user_id', 'local_date', 'scale_revision', 'answers', 'score', 'created_at'];
const WITH_CONTEXT = [...BASE, 'tags', 'note'];
const CURRENT = [...WITH_CONTEXT, 'feeling'];

const domain = {
  MOOD_SCALE_REVISION: 1,
  moodScore: () => 50,
  sanitizeMoodAnswers: (value) => value,
  sanitizeMoodNote: (value) => (typeof value === 'string' ? value : null),
  sanitizeMoodTags: (value) => (Array.isArray(value) ? value : []),
  sanitizeMoodFeeling: (value) => (typeof value === 'string' ? value : null),
};

/**
 * A PostgREST stand-in for one backend version: it knows only `columns`, and
 * rejects a write or read naming any other the way the real one does.
 */
function backend(columns, rows = []) {
  const missing = (names) => names.find((name) => !columns.includes(name));
  const picked = (row, list) =>
    Object.fromEntries(list.split(',').map((name) => name.trim()).map((name) => [name, row[name]]));

  function from() {
    let filters = [];
    let payload = null;
    const query = {
      upsert(values) { payload = values; return query; },
      select(list) { query.list = list; return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      order() { return query; },
      limit() { return query.run(true); },
      maybeSingle() { return query.run(false); },
      single() { return query.run(false); },
      async run(many) {
        const requested = query.list.split(',').map((name) => name.trim());
        if (payload != null) {
          if (missing(Object.keys(payload)) != null) return { data: null, error: { code: 'PGRST204' } };
          if (missing(requested) != null) return { data: null, error: { code: '42703' } };
          const existing = rows.find(
            (row) => row.user_id === payload.user_id && row.local_date === payload.local_date,
          );
          const saved = existing ?? { id: `row-${rows.length}`, created_at: 'now' };
          Object.assign(saved, payload);
          if (existing == null) rows.push(saved);
          return { data: picked(saved, query.list), error: null };
        }
        if (missing(requested) != null) return { data: null, error: { code: '42703' } };
        const found = rows
          .filter((row) => filters.every(([key, value]) => row[key] === value))
          .map((row) => picked(row, query.list));
        return { data: many ? found : found[0] ?? null, error: null };
      },
    };
    return query;
  }

  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === '../supabase') return { requireSupabaseClient: () => ({ from }) };
      return domain;
    },
  });
  return { service: exports, rows };
}

const input = {
  userId: 'user-1',
  localDate: '2026-09-29',
  answers: { overall: 2, energy: 4, sleep: 3 },
  tags: ['work'],
  note: 'Long day',
  feeling: 'anxious',
};

test('a current backend stores the feeling with the tags and note', async () => {
  const { service, rows } = backend(CURRENT);
  const saved = await service.saveMoodCheckIn(input);
  assert.equal(saved.feeling, 'anxious');
  assert.deepEqual(saved.tags, ['work']);
  assert.equal(rows[0].feeling, 'anxious');
});

test('a backend without the feeling column still saves the tags and note', async () => {
  const { service, rows } = backend(WITH_CONTEXT);
  const saved = await service.saveMoodCheckIn(input);
  assert.equal(saved.feeling, null);
  assert.deepEqual(saved.tags, ['work']);
  assert.equal(saved.note, 'Long day');
  assert.equal('feeling' in rows[0], false);
});

test('a backend from before tags still saves the ratings', async () => {
  const { service, rows } = backend(BASE);
  const saved = await service.saveMoodCheckIn(input);
  assert.deepEqual(saved.answers, input.answers);
  assert.deepEqual(saved.tags, []);
  assert.equal(saved.feeling, null);
  assert.equal('tags' in rows[0], false);
});

test('every backend version reads its rows back', async () => {
  for (const columns of [CURRENT, WITH_CONTEXT, BASE]) {
    const { service } = backend(columns);
    await service.saveMoodCheckIn(input);
    const today = await service.getMoodCheckIn('user-1', '2026-09-29');
    assert.equal(today.available, true);
    assert.deepEqual(today.checkIn.answers, input.answers);
    const recent = await service.getRecentMoodCheckIns('user-1', 62);
    assert.equal(recent.length, 1);
  }
});

test('a row written before feelings existed reads as no feeling', async () => {
  const { service } = backend(CURRENT, [{
    id: 'old', user_id: 'user-1', local_date: '2026-09-20', scale_revision: 1,
    answers: { overall: 3, energy: 3, sleep: 3 }, score: 50, tags: [], note: null,
    feeling: null, created_at: 'then',
  }]);
  const state = await service.getMoodCheckIn('user-1', '2026-09-20');
  assert.equal(state.checkIn.feeling, null);
});
