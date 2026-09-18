import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildCyclicBreathingPlan } from './breathingSessionPlan.ts';
import {
  getDefaultRoundsOption,
  getRoundsDurationOptions,
} from './roundsDurationOptions.ts';

const pattern = { inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 };

for (const minutes of [4, 5, 8]) {
  test(`a ${minutes}-minute prescription executes that duration instead of default rounds`, () => {
    const options = getRoundsDurationOptions(pattern, minutes);
    const selected = getDefaultRoundsOption(options, 12, minutes);
    const plan = buildCyclicBreathingPlan(pattern, selected.rounds);

    assert.equal(plan.reduce((seconds, phase) => seconds + phase.durationSeconds, 0), minutes * 60);
    assert.equal(selected.label, `${minutes} min`);
    assert.equal(selected.proOnly, true);
    assert.equal(options.filter((option) => option.minutes === minutes).length, 1);
    assert.deepEqual(options.map((option) => option.minutes), [...options.map((option) => option.minutes)].sort((a, b) => a - b));
  });
}

test('prescriptions round to a whole breathing cycle using the picker rule', () => {
  const box = { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 };
  const selected = getDefaultRoundsOption(getRoundsDurationOptions(box, 5), 8, 5);
  assert.equal(selected.rounds, 19);
  assert.equal(selected.rounds * 16, 304);
});

test('legacy and invalid prescriptions retain the closest free default', () => {
  for (const minutes of [undefined, 0, -1, NaN, Infinity]) {
    const options = getRoundsDurationOptions(pattern, minutes);
    assert.deepEqual(options.map((option) => option.minutes), [1, 2, 3, 5, 10]);
    assert.equal(getDefaultRoundsOption(options, 12, minutes).rounds, 12);
    assert.equal(getDefaultRoundsOption(options, 60, minutes).minutes, 3);
  }
});

test('Home carries program minutes through the gated launch into session initialization', () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
  const home = read('../../../../screens/HomeScreen.tsx');
  const launch = read('../../../../hooks/useStartDaily.ts');
  const session = read('../GuidedBreathingSessionScreen.tsx');

  assert.match(home, /startTechnique\(activity\.technique\.id, 'todays_plan_activity', activity\.minutes\)/);
  assert.match(launch, /navigate\('ExerciseSession', \{ techniqueId, durationMinutes \}\)/);
  assert.match(session, /useState\(route\.params\.durationMinutes\)/);
  assert.match(session, /getDefaultRoundsOption\([\s\S]*?initialTechnique\.defaultRounds,\s*prescribedMinutes,/);
});
