import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { QueryClient, MutationObserver } from '@tanstack/react-query';

function load(file, service) {
  const compiled = ts.transpileModule(
    readFileSync(new URL(file, import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === '@tanstack/react-query') return {
        useQueryClient: () => client,
        useMutation: (options) => new MutationObserver(client, options),
      };
      if (name.endsWith('/roomService')) return service;
      if (name.endsWith('/useCurrentRoomQuery')) return { getCurrentRoomQueryKey: (id) => ['current-room', id] };
      if (name.endsWith('/useRoomsQuery')) return { getRoomsQueryKey: (id) => ['rooms', id] };
      if (name.endsWith('/useRoomInventoryQuery')) return { getRoomInventoryQueryKey: (id) => ['room-inventory', id] };
      if (name.endsWith('/useDayHistoryQuery')) return { getDayHistoryQueryKeyPrefix: (id) => ['day-history', id] };
      if (name.endsWith('/useUserEntitlementQuery')) return { resolveUserIsPro: async () => false };
      if (name.endsWith('/analytics/room')) return {
        trackRoomCompleted() {}, trackRoomDecorationPlaced() {}, trackRoomStarted() {},
      };
      if (name.endsWith('/roomProgress')) return { ROOM_SLOT_COUNT: 7 };
      if (name.endsWith('/authStore')) return { useAuthStore: { getState: () => ({ user: { id: 'user' } }) } };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return { client, exports };
}

function seed(client) {
  const stale = { room: { id: 'r1', floor: 1, decorations: [] }, lastEarnedLocalDate: null };
  for (const key of [['current-room', 'user'], ['rooms', 'user'], ['room-inventory', 'user'], ['day-history', 'user', '2026-10-06']]) {
    client.setQueryData(key, key[0] === 'current-room' ? stale : []);
  }
}

const invalidated = (client, key) => client.getQueryState(key).isInvalidated;

test('a placed piece shows in the room at once and refreshes the hotel, inventory and history', async () => {
  const placed = {
    room: { id: 'r1', floor: 1, decorations: [{ slot: 'day1', optionId: 'lamp', earnedLocalDate: '2026-10-06' }] },
    lastEarnedLocalDate: '2026-10-06',
  };
  const { client, exports } = load('./usePlaceDecorationMutation.ts', { placeDecoration: async () => placed });
  seed(client);
  await exports.usePlaceDecorationMutation('user')
    .mutate({ slot: 'day1', optionId: 'lamp', earnedLocalDate: '2026-10-06' });
  assert.deepEqual(client.getQueryData(['current-room', 'user']), placed);
  assert.equal(invalidated(client, ['current-room', 'user']), false);
  assert.equal(invalidated(client, ['rooms', 'user']), true);
  assert.equal(invalidated(client, ['room-inventory', 'user']), true);
  assert.equal(invalidated(client, ['day-history', 'user', '2026-10-06']), true);
});

test('a refused or lost placement re-reads the room instead of offering the piece again', async () => {
  const { client, exports } = load('./usePlaceDecorationMutation.ts', {
    placeDecoration: async () => { throw new Error('A piece was already earned on 2026-10-06.'); },
  });
  seed(client);
  await assert.rejects(exports.usePlaceDecorationMutation('user')
    .mutate({ slot: 'day1', optionId: 'lamp', earnedLocalDate: '2026-10-06' }));
  assert.equal(invalidated(client, ['current-room', 'user']), true);
});

test('opening the next room swaps the current room and refreshes the hotel and inventory', async () => {
  const next = { room: { id: 'r2', floor: 2, shell: 'attic', frameHue: 'amber', decorations: [] }, lastEarnedLocalDate: '2026-10-06' };
  const { client, exports } = load('./useCreateNextRoomMutation.ts', { createNextRoom: async () => next });
  seed(client);
  await exports.useCreateNextRoomMutation('user').mutate({ shell: 'attic', frameHue: 'amber' });
  assert.deepEqual(client.getQueryData(['current-room', 'user']), next);
  assert.equal(invalidated(client, ['rooms', 'user']), true);
  assert.equal(invalidated(client, ['room-inventory', 'user']), true);
});
