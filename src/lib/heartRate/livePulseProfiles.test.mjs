import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LIVE_PULSE_PROFILES,
  getLivePulseProfile,
} from './livePulseProfiles.ts';

test('continuous monitoring preserves the stable live BPM behavior', () => {
  assert.deepEqual(getLivePulseProfile('continuousMonitoring'), {
    managerBpmProfile: 'stable',
    presentationFilter: 'standard',
    startupPolicy: 'filteredValue',
    publicationPolicy: 'interval',
  });
});

test('exercise profiles preserve the responsive live BPM behavior', () => {
  const expected = {
    managerBpmProfile: 'responsive',
    presentationFilter: 'breathExercise',
    startupPolicy: 'qualifiedManagerSnapshot',
    publicationPolicy: 'freshManagerSnapshot',
  };

  assert.deepEqual(getLivePulseProfile('guidedBreathing'), expected);
  assert.deepEqual(getLivePulseProfile('dailyBreathHold'), expected);
  assert.deepEqual(Object.keys(LIVE_PULSE_PROFILES), [
    'continuousMonitoring',
    'guidedBreathing',
    'dailyBreathHold',
  ]);
});
