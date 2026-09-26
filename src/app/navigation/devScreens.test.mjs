import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..');

function read(relativePath) {
  return readFileSync(join(src, relativePath), 'utf8');
}

/** every source file under `src`, as paths relative to it */
function allSourceFiles(dir = src) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return allSourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [relative(src, path)] : [];
  });
}

/**
 * The room lab is a debug harness: it fakes room progress, replays unlock
 * animations, and exposes internal state. It must never be reachable in a
 * release build.
 *
 * Three independent gates protect it, and these tests fail if any one is
 * removed — a single guard is one careless edit away from shipping.
 */

test('the dev lab and Hotel preview routes are only registered under __DEV__', () => {
  const navigator = read('app/navigation/RootNavigator.tsx');
  const guard = navigator.indexOf('{__DEV__ ? (');

  assert.ok(guard !== -1, 'RootNavigator has no __DEV__ guard at all');
  const guardEnd = navigator.indexOf(') : null}', guard);

  for (const name of ['RoomLab', 'PlanLab', 'HotelPreview']) {
    const route = navigator.indexOf(`name="${name}"`);
    assert.ok(route !== -1, `${name} route is missing`);
    assert.ok(
      guard < route,
      `the ${name} <Stack.Screen> must sit inside the __DEV__ guard`,
    );
    assert.ok(
      route < guardEnd,
      `the ${name} route escaped the __DEV__ guard it used to be inside`,
    );
  }
});

test('the Settings entry points are only rendered under __DEV__', () => {
  const settings = read('screens/SettingsScreen.tsx');
  const guard = settings.indexOf('{__DEV__ ? (');
  const guardEnd = settings.indexOf(') : null}', guard);

  assert.ok(guard !== -1, 'SettingsScreen has no __DEV__ guard at all');

  for (const route of ['RoomLab', 'PlanLab']) {
    const row = settings.indexOf(`navigate('${route}')`);
    assert.ok(row !== -1, `the ${route} row is missing`);
    assert.ok(guard < row, `the ${route} row must sit inside the __DEV__ guard`);
    assert.ok(
      row < guardEnd,
      `the ${route} row escaped the __DEV__ guard it used to be inside`,
    );
  }
});

test('the lab screens refuse to render outside __DEV__', () => {
  for (const file of ['screens/RoomLabScreen.tsx', 'screens/PlanLabScreen.tsx']) {
    const screen = read(file);

    assert.match(screen, /const isDev = __DEV__;/, `${file} no longer reads __DEV__`);
    assert.match(
      screen,
      /if \(!isDev\) \{\s*return null;/,
      `${file} lost its early return for release builds`,
    );
  }
});

test('the room override can never return a value in a release build', () => {
  const override = read('features/room/devRoomOverride.ts');

  assert.match(
    override,
    /function read\(\)[^}]*__DEV__ \? override : null/s,
    'devRoomOverride must gate the read on __DEV__',
  );

  assert.match(
    override,
    /export function setRoomOverride[^}]*if \(!__DEV__\) return;/s,
    'devRoomOverride must also gate the write, so nothing can set it at all',
  );
});

test('the forced day-complete can never fire in a release build', () => {
  const forced = read('features/room/devDayCompleteOverride.ts');

  assert.match(
    forced,
    /export function forceNextDayComplete[^}]*if \(!__DEV__\) return;/s,
    'devDayCompleteOverride must gate the write on __DEV__',
  );
  assert.match(
    forced,
    /export function takeForcedDayComplete[^}]*if \(!__DEV__ \|\| !forced\) return false;/s,
    'devDayCompleteOverride must also gate the read, so nothing can spend it',
  );

  const settings = read('screens/SettingsScreen.tsx');
  const row = settings.indexOf('forceNextDayComplete()');
  assert.ok(
    row > settings.indexOf('{__DEV__ ? ('),
    'the Settings row that arms it must sit inside the __DEV__ block',
  );
});

test('only these files may touch the room override', () => {
  // The read gate makes the override harmless in release; this keeps it from
  // spreading in the first place. A new caller is a deliberate decision, not
  // something that arrives quietly with a feature.
  const allowed = new Set([
    'features/room/devRoomOverride.ts',
    // reads it, so every consumer of the room sees the fake one
    'features/room/useRoomClaim.ts',
    // reads it, so it refuses to write against a fabricated room
    'screens/RoomDecorateScreen.tsx',
    // reads it, so the lab can rehearse the seal on a fabricated full room
    'screens/RoomCompleteScreen.tsx',
    // same reason: this is where the day's piece is written, from whichever
    // screen finished the day
    'features/room/useDailyRewardStage.ts',
    // listens for the lab's replay nudge; it never reads the fake room itself
    'screens/HomeScreen.tsx',
    // reads it, so a rehearsed seal never opens a real next floor
    'features/room/RoomSealFlow.tsx',
    // the only writer
    'screens/RoomLabScreen.tsx',
  ]);

  const callers = allSourceFiles().filter((file) =>
    read(file).includes('devRoomOverride'),
  );

  for (const file of callers) {
    assert.ok(
      allowed.has(file),
      `${file} reaches into dev-only room machinery; add it to the allowlist only if that is intended`,
    );
  }
});

test('the hotel override can never return a value in a release build', () => {
  const override = read('features/room/devHotelOverride.ts');

  assert.match(
    override,
    /function read\(\)[^}]*__DEV__ \? override : null/s,
    'devHotelOverride must gate the read on __DEV__',
  );

  assert.match(
    override,
    /export function setHotelOverride[^}]*if \(!__DEV__\) return;/s,
    'devHotelOverride must also gate the write, so nothing can set it at all',
  );
});

test('only these files may touch the hotel override', () => {
  const allowed = new Set([
    'features/room/devHotelOverride.ts',
    // reads it, so the pyramid can be seen at a size real data cannot reach
    'screens/HotelScreen.tsx',
    // listens for the lab's replay nudge; it never reads the fake room itself
    'screens/HomeScreen.tsx',
    // reads it, so a rehearsed seal never opens a real next floor
    'features/room/RoomSealFlow.tsx',
    // the only writer
    'screens/RoomLabScreen.tsx',
  ]);

  const callers = allSourceFiles().filter((file) =>
    read(file).includes('devHotelOverride'),
  );

  for (const file of callers) {
    assert.ok(
      allowed.has(file),
      `${file} reaches into dev-only hotel machinery; add it to the allowlist only if that is intended`,
    );
  }
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

/**
 * The lab fabricates a room. Everything that would write against a real one has
 * to notice, or a rehearsal leaves real rows behind — a placed decoration, or a
 * whole next floor opened on the user's account.
 */
test('every room write checks the override before it writes', () => {
  const writers = [
    'features/room/useDailyRewardStage.ts',
    'features/room/RoomSealFlow.tsx',
    'screens/RoomDecorateScreen.tsx',
  ];

  for (const file of writers) {
    const source = read(file);
    assert.match(
      source,
      /\.mutate\(/,
      `${file} is listed as a room writer but no longer writes`,
    );
    assert.match(
      source,
      /isRoomOverridden\(\)|previewing/,
      `${file} writes a room without checking for a fabricated one`,
    );
  }
});

test('the lab can never ask the reward flow to replay in a release build', () => {
  const source = read('features/room/devRoomOverride.ts');
  const request = source.slice(source.indexOf('export function requestRewardFlowReplay'));

  assert.match(request.slice(0, 200), /if \(!__DEV__\) return;/);
});

/**
 * `useDevPlanControls` abandons a real enrollment. It is the only way to reach the
 * plan tab's start card on an account that already has a plan, which makes it
 * useful — and it is a write against a real row, which makes it dangerous
 * anywhere it can be tapped by accident.
 *
 * It lives on the settings screen, which unlike the labs is a real screen, so
 * the `__DEV__` block around its row is the only thing keeping it out of a
 * release build. Both halves are checked: who calls it, and that the row stays
 * inside the guard.
 */
test('the dev plan controls are only reachable from the settings dev block', () => {
  const callers = allSourceFiles().filter(
    (file) =>
      file !== 'hooks/useDevPlanControls.ts' && read(file).includes('useDevPlanControls'),
  );

  assert.deepEqual(
    callers,
    ['screens/SettingsScreen.tsx'],
    'useDevPlanControls escaped the settings dev block',
  );
});

test('the plan dev rows sit inside the settings __DEV__ guard', () => {
  const settings = read('screens/SettingsScreen.tsx');
  const guard = settings.indexOf('{__DEV__ ? (');
  const guardEnd = settings.indexOf(') : null}', guard);

  assert.ok(guard !== -1, 'the settings screen has no __DEV__ guard at all');

  for (const label of ['Clear my plan', 'Finish my plan']) {
    const row = settings.indexOf(label);
    assert.ok(row !== -1, `the ${label} row is gone`);
    assert.ok(
      row > guard && row < guardEnd,
      `the ${label} row would ship in a release build`,
    );
  }
});

/**
 * The start card is an ordinary screen component, so the plan lab may draw it
 * but must never be able to start a real plan from a fabricated offer.
 */
test('the plan lab never starts a real enrollment', () => {
  const lab = read('screens/PlanLabScreen.tsx');

  assert.ok(
    !lab.includes('useStartProgramEnrollmentMutation'),
    'the plan lab can write a real enrollment',
  );
});
