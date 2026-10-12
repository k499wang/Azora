import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..');

function read(relativePath) {
  return readFileSync(join(src, relativePath), 'utf8');
}

test('onboarding does not mount the app stack behind its animation work', () => {
  const root = read('app/navigation/RootNavigator.tsx');
  const onboardingBranch = root.slice(
    root.indexOf('function OnboardingRoot'),
    root.indexOf('export function RootNavigator'),
  );

  assert.match(onboardingBranch, /<OnboardingSurface>/);
  assert.match(read('components/onboarding/OnboardingSurface.tsx'), /<AmbientBackground \/>/);
  assert.match(onboardingBranch, /<OnboardingFlow/);
  assert.doesNotMatch(onboardingBranch, /<AppStack/);
});

test('room animation owners stop work when hidden or unmounted', () => {
  const blob = read('features/room/RoomBlob.tsx');
  const placement = read('features/room/PlacementReveal.tsx');

  assert.match(blob, /useWhileVisible\(\(\) => \{/);
  assert.doesNotMatch(blob, /useFocusEffect/);
  for (const value of ['fall', 'squash', 'kick', 'burst']) {
    assert.match(placement, new RegExp(`cancelAnimation\\(${value}\\)`));
  }
});

test('room sequences construct only the artwork needed for the current beat', () => {
  const replay = read('features/room/RoomReplay.tsx');

  assert.doesNotMatch(replay, /visiblePieceCount/);
  assert.match(replay, /order\.map\(\(day\) =>/);
  // Painted in `order` (back to front), revealed on `earned` (day 1 to day 7).
  // Two orders, on purpose — see RoomReplay.
  assert.match(
    replay,
    /delayMs=\{START_MS \+ earned\.indexOf\(day\) \* STAGGER_MS\}/,
  );
  assert.match(replay, /setTimeout\(\(\) => setVisible\(true\), delayMs\)/);
  assert.match(replay, /if \(!visible\) return null/);
});
