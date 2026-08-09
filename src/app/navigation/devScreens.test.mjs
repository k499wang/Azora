import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..');

function read(relativePath) {
  return readFileSync(join(src, relativePath), 'utf8');
}

/**
 * The room lab is a debug harness: it fakes room progress, replays unlock
 * animations, and exposes internal state. It must never be reachable in a
 * release build.
 *
 * Three independent gates protect it, and these tests fail if any one is
 * removed — a single guard is one careless edit away from shipping.
 */

test('the RoomLab route is only registered under __DEV__', () => {
  const navigator = read('app/navigation/RootNavigator.tsx');
  const guard = navigator.indexOf('{__DEV__ ? (');
  const route = navigator.indexOf('name="RoomLab"');

  assert.ok(guard !== -1, 'RootNavigator has no __DEV__ guard at all');
  assert.ok(route !== -1, 'RoomLab route is missing');
  assert.ok(
    guard < route,
    'the RoomLab <Stack.Screen> must sit inside the __DEV__ guard',
  );

  const guardEnd = navigator.indexOf(') : null}', guard);
  assert.ok(
    route < guardEnd,
    'the RoomLab route escaped the __DEV__ guard it used to be inside',
  );
});

test('the Settings entry point is only rendered under __DEV__', () => {
  const settings = read('screens/SettingsScreen.tsx');
  const guard = settings.indexOf('{__DEV__ ? (');
  const row = settings.indexOf("navigate('RoomLab')");

  assert.ok(guard !== -1, 'SettingsScreen has no __DEV__ guard at all');
  assert.ok(row !== -1, 'the Room lab row is missing');
  assert.ok(guard < row, 'the Room lab row must sit inside the __DEV__ guard');

  const guardEnd = settings.indexOf(') : null}', guard);
  assert.ok(
    row < guardEnd,
    'the Room lab row escaped the __DEV__ guard it used to be inside',
  );
});

test('the lab screen refuses to render outside __DEV__', () => {
  const screen = read('screens/RoomLabScreen.tsx');

  assert.match(
    screen,
    /const isDev = __DEV__;/,
    'RoomLabScreen no longer reads __DEV__',
  );
  assert.match(
    screen,
    /if \(!isDev\) \{\s*return null;/,
    'RoomLabScreen lost its early return for release builds',
  );
});

test('the room override can never return a value in a release build', () => {
  const override = read('features/room/devRoomOverride.ts');

  assert.match(
    override,
    /function read\(\)[^}]*__DEV__ \? override : null/s,
    'devRoomOverride must gate the read on __DEV__, not the write',
  );
});

test('nothing outside the lab and its gates references the lab route', () => {
  const allowed = new Set([
    'app/navigation/RootNavigator.tsx',
    'app/navigation/types.ts',
    'app/navigation/index.ts',
    'screens/SettingsScreen.tsx',
    'screens/RoomLabScreen.tsx',
  ]);

  const files = [
    'screens/HomeScreen.tsx',
    'screens/RoomDecorateScreen.tsx',
    'screens/RoomCompleteScreen.tsx',
    'screens/HotelScreen.tsx',
    'screens/NextRoomScreen.tsx',
    'features/room/HomeRoom.tsx',
    'features/room/DailyCompleteSheet.tsx',
  ];

  // The override is dev-only machinery; only the hook and the lab may set it.
  const overrideCallers = ['features/room/useRoomClaim.ts'];
  for (const file of overrideCallers) {
    assert.ok(
      !read(file).includes('setRoomOverride'),
      `${file} must read the override, never set it`,
    );
  }

  for (const file of files) {
    assert.ok(!allowed.has(file));
    assert.ok(
      !read(file).includes('RoomLab'),
      `${file} links to the dev lab; it would ship a route into a release build`,
    );
  }
});
