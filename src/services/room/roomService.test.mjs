import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as roomProgress from '../../lib/room/roomProgress.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./roomService.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

let nextId = 1;

function fakeSupabase(tables) {
  return {
    from(table) {
      const filters = [];
      let order = null;
      let limit = Infinity;
      const rows = () => {
        let result = tables[table].filter((row) => filters.every(([key, value]) => row[key] === value));
        if (order != null) {
          result = [...result].sort((a, b) =>
            (a[order.key] < b[order.key] ? -1 : 1) * (order.ascending ? 1 : -1));
        }
        return result.slice(0, limit);
      };
      const builder = {
        select: () => builder,
        eq(key, value) { filters.push([key, value]); return builder; },
        order(key, { ascending }) { order = { key, ascending }; return builder; },
        limit(count) { limit = count; return builder; },
        maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
        then: (resolve) => resolve({ data: rows(), error: null }),
        insert(values) {
          const row = { id: `id-${nextId++}`, floor: 1, shell: 'cozy', frame_hue: 'blue', ...values };
          tables[table].push(row);
          return { select: () => ({ single: async () => ({ data: row, error: null }) }), then: (resolve) => resolve({ error: null }) };
        },
      };
      return builder;
    },
  };
}

function load(tables) {
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name.endsWith('/roomProgress')) return roomProgress;
      if (name.endsWith('/supabase')) return { requireSupabaseClient: () => fakeSupabase(tables) };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}

test('the first piece opens floor one and persists in the read-back room', async () => {
  const tables = { rooms: [], room_decorations: [] };
  const room = load(tables);
  const placed = await room.placeDecoration('user', 'day1', 'lamp', '2026-10-05');
  assert.equal(placed.room.floor, 1);
  assert.deepEqual(placed.room.decorations.map((d) => d.optionId), ['lamp']);
  assert.equal(placed.lastEarnedLocalDate, '2026-10-05');
  const reread = await room.getCurrentRoom('user');
  assert.deepEqual(reread.room.decorations.map((d) => d.slot), ['day1']);
});

test('a stale screen cannot place a second piece on the same day', async () => {
  const tables = { rooms: [], room_decorations: [] };
  const room = load(tables);
  await room.placeDecoration('user', 'day1', 'lamp', '2026-10-05');
  await assert.rejects(room.placeDecoration('user', 'day2', 'rug', '2026-10-05'), /already earned/);
  assert.equal(tables.room_decorations.length, 1);
  await room.placeDecoration('user', 'day2', 'rug', '2026-10-06');
  assert.equal(tables.room_decorations.length, 2);
});

test('a full room opens the next floor with the chosen look and the new day fills it', async () => {
  const tables = { rooms: [], room_decorations: [] };
  const room = load(tables);
  for (let day = 1; day <= 7; day += 1) {
    await room.placeDecoration('user', `day${day}`, `piece-${day}`, `2026-10-0${day}`);
  }
  await assert.rejects(room.placeDecoration('user', 'day1', 'extra', '2026-10-08'), /room is full/);
  const next = await room.createNextRoom('user', { shell: 'attic', frameHue: 'amber' });
  assert.equal(next.room.floor, 2);
  assert.equal(next.room.shell, 'attic');
  await assert.rejects(room.placeDecoration('user', 'day1', 'same-day', '2026-10-07'), /already earned/);
  const placed = await room.placeDecoration('user', 'day1', 'fresh', '2026-10-08');
  assert.equal(placed.room.floor, 2);
  assert.deepEqual(placed.room.decorations.map((d) => d.optionId), ['fresh']);
  const hotel = await room.getRooms('user');
  assert.deepEqual(hotel.map((r) => [r.floor, r.decorations.length]), [[1, 7], [2, 1]]);
});

test('an unfinished room cannot be rolled over', async () => {
  const tables = { rooms: [], room_decorations: [] };
  const room = load(tables);
  await room.placeDecoration('user', 'day1', 'lamp', '2026-10-05');
  await assert.rejects(room.createNextRoom('user', { shell: 'attic', frameHue: 'amber' }), /until this room is full/);
});
