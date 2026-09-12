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

test('a claimable piece opens the reward stage, not a screen', () => {
  // The standing entry point has to reach the same flow the celebration does.
  // A route here was how the card quietly kept the old picker alive after
  // every other way in had moved.
  const card = read('features/room/RoomProgressCard.tsx');
  const home = read('screens/HomeScreen.tsx');

  assert.match(card, /progress\.canClaim/);
  assert.doesNotMatch(card, /'RoomDecorate'/);
  assert.match(card, /kind: 'claim'/);
  assert.match(home, /onClaim={\(\) => reward\.open\(\)}/);
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

test('Home heart action opens the heart statistics screen', () => {
  const tabs = read('app/navigation/MainTabs.tsx');
  const root = read('app/navigation/RootNavigator.tsx');
  const home = read('screens/HomeScreen.tsx');
  const tabNames = [...tabs.matchAll(/<Tab\.Screen\s+name="([^"]+)"/g)].map(
    (match) => match[1],
  );

  assert.deepEqual(tabNames, ['Home', 'Hotel', 'Explore', 'Profile']);
  assert.doesNotMatch(tabs, /name="Heart"/);
  assert.match(root, /name="Heart"/);
  assert.match(root, /name="HeartRate"/);
  assert.match(home, /accessibilityLabel="Open heart statistics"/);
  assert.match(home, /navigation\.navigate\('Heart'\)/);
  assert.match(home, /<Icon name="heart"/);
});

test('Hotel is a main tab and no longer appears in Home shortcuts', () => {
  const tabs = read('app/navigation/MainTabs.tsx');
  const root = read('app/navigation/RootNavigator.tsx');
  const home = read('screens/HomeScreen.tsx');
  const tabNames = [...tabs.matchAll(/<Tab\.Screen\s+name="([^"]+)"/g)].map(
    (match) => match[1],
  );

  assert.deepEqual(tabNames, ['Home', 'Hotel', 'Explore', 'Profile']);
  assert.match(tabs, /name="Hotel"/);
  assert.doesNotMatch(root, /name="Hotel"/);
  assert.match(root, /name="HotelPreview"/);
  assert.doesNotMatch(home, /<HotelButton floors=/);
  assert.doesNotMatch(home, /useTourTarget\('hotel'\)/);
});

test('only the Hotel lab preview renders a back button', () => {
  const hotel = read('screens/HotelScreen.tsx');
  const productStart = hotel.indexOf('export default function HotelScreen');
  const previewStart = hotel.indexOf('export function HotelPreviewScreen');
  const stylesStart = hotel.indexOf('const styles =', previewStart);
  const product = hotel.slice(productStart, previewStart);
  const preview = hotel.slice(previewStart, stylesStart);

  assert.match(hotel, /<Pressable[^>]*accessibilityLabel="Back"/s);
  assert.match(hotel, /name="chevron-left"/);
  assert.doesNotMatch(hotel, /AppTopBar/);
  assert.match(hotel, /back: \{\s*position: 'absolute'/);
  assert.match(product, /<HotelContent \/>/);
  assert.match(preview, /<HotelContent onBack=/);
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

  // The reward opens where the day was finished. Replacing the result screen
  // with the decorate screen was a navigation in the middle of a reward, and
  // it left a session and a to-do running two different flows.
  const home = read('screens/HomeScreen.tsx');
  for (const caller of [guided, breathHold, home]) {
    assert.doesNotMatch(caller, /navigation\.replace\('RoomDecorate'\)/);
    assert.match(caller, /reward\.open\(\{ handOver: true \}\)/);
    assert.match(caller, /onChoosePiece={handleChoosePiece}/);
    // The celebration and the stage are content of one presentation; two
    // native modals cannot hand over without one tearing the other down.
    assert.match(caller, /<DailyRewardSurface visible=/);
    assert.match(caller, /<DailyCompleteSheet\s*\n\s*hosted/);
    assert.match(caller, /<DailyRewardFlow\s*\n\s*hosted/);
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
  // The seal goes nowhere. Choosing the next room is a second question on the
  // same surface, and the surface is the reward's, not a screen of its own.
  const seal = read('features/room/RoomSealFlow.tsx');
  assert.doesNotMatch(complete, /'NextRoom'/);
  assert.doesNotMatch(seal, /'NextRoom'|useNavigation/);
  assert.match(seal, /setPhase\('picking'\)/);
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
  // One ending, wherever it is played from: the reward surface draws this, and
  // the route is a wrapper for the callers that arrive without a surface.
  const seal = read('features/room/RoomSealFlow.tsx');
  assert.match(complete, /<RoomSealFlow/);
  assert.doesNotMatch(complete, /<RoomReplay|<RoomPager/);
  assert.match(seal, /import RoomReplay from/);
  assert.match(seal, /picks != null && room != null \? \(\s*<RoomReplay/);
  assert.match(seal, /\) : \(\s*<HexRoom[\s\S]*?picks=\{\{\}\}/);
  // The button holds only while a replay is actually coming; a room that will
  // never replay must not strand the user with nothing to press.
  assert.match(seal, /const ready = picking \|\| replayDone/);
  assert.match(seal, /disabled=\{picking \? createNextRoom\.isPending \|\| leaving : !ready\}/);
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

  // Three screens are absent. The hotel is a full-screen pinchable canvas
  // rather than a still room under a caption, so it carries no title and does
  // not use the shared layout at all — see `HotelScreen`. The next-room picker
  // dropped its title too: `RoomPager` captions every page with that room's own
  // name, so a line above it said the same thing twice. And the seal is drawn
  // on the reward's surface rather than as a room screen, so its words belong
  // to that field — see `RoomSealFlow`. Every screen that does show a title
  // still has to get it from the one place.
  for (const screen of ['screens/RoomDecorateScreen.tsx']) {
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
  assert.match(layout, /enter\(\s*<RoomScreenTitle/);
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

/**
 * The room never cuts. It arrives from the stage, stands still while the week
 * replays and the next one is chosen, and then takes its place on Home — one
 * continuous object across what used to be three screens.
 */
test('the room chosen at the seal travels into Home rather than cutting', () => {
  const seal = read('features/room/RoomSealFlow.tsx');

  assert.match(seal, /origin\?: RewardFlowOrigin \| null/);
  assert.match(seal, /onSuccess: toHome/);
  assert.match(seal, /origin\.width \/ roomWidth/);

  const home = read('screens/HomeScreen.tsx');
  assert.match(home, /<RoomSealFlow[\s\S]*?origin=\{roomOrigin\}/);
});

test('only the room is inside the thing that flies to Home', () => {
  const seal = read('features/room/RoomSealFlow.tsx');

  // The pager's name and dots are drawn in the tray, so the moving box holds
  // rooms and nothing else.
  assert.match(seal, /chrome=\{false\}/);
  assert.match(seal, /<PagerDots/);
});
