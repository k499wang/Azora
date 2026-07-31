import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GENERAL_DAYTIME_POOL_V1,
  buildSevenDayExercisePlan,
  resolveDailyExerciseTechniqueId,
  sanitizeDailyPlanExercises,
} from './dailyExercisePlan.ts';

const INPUT = {
  userId: 'user-alpha',
  primaryTechniqueId: 'box',
  startsOn: '2026-07-30',
};

test('builds a deterministic seven-day plan of unique daytime techniques', () => {
  const first = buildSevenDayExercisePlan(INPUT);
  const second = buildSevenDayExercisePlan(INPUT);

  assert.deepEqual(first, second);
  assert.equal(first.techniqueIds.length, 7);
  assert.equal(new Set(first.techniqueIds).size, 7);
  assert.ok(first.techniqueIds.every((id) => GENERAL_DAYTIME_POOL_V1.includes(id)));
  assert.ok(!first.techniqueIds.includes('box'));
});

test('the daytime pool excludes sleep, morning-only, and intense techniques', () => {
  const forbidden = [
    '478',
    'night-settle',
    'sleep-descent',
    'morning-charge',
    'wimhof',
    'bhastrika',
    'deep-box',
  ];

  for (const id of forbidden) {
    assert.ok(!GENERAL_DAYTIME_POOL_V1.includes(id));
  }
});

test('different users can receive different plan ordering', () => {
  const first = buildSevenDayExercisePlan(INPUT);
  const second = buildSevenDayExercisePlan({ ...INPUT, userId: 'user-beta' });

  assert.notDeepEqual(first.techniqueIds, second.techniqueIds);
});

test('maps plan days, clamps dates before the start, and repeats on day eight', () => {
  const plan = buildSevenDayExercisePlan(INPUT);

  assert.equal(resolveDailyExerciseTechniqueId(plan, '2026-07-29'), plan.techniqueIds[0]);
  assert.equal(resolveDailyExerciseTechniqueId(plan, '2026-07-30'), plan.techniqueIds[0]);
  assert.equal(resolveDailyExerciseTechniqueId(plan, '2026-07-31'), plan.techniqueIds[1]);
  assert.equal(resolveDailyExerciseTechniqueId(plan, '2026-08-05'), plan.techniqueIds[6]);
  assert.equal(resolveDailyExerciseTechniqueId(plan, '2026-08-06'), plan.techniqueIds[0]);
});

test('skips a newly changed primary technique without changing the stored plan', () => {
  const plan = buildSevenDayExercisePlan(INPUT);
  const firstTechnique = plan.techniqueIds[0];

  assert.equal(
    resolveDailyExerciseTechniqueId(plan, plan.startsOn, firstTechnique),
    plan.techniqueIds[1],
  );

  const picks = Array.from({ length: 7 }, (_, dayOffset) => {
    const date = new Date(Date.UTC(2026, 6, 30 + dayOffset));
    return resolveDailyExerciseTechniqueId(
      plan,
      date.toISOString().slice(0, 10),
      firstTechnique,
    );
  });

  for (let index = 1; index < picks.length; index += 1) {
    assert.notEqual(picks[index], picks[index - 1]);
  }
});

test('sanitizer accepts the contract and rejects invalid stored plans', () => {
  const plan = buildSevenDayExercisePlan(INPUT);

  assert.deepEqual(sanitizeDailyPlanExercises(plan), plan);
  assert.equal(sanitizeDailyPlanExercises({ ...plan, version: 2 }), null);
  assert.equal(sanitizeDailyPlanExercises({ ...plan, poolVersion: 'future' }), null);
  assert.equal(sanitizeDailyPlanExercises({ ...plan, startsOn: '2026-02-30' }), null);
  assert.equal(sanitizeDailyPlanExercises({ ...plan, techniqueIds: plan.techniqueIds.slice(0, 6) }), null);
  assert.equal(
    sanitizeDailyPlanExercises({
      ...plan,
      techniqueIds: [...plan.techniqueIds.slice(0, 6), plan.techniqueIds[0]],
    }),
    null,
  );
  assert.equal(
    sanitizeDailyPlanExercises({
      ...plan,
      techniqueIds: [...plan.techniqueIds.slice(0, 6), '478'],
    }),
    null,
  );
});

test('builder and resolver reject invalid calendar dates', () => {
  assert.throws(
    () => buildSevenDayExercisePlan({ ...INPUT, startsOn: '2026-02-30' }),
    /Invalid daily exercise plan start date/,
  );
  assert.throws(
    () => resolveDailyExerciseTechniqueId(buildSevenDayExercisePlan(INPUT), 'not-a-date'),
    /Invalid daily exercise plan date/,
  );
});
