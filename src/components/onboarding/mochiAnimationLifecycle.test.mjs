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

  assert.match(onboardingBranch, /<AmbientBackground \/>/);
  assert.match(onboardingBranch, /<OnboardingFlow/);
  assert.doesNotMatch(onboardingBranch, /<AppStack/);
});

test('the rich Mochi sequence owns one replay pause across all three steps', () => {
  const flow = read('components/onboarding/OnboardingFlow.tsx');

  for (const step of ['mochiPlace', 'mochiFloor', 'mochiRooms']) {
    assert.match(flow, new RegExp(`MOCHI_ANIMATION_STEPS[\\s\\S]*?'${step}'`));
  }
  assert.match(
    flow,
    /pauseSessionReplay\(\{[\s\S]*?autoResumeAfterMs: null,[\s\S]*?\}\)/,
  );
  assert.match(flow, /const mochiReplayReleaseRef = useRef/);
  assert.match(flow, /if \(mochiReplayReleaseRef\.current != null\) return/);
  assert.match(flow, /mochiReplayReleaseRef\.current = null;\s*release\?\.\(\)/);
  assert.match(
    flow,
    /useEffect\(\(\) => \{\s*if \(!isMochiAnimationSequence\) \{\s*releaseMochiReplayPause\(\)/,
  );
  assert.match(
    flow,
    /useEffect\(\(\) => releaseMochiReplayPause, \[releaseMochiReplayPause\]\)/,
  );

  const transition = flow.slice(
    flow.indexOf('const goToStep ='),
    flow.indexOf('useEffect(() => {', flow.indexOf('const goToStep =')),
  );
  const pauseIndex = transition.indexOf('ensureMochiReplayPaused()');
  const commitIndex = transition.indexOf('setStep(nextStep)');
  assert.notEqual(pauseIndex, -1);
  assert.notEqual(commitIndex, -1);
  assert.ok(pauseIndex < commitIndex);
});

test('placement and floor replay have one entrance owner', () => {
  const place = read('components/onboarding/screens/MochiPlaceScreen.tsx');
  const floor = read('components/onboarding/screens/MochiFloorScreen.tsx');

  for (const screen of [place, floor]) {
    // The layout entrance stays on, so these two arrive like every other step
    // in the flow; the reveal owns only the pieces dropping in.
    assert.doesNotMatch(screen, /disableEntranceAnimation/);
    assert.match(screen, /animateEntrance=\{false\}/);
  }

  assert.doesNotMatch(place, /import \{ HexRoom \}/);
  assert.match(place, /<PlacementReveal/);
  assert.doesNotMatch(place, /placed \? room : reveal/);
});

test('Mochi animation owners stop work when hidden or unmounted', () => {
  const stage = read('components/onboarding/MochiStage.tsx');
  const blob = read('features/room/RoomBlob.tsx');
  const placement = read('features/room/PlacementReveal.tsx');

  assert.match(stage, /return \(\) => cancelAnimation\(enter\)/);
  assert.match(blob, /useWhileVisible\(\(\) => \{/);
  assert.doesNotMatch(blob, /useFocusEffect/);
  for (const value of ['fall', 'squash', 'kick', 'burst']) {
    assert.match(placement, new RegExp(`cancelAnimation\\(${value}\\)`));
  }
});

test('room sequences construct only the artwork needed for the current beat', () => {
  const replay = read('features/room/RoomReplay.tsx');
  const rooms = read('components/onboarding/screens/MochiRoomsScreen.tsx');

  assert.doesNotMatch(replay, /visiblePieceCount/);
  assert.match(replay, /order\.map\(\(day, index\) =>/);
  assert.match(replay, /delayMs=\{START_MS \+ index \* STAGGER_MS\}/);
  assert.match(replay, /setTimeout\(\(\) => setVisible\(true\), delayMs\)/);
  assert.match(replay, /if \(!visible\) return null/);
  assert.match(rooms, /useWhileVisible\(\(\) => \{/);
  assert.match(
    rooms,
    /roomIndex === index \|\| roomIndex === sourceIndex/,
  );
  assert.match(rooms, /\{isMounted \? \(\s*<HexRoom/);
});
