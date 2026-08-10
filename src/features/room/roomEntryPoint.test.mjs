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

test('__DEV__ still gates the arrow, whatever the param says', () => {
  const hook = read('features/room/useOpenedFromLab.ts');
  assert.match(hook, /__DEV__ && params\?\.fromLab === true/);
});
