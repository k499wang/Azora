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
  assert.match(
    home,
    /<HomeRoom\s+room={roomClaim\.room}\s+progress={roomClaim\.progress}/,
  );
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

test('Hotel is reached from Home, never from a tab', () => {
  // A room takes a week to fill, so for the whole of a new user's first week
  // the hotel is one part-furnished room and an outline. That is not worth a
  // quarter of the tab bar, and Home already shows that room. It sits in Home's
  // own top corner instead, over the sky above the room it opens.
  const tabs = read('app/navigation/MainTabs.tsx');
  const root = read('app/navigation/RootNavigator.tsx');
  const home = read('screens/HomeScreen.tsx');
  const tabNames = [...tabs.matchAll(/<Tab\.Screen\s+name="([^"]+)"/g)].map(
    (match) => match[1],
  );

  assert.deepEqual(tabNames, ['Home', 'Explore', 'Heart', 'Profile']);
  assert.doesNotMatch(tabs, /Hotel/);
  assert.match(root, /name="Hotel"/);
  assert.match(root, /name="HotelPreview"/);
  assert.match(home, /<HotelButton floors=/);
});

test('the hotel offers its own way back, and does not spend height on it', () => {
  // Pushed over the tab bar rather than under it, so there is no tab to return
  // by — and a header would take the canvas's height to say so. The button
  // floats over the pyramid instead, like the zoom controls it lines up with.
  const hotel = read('screens/HotelScreen.tsx');

  assert.match(hotel, /<GlassIconButton[^>]*accessibilityLabel="Back"/s);
  assert.match(hotel, /name="chevron-left"/);
  assert.doesNotMatch(hotel, /AppTopBar/);
  assert.match(hotel, /back: \{\s*position: 'absolute'/);
});

test('the hotel avoids native tab-bar overlap without changing its preview', () => {
  const hotel = read('screens/HotelScreen.tsx');
  const productStart = hotel.indexOf('export default function HotelScreen');
  const previewStart = hotel.indexOf('export function HotelPreviewScreen');
  const stylesStart = hotel.indexOf('const styles =', previewStart);
  const product = hotel.slice(productStart, previewStart);
  const preview = hotel.slice(previewStart, stylesStart);

  assert.match(
    hotel,
    /import { SafeAreaView } from 'react-native-screens\/experimental'/,
  );
  assert.match(product, /<SafeAreaView[^>]*edges={{ bottom: true }}/);
  assert.doesNotMatch(preview, /SafeAreaView/);
});

test('the lab flags the room screens and Hotel preview it opens', () => {
  // Without the flag the lab strands you on a screen with no way back.
  const lab = read('screens/RoomLabScreen.tsx');
  for (const route of [
    'RoomDecorate',
    'RoomComplete',
    'HotelPreview',
    'NextRoom',
  ]) {
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
  assert.match(decorate, /navigation\.replace\('NextRoom', route\.params\)/);
  assert.doesNotMatch(complete, /navigation\.navigate\('NextRoom'/);
  assert.match(complete, /navigation\.replace\('NextRoom', route\.params\)/);
});

test('the seventh piece replays on the decorate screen after its write succeeds', () => {
  const decorate = read('screens/RoomDecorateScreen.tsx');
  const complete = read('screens/RoomCompleteScreen.tsx');
  const pick = decorate.slice(
    decorate.indexOf('const pick ='),
    decorate.indexOf('// The seventh piece skips'),
  );

  assert.match(
    decorate,
    /!previewing && progress\.placedCount === ROOM_SLOT_COUNT - 1/,
  );
  assert.match(
    pick,
    /picks: completesRoom\s*\? \{ \.\.\.placedPicks, \[nextSlot\]: optionId \}\s*: placedPicks/,
  );
  assert.match(
    pick,
    /setPlacementRevealDone\(false\);\s*setRoomReplayDone\(false\);\s*setPlacing\(/,
  );
  assert.doesNotMatch(pick, /onSuccess|onError|onSettled/);
  assert.match(
    decorate,
    /const placementAnimationDone =\s*placing\?\.completesRoom === true \|\| placementRevealDone/,
  );
  assert.match(
    decorate,
    /const completedRoomReady =\s*completingRoom && placeDecoration\.isSuccess/,
  );
  assert.match(
    decorate,
    /completedRoomReady && placing != null \? \(\s*<RoomReplay/,
  );
  assert.match(
    decorate,
    /<RoomReplay[\s\S]*?\) : completingRoom \? \(\s*<HexRoom[\s\S]*?picks=\{\{\}\}[\s\S]*?\) : placing != null && !placing\.completesRoom \? \(\s*<PlacementReveal/,
  );
  assert.match(decorate, /onDone=\{\(\) => setRoomReplayDone\(true\)\}/);
  assert.match(decorate, /completingRoom\s*\? roomReplayDone/);
  assert.match(
    decorate,
    /label="Pick a new room"\s*disabled=\{!roomReplayDone\}/,
  );
  assert.match(
    decorate,
    /if \(writeFailed\) \{\s*setPlacing\(null\);\s*setPlacementRevealDone\(false\);\s*Alert\.alert\('Could not place that piece'/,
  );
  assert.doesNotMatch(
    decorate,
    /if \(placing\.completesRoom\) \{\s*navigation\.replace\('RoomComplete'/,
  );
  assert.match(complete, /import RoomReplay from/);
  assert.match(complete, /room != null \? \(\s*<RoomReplay/);
  assert.match(
    complete,
    /\) : \(\s*<HexRoom[\s\S]*?picks=\{\{\}\}/,
  );
  assert.match(
    complete,
    /label="Pick a new room"\s*disabled=\{!replayDone\}/,
  );
});

test('room replay cancels all owned animation and timer work on unmount', () => {
  const replay = read('features/room/RoomReplay.tsx');

  assert.match(replay, /import Animated, \{\s*cancelAnimation,/);
  assert.match(
    replay,
    /return \(\) => \{\s*cancelAnimation\(bloom\);\s*cancelAnimation\(pop\);\s*timers\.forEach\(clearTimeout\);/,
  );
  assert.match(replay, /return \(\) => cancelAnimation\(enter\)/);
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

  // Two screens are absent. The hotel is a full-screen pinchable canvas rather
  // than a still room under a caption, so it carries no title and does not use
  // the shared layout at all — see `HotelScreen`. The next-room picker dropped
  // its title too: `RoomPager` captions every page with that room's own name, so
  // a line above it said the same thing twice. Every screen that does show a
  // title still has to get it from the one place.
  for (const screen of [
    'screens/RoomDecorateScreen.tsx',
    'screens/RoomCompleteScreen.tsx',
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
