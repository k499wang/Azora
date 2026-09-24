import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const placement = readFileSync(new URL('./useHeartRatePlacementFlow.ts', import.meta.url), 'utf8');
const guided = readFileSync(
  new URL('../../guidedBreathing/GuidedBreathingSessionScreen.tsx', import.meta.url),
  'utf8',
);

test('a refused camera cannot loop the start button', () => {
  // All three ways placement can refuse route through one callback.
  assert.equal((placement.match(/onHeartRateDisabled\(\);/g) ?? []).length, 3);

  // Which must clear the stored preference: the start decision reads it, and a
  // repeat permission request never reaches the user, so leaving it on means
  // every further press raises the same alert and starts nothing.
  assert.match(
    guided,
    /onHeartRateDisabled: \(\) => \{\s*setHeartRateMonitoringEnabled\(false\);\s*setHrEnabled\(false\);/,
    'guided leaves the preference on',
  );
});
