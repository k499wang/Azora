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
  assert.match(home, /<RoomProgressCard \/>/);
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
  assert.match(layout, /enter\(action\)/);

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
