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
 * Both ways into the room loop used to be one-shot: the post-session sheet, and
 * the completion screen that opens the next floor. Closing either — or the app —
 * stranded the loop with no route back, permanently in the case of a full room.
 *
 * `RoomProgressCard` is the standing entry point. These fail if it stops being
 * rendered, or stops covering either state.
 */

test('Home renders the room progress card', () => {
  const home = read('screens/HomeScreen.tsx');
  assert.match(home, /import RoomProgressCard from/);
  assert.match(home, /<RoomProgressCard/);
});

test('Home owns one room claim graph and passes explicit room props', () => {
  const home = read('screens/HomeScreen.tsx');
  const homeRoom = read('features/room/HomeRoom.tsx');
  const progressCard = read('features/room/RoomProgressCard.tsx');
  const startDaily = read('hooks/useStartDaily.ts');

  assert.equal((home.match(/useRoomClaim\(/g) ?? []).length, 1);
  assert.doesNotMatch(home, /useDailiesCompletion/);
  assert.match(home, /<HomeRoom room={roomClaim\.room} progress={roomClaim\.progress}/);
  assert.match(home, /<RoomProgressCard\s+progress={roomClaim\.progress}/);

  for (const source of [homeRoom, progressCard]) {
    assert.doesNotMatch(source, /useRoomClaim|useAuthStore/);
  }
  assert.doesNotMatch(startDaily, /useDailiesCompletion\(/);
  assert.match(startDaily, /dailies: StartDailyTechniques/);
});

test('a claimable piece has a route to the picker', () => {
  const card = read('features/room/RoomProgressCard.tsx');
  assert.match(card, /progress\.canClaim/);
  assert.match(card, /'RoomDecorate'/);
});

test('a full room has a route to choosing the next one', () => {
  const card = read('features/room/RoomProgressCard.tsx');
  assert.match(card, /isComplete/);
  assert.match(card, /'NextRoom'/);
});

test('the room screens only offer a back arrow when opened from the lab', () => {
  // The real flow enters and leaves these one way, so a back arrow would offer
  // an exit the flow has no state for — and the bar itself ate the space above
  // the room. `useOpenedFromLab` is the only thing that may bring it back.
  const layout = read('features/room/RoomScreenLayout.tsx');
  assert.match(layout, /useOpenedFromLab\(\)/);
  assert.match(layout, /fromLab \? \(\s*<AppTopBar showBack/);
});

test('the lab flags the room screens it opens', () => {
  // Without the flag the lab strands you on a screen with no way back.
  const lab = read('screens/RoomLabScreen.tsx');
  for (const route of ['RoomDecorate', 'RoomComplete', 'Hotel', 'NextRoom']) {
    assert.match(lab, new RegExp(`'${route}', \\{ fromLab: true \\}`));
  }
});

test('the completion sheet delegates typed forward navigation to its callers', () => {
  const sheet = read('features/room/DailyCompleteSheet.tsx');
  const guided = read('screens/SessionCompleteScreen.tsx');
  const breathHold = read('screens/ShareableResultScreen.tsx');
  const lab = read('screens/RoomLabScreen.tsx');

  assert.doesNotMatch(sheet, /useNavigation|RootStackNavigationProp/);
  assert.match(sheet, /onChoosePiece: \(\) => void/);
  assert.match(sheet, /onChoosePiece\(\)/);

  for (const result of [guided, breathHold]) {
    assert.match(result, /navigation\.replace\('RoomDecorate'\)/);
    assert.match(result, /onChoosePiece={handleChoosePiece}/);
  }
  assert.match(
    lab,
    /onChoosePiece={[\s\S]*?setSheetVisible\(false\)[\s\S]*?navigate\('RoomDecorate', \{ fromLab: true \}\)/,
  );
});

test('forward room transitions replace and preserve lab params', () => {
  const decorate = read('screens/RoomDecorateScreen.tsx');
  const complete = read('screens/RoomCompleteScreen.tsx');

  assert.doesNotMatch(decorate, /navigation\.navigate\('RoomComplete'/);
  assert.match(decorate, /navigation\.replace\('RoomComplete', route\.params\)/);
  assert.doesNotMatch(complete, /navigation\.navigate\('NextRoom'/);
  assert.match(complete, /navigation\.replace\('NextRoom', route\.params\)/);
});

test('canonical room writes refresh history without blocking on current-room refetches', () => {
  for (const path of [
    'queries/room/usePlaceDecorationMutation.ts',
    'queries/room/useCreateNextRoomMutation.ts',
  ]) {
    const mutation = read(path);
    assert.match(mutation, /queryClient\.setQueryData\(queryKey, currentRoom\)/);
    assert.match(mutation, /void queryClient\.invalidateQueries\(\{/);
    assert.match(mutation, /queryKey: getRoomsQueryKey\(userId\)/);
    assert.doesNotMatch(mutation, /onSuccess: async/);
    assert.doesNotMatch(
      mutation,
      /invalidateQueries\(\{ queryKey, exact: true \}\)/,
    );
  }
});

test('every room screen puts its title in the one shared place', () => {
  // "Congratulations!" was an overlay hung off the top of the stage, so it drew
  // outside the layout — over the top bar, on any screen that has one — and at
  // a different height from every other line these screens show.
  const layout = read('features/room/RoomScreenLayout.tsx');
  assert.match(layout, /function RoomScreenTitle/);
  assert.doesNotMatch(layout, /position: 'absolute'/);

  // The title is the layout's to render, never a screen's — the moment one
  // screen can hand in its own, the heights drift apart again.
  assert.doesNotMatch(layout, /export function RoomScreenTitle/);

  for (const screen of [
    'screens/RoomDecorateScreen.tsx',
    'screens/RoomCompleteScreen.tsx',
    'screens/NextRoomScreen.tsx',
    'screens/HotelScreen.tsx',
  ]) {
    const source = read(screen);
    assert.match(
      source,
      /title=["{]/,
      `${screen} has no title going through the shared layout`,
    );
    assert.doesNotMatch(
      source,
      /typography\.display/,
      `${screen} styles a title of its own; it must use RoomScreenTitle`,
    );
  }
});

test('a held-back title and its button arrive on the same beat', () => {
  // Both entrances come from one helper on one delay. Two screens each timing
  // their own `Rise` is how the congratulation and the Continue button used to
  // land a third of a second apart.
  const layout = read('features/room/RoomScreenLayout.tsx');
  assert.match(layout, /const REVEAL_DELAY =/);
  assert.match(layout, /enter\(<RoomScreenTitle/);
  // The tray is a fragment now — the note above the button rides the same beat.
  assert.match(layout, /const tray =[\s\S]{0,80}enter\(/);

  for (const screen of [
    'screens/RoomDecorateScreen.tsx',
    'screens/RoomCompleteScreen.tsx',
  ]) {
    assert.doesNotMatch(
      read(screen),
      /<Rise/,
      `${screen} times its own entrance; it must pass \`reveal\` instead`,
    );
  }
});

test('__DEV__ still gates the arrow, whatever the param says', () => {
  const hook = read('features/room/useOpenedFromLab.ts');
  assert.match(hook, /__DEV__ && params\?\.fromLab === true/);
});
