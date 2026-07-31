import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GENERAL_DAYTIME_POOL_V1,
  GENERAL_DAYTIME_POOL_V2,
  GROWTH_AREA_TECHNIQUE_ORDER,
  GROWTH_AREA_TECHNIQUE_ORDER_V2,
  buildGrowthAreaSevenDayExercisePlanV2,
  buildRebuiltSevenDayExercisePlan,
  buildSevenDayExercisePlan,
  readDailyPlanExercises,
  resolveDailyExerciseTechniqueIds,
  resolveDailyExerciseTechniqueId,
  resolveGrowthAreaAxis,
  sanitizeDailyPlanExercises,
  shouldRebuildDailyPlanAsV2,
} from './dailyExercisePlan.ts';
import { computeMindMap } from '../../../../lib/onboardingScores.ts';

const INPUT = {
  userId: 'user-alpha',
  primaryTechniqueId: 'box',
  startsOn: '2026-07-30',
};

const EXPECTED_GROWTH_AREA_ORDER = {
  calm: [
    'extended-exhale',
    'resonance',
    'relaxing',
    'belly',
    'sitali',
    'coherent-6',
    'triangle',
    'box',
  ],
  recovery: [
    'resonance',
    'coherent-6',
    'relaxing',
    'belly',
    'extended-exhale',
    'triangle',
    'sitali',
    'box',
  ],
  focus: [
    'box',
    'resonance',
    'triangle',
    'coherent-6',
    'belly',
    'extended-exhale',
    'sitali',
    'relaxing',
  ],
  resilience: [
    'resonance',
    'box',
    'sitali',
    'triangle',
    'coherent-6',
    'extended-exhale',
    'belly',
    'relaxing',
  ],
  breathEase: [
    'belly',
    'resonance',
    'relaxing',
    'coherent-6',
    'extended-exhale',
    'sitali',
    'triangle',
    'box',
  ],
};

const EXPECTED_GROWTH_AREA_ORDER_V2 = {
  calm: [
    'extended-exhale',
    'resonance',
    'relaxing',
    'belly',
    'sitali',
    'coherent-6',
    'triangle',
    'box',
    'deep-box',
    'wimhof',
    'bhastrika',
  ],
  recovery: [
    'resonance',
    'coherent-6',
    'relaxing',
    'belly',
    'extended-exhale',
    'triangle',
    'sitali',
    'deep-box',
    'box',
    'wimhof',
    'bhastrika',
  ],
  focus: [
    'box',
    'triangle',
    'deep-box',
    'resonance',
    'bhastrika',
    'coherent-6',
    'wimhof',
    'belly',
    'extended-exhale',
    'sitali',
    'relaxing',
  ],
  resilience: [
    'resonance',
    'box',
    'sitali',
    'triangle',
    'deep-box',
    'coherent-6',
    'wimhof',
    'extended-exhale',
    'bhastrika',
    'belly',
    'relaxing',
  ],
  breathEase: [
    'belly',
    'relaxing',
    'resonance',
    'coherent-6',
    'extended-exhale',
    'sitali',
    'triangle',
    'box',
    'deep-box',
    'wimhof',
    'bhastrika',
  ],
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

test('the V1 growth-area order still covers the pool stored V1 plans draw from', () => {
  for (const [growthAreaAxis, expectedOrder] of Object.entries(
    EXPECTED_GROWTH_AREA_ORDER,
  )) {
    assert.deepEqual(GROWTH_AREA_TECHNIQUE_ORDER[growthAreaAxis], expectedOrder);
    assert.deepEqual(
      [...expectedOrder].sort(),
      [...GENERAL_DAYTIME_POOL_V1].sort(),
    );
  }
});

test('V2 growth-area plans follow every approved order and persist their axis', () => {
  assert.deepEqual(GENERAL_DAYTIME_POOL_V2, [
    ...GENERAL_DAYTIME_POOL_V1,
    'deep-box',
    'wimhof',
    'bhastrika',
  ]);

  for (const [growthAreaAxis, expectedOrder] of Object.entries(
    EXPECTED_GROWTH_AREA_ORDER_V2,
  )) {
    assert.deepEqual(GROWTH_AREA_TECHNIQUE_ORDER_V2[growthAreaAxis], expectedOrder);
    assert.deepEqual([...expectedOrder].sort(), [...GENERAL_DAYTIME_POOL_V2].sort());

    const plan = buildGrowthAreaSevenDayExercisePlanV2({
      primaryTechniqueId: expectedOrder[0],
      growthAreaAxis,
      startsOn: '2026-07-30',
    });

    assert.equal(plan.version, 2);
    assert.equal(plan.poolVersion, 'growth_area_daytime_v2');
    assert.equal(plan.growthAreaAxis, growthAreaAxis);
    assert.deepEqual(plan.techniqueIds, expectedOrder.slice(1, 8));
    assert.deepEqual(sanitizeDailyPlanExercises(plan), plan);
  }
});

test('the V1 plan hash keeps its exact established order', () => {
  assert.deepEqual(buildSevenDayExercisePlan(INPUT).techniqueIds, [
    'triangle',
    'coherent-6',
    'resonance',
    'relaxing',
    'belly',
    'extended-exhale',
    'sitali',
  ]);
});

test('maps plan days, clamps dates before the start, and repeats on day eight', () => {
  const plan = buildSevenDayExercisePlan(INPUT);

  assert.equal(resolveDailyExerciseTechniqueId(plan, '2026-07-29'), plan.techniqueIds[0]);
  assert.equal(resolveDailyExerciseTechniqueId(plan, '2026-07-30'), plan.techniqueIds[0]);
  assert.equal(resolveDailyExerciseTechniqueId(plan, '2026-07-31'), plan.techniqueIds[1]);
  assert.equal(resolveDailyExerciseTechniqueId(plan, '2026-08-05'), plan.techniqueIds[6]);
  assert.equal(resolveDailyExerciseTechniqueId(plan, '2026-08-06'), plan.techniqueIds[0]);
});

test('replaces a newly changed V1 primary in-place and keeps a seven-day cycle', () => {
  const plan = buildSevenDayExercisePlan(INPUT);
  const firstTechnique = plan.techniqueIds[0];
  const resolvedIds = resolveDailyExerciseTechniqueIds(plan, firstTechnique);

  assert.equal(resolvedIds.length, 7);
  assert.equal(new Set(resolvedIds).size, 7);
  assert.equal(resolvedIds[0], 'box');
  assert.deepEqual(resolvedIds.slice(1), plan.techniqueIds.slice(1));
  assert.ok(!resolvedIds.includes(firstTechnique));
  assert.notDeepEqual(resolvedIds, plan.techniqueIds);

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
  assert.equal(
    resolveDailyExerciseTechniqueId(plan, '2026-08-06', firstTechnique),
    resolvedIds[0],
  );
});

test('replaces a newly changed V2 primary from its persisted axis order', () => {
  const plan = buildGrowthAreaSevenDayExercisePlanV2({
    primaryTechniqueId: null,
    growthAreaAxis: 'calm',
    startsOn: '2026-07-30',
  });
  const resolvedIds = resolveDailyExerciseTechniqueIds(plan, 'resonance');

  assert.deepEqual(resolvedIds, [
    'extended-exhale',
    'box',
    'relaxing',
    'belly',
    'sitali',
    'coherent-6',
    'triangle',
  ]);
  assert.equal(new Set(resolvedIds).size, 7);
  assert.ok(!resolvedIds.includes('resonance'));
  assert.equal(plan.techniqueIds[1], 'resonance');
  assert.equal(
    resolveDailyExerciseTechniqueId(plan, '2026-08-06', 'resonance'),
    resolvedIds[0],
  );
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

test('read classification protects V2 and future payloads from legacy repair', () => {
  const v1 = buildSevenDayExercisePlan(INPUT);
  const v2 = buildGrowthAreaSevenDayExercisePlanV2({
    primaryTechniqueId: 'box',
    growthAreaAxis: 'focus',
    startsOn: '2026-07-30',
  });

  assert.deepEqual(readDailyPlanExercises(v1), { status: 'available', plan: v1 });
  assert.deepEqual(readDailyPlanExercises(v2), { status: 'available', plan: v2 });
  assert.deepEqual(readDailyPlanExercises(null), { status: 'missing' });
  assert.deepEqual(
    readDailyPlanExercises({ ...v1, techniqueIds: v1.techniqueIds.slice(0, 6) }),
    { status: 'invalid_v1' },
  );
  assert.deepEqual(
    readDailyPlanExercises({ ...v2, growthAreaAxis: 'future-axis' }),
    { status: 'invalid_v2' },
  );
  assert.deepEqual(
    readDailyPlanExercises({
      ...v2,
      techniqueIds: [...v2.techniqueIds.slice(0, 6), '478'],
    }),
    { status: 'invalid_v2' },
  );
  assert.deepEqual(
    readDailyPlanExercises({
      ...v2,
      techniqueIds: [...v2.techniqueIds.slice(0, 6), v2.techniqueIds[0]],
    }),
    { status: 'invalid_v2' },
  );
  assert.deepEqual(
    readDailyPlanExercises({ ...v2, version: 3, poolVersion: 'future_v3' }),
    { status: 'unsupported' },
  );
  assert.deepEqual(
    readDailyPlanExercises({
      ...v1,
      poolVersion: 'growth_area_daytime_v2',
    }),
    { status: 'invalid_v2' },
  );
  assert.deepEqual(
    readDailyPlanExercises({ ...v1, poolVersion: 'future_v3' }),
    { status: 'unsupported' },
  );
  assert.deepEqual(
    readDailyPlanExercises({ ...v1, version: 3 }),
    { status: 'unsupported' },
  );
  assert.deepEqual(
    readDailyPlanExercises({
      ...v2,
      poolVersion: 'general_daytime_v1',
    }),
    { status: 'invalid_v2' },
  );
  assert.deepEqual(
    readDailyPlanExercises({
      poolVersion: 'growth_area_daytime_v2',
    }),
    { status: 'invalid_v2' },
  );
  assert.deepEqual(readDailyPlanExercises('malformed'), { status: 'unsupported' });

  assert.equal(shouldRebuildDailyPlanAsV2({ status: 'missing' }), true);
  assert.equal(shouldRebuildDailyPlanAsV2({ status: 'invalid_v1' }), true);
  assert.equal(shouldRebuildDailyPlanAsV2({ status: 'invalid_v2' }), true);
  assert.equal(shouldRebuildDailyPlanAsV2({ status: 'unsupported' }), false);
  assert.equal(
    shouldRebuildDailyPlanAsV2({ status: 'available', plan: v1 }),
    true,
  );
  assert.equal(
    shouldRebuildDailyPlanAsV2({ status: 'available', plan: v2 }),
    false,
  );
});

const STRESSED_ASSESSMENT = {
  stressLevel: 9,
  sleepQuality: 8,
  agreementResponses: { exhausted: 'disagree', racing: 'agree', reactive: 'agree' },
};

test('a stored assessment recomputes the real growth area instead of guessing', () => {
  const expected = computeMindMap({
    stressLevel: STRESSED_ASSESSMENT.stressLevel,
    sleepQuality: STRESSED_ASSESSMENT.sleepQuality,
    agreementResponses: STRESSED_ASSESSMENT.agreementResponses,
  }).growthArea.axis;

  assert.equal(
    resolveGrowthAreaAxis({
      assessment: STRESSED_ASSESSMENT,
      primaryTechniqueId: 'box',
    }),
    expected,
  );
  // The technique would have guessed `focus`; the assessment overrules it.
  assert.notEqual(expected, 'focus');

  assert.equal(
    resolveGrowthAreaAxis({
      assessment: { ...STRESSED_ASSESSMENT, agreementResponses: null },
      primaryTechniqueId: 'box',
    }),
    computeMindMap({
      stressLevel: STRESSED_ASSESSMENT.stressLevel,
      sleepQuality: STRESSED_ASSESSMENT.sleepQuality,
      agreementResponses: {},
    }).growthArea.axis,
  );
});

test('an incomplete assessment falls back to the primary technique, then to calm', () => {
  const partial = { stressLevel: 9, sleepQuality: null, agreementResponses: null };

  assert.equal(
    resolveGrowthAreaAxis({ assessment: partial, primaryTechniqueId: 'box' }),
    'focus',
  );
  assert.equal(
    resolveGrowthAreaAxis({ assessment: null, primaryTechniqueId: '478' }),
    'recovery',
  );
  assert.equal(
    resolveGrowthAreaAxis({ assessment: null, primaryTechniqueId: 'wimhof' }),
    'resilience',
  );
  assert.equal(
    resolveGrowthAreaAxis({ assessment: null, primaryTechniqueId: 'resonance' }),
    'breathEase',
  );
  assert.equal(
    resolveGrowthAreaAxis({ assessment: null, primaryTechniqueId: null }),
    'calm',
  );
  assert.equal(
    resolveGrowthAreaAxis({
      assessment: null,
      primaryTechniqueId: 'not-a-technique',
    }),
    'calm',
  );
});

test('a rebuilt plan matches a new onboarding plan on the resolved axis', () => {
  const rebuilt = buildRebuiltSevenDayExercisePlan({
    assessment: null,
    primaryTechniqueId: 'box',
    startsOn: '2026-07-30',
  });

  assert.equal(rebuilt.version, 2);
  assert.equal(rebuilt.poolVersion, 'growth_area_daytime_v2');
  assert.equal(rebuilt.growthAreaAxis, 'focus');
  assert.equal(rebuilt.startsOn, '2026-07-30');
  assert.ok(!rebuilt.techniqueIds.includes('box'));
  assert.deepEqual(sanitizeDailyPlanExercises(rebuilt), rebuilt);
  assert.deepEqual(
    rebuilt,
    buildGrowthAreaSevenDayExercisePlanV2({
      primaryTechniqueId: 'box',
      growthAreaAxis: 'focus',
      startsOn: '2026-07-30',
    }),
  );
});

test('rebuilt plans draw from the V2 pool, and the intensity axes surface its additions', () => {
  const addedAfterV1 = ['deep-box', 'wimhof', 'bhastrika'];

  for (const primaryTechniqueId of ['box', '478', 'wimhof', 'resonance', 'relaxing']) {
    const plan = buildRebuiltSevenDayExercisePlan({
      assessment: null,
      primaryTechniqueId,
      startsOn: '2026-07-30',
    });

    assert.ok(
      plan.techniqueIds.every((id) => GENERAL_DAYTIME_POOL_V2.includes(id)),
    );
    assert.ok(!plan.techniqueIds.includes(primaryTechniqueId));
  }

  // Calm, recovery, and breathEase deliberately rank the intense additions
  // below the seven-day window, so only the focus and resilience axes
  // surface them.
  for (const primaryTechniqueId of ['box', 'wimhof']) {
    const plan = buildRebuiltSevenDayExercisePlan({
      assessment: null,
      primaryTechniqueId,
      startsOn: '2026-07-30',
    });

    assert.ok(
      plan.techniqueIds.some((id) => addedAfterV1.includes(id)),
      `${primaryTechniqueId} plan never surfaces a post-V1 technique`,
    );
  }
});

test('builder and resolver reject invalid calendar dates', () => {
  assert.throws(
    () => buildSevenDayExercisePlan({ ...INPUT, startsOn: '2026-02-30' }),
    /Invalid daily exercise plan start date/,
  );
  assert.throws(
    () =>
      buildGrowthAreaSevenDayExercisePlanV2({
        primaryTechniqueId: 'box',
        growthAreaAxis: 'calm',
        startsOn: '2026-02-30',
      }),
    /Invalid daily exercise plan start date/,
  );
  assert.throws(
    () =>
      buildRebuiltSevenDayExercisePlan({
        assessment: null,
        primaryTechniqueId: 'box',
        startsOn: '2026-02-30',
      }),
    /Invalid daily exercise plan start date/,
  );
  assert.throws(
    () => resolveDailyExerciseTechniqueId(buildSevenDayExercisePlan(INPUT), 'not-a-date'),
    /Invalid daily exercise plan date/,
  );
});
