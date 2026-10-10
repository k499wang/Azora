import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  PROGRAM_ACTIVITIES,
  allProgramPresets,
  latestProgramPreset,
  programDayDefinition,
  programDayCount,
  programDayWeek,
  programPhaseForDay,
  expandProgramBlocks,
  programPresetRevision,
  programPresetWeeks,
} from './programCatalogue.ts';
import { completionProvesActivity } from './programActivity.ts';
import { TECHNIQUE_IDS } from '../../exercise/guidedBreathing/techniqueCatalog.ts';
import { getRoundsDurationOptions } from '../../exercise/guidedBreathing/domain/roundsDurationOptions.ts';

const presets = allProgramPresets();

/**
 * Revision 2 opens on a home session: the same short reset, days 1 to 10, on
 * purpose, with a tool after it on the days a lesson teaches one. The variety
 * rules start where that opening ends; revision 1 is held to them from day one.
 * The opening is pinned by technique; its one- and two-minute lengths are
 * checked on their own below.
 */
const HOME_SESSION_DAYS = 10;
const ONE_OFF_TOOL_DAYS = 7;
const ONE_MINUTE_START_DAYS = 3;
const RELAXING = 'breathing.relaxing';
const EXHALE = 'breathing.extended-exhale';
const RESONANCE = 'breathing.resonance';
const FIVE_SENSES = 'attention.54321.2';
const MUSCLE_RELEASE = 'attention.muscle-release.2';
const OPENING = {
  night: [
    [[RELAXING], 2],
    [[RELAXING, FIVE_SENSES], 1],
    [[RELAXING], 3],
    [[EXHALE], 1],
    [[EXHALE, MUSCLE_RELEASE], 2],
    [[EXHALE, FIVE_SENSES], 1],
  ],
  pressure: [
    [[RELAXING], 2],
    [[RELAXING, FIVE_SENSES], 1],
    [[RELAXING], 2],
    [[RELAXING, MUSCLE_RELEASE], 1],
    [[EXHALE], 1],
    [[EXHALE, MUSCLE_RELEASE], 1],
    [[EXHALE, FIVE_SENSES], 2],
  ],
  focus: [[['breathing.box'], 10]],
  quiet: [
    [['breathing.belly'], 3],
    [[RESONANCE], 1],
    [[RESONANCE, FIVE_SENSES], 1],
    [[RESONANCE], 2],
    [[RESONANCE, FIVE_SENSES], 3],
  ],
  morning: [[['breathing.morning-charge'], 10]],
};

/** A breathing id without its length; other activities are returned whole. */
function techniqueOf(activityId) {
  return activityId.replace(/^(breathing\.[^.]+)\.\d+$/, '$1');
}

function breathingMinutes(activityIds) {
  return activityIds
    .map((activityId) => PROGRAM_ACTIVITIES.get(activityId).delivery)
    .filter((delivery) => delivery.modality === 'breathing')
    .map((delivery) => delivery.minutes);
}

function firstVariedDay(preset) {
  return preset.revision >= 2 ? HOME_SESSION_DAYS + 1 : 1;
}

/** A tool added for one day in revision 2's first week may leave the next day smaller. */
function firstGrowingDay(preset) {
  return preset.revision >= 2 ? ONE_OFF_TOOL_DAYS : 1;
}

/** The last revision of each plan before day 1 lost its Reset and light days arrived. */
const PRE_EASY_START_REVISION = {
  night: 4, morning: 6, pressure: 6, focus: 6, quiet: 6,
  home: 5, phone: 5, recovery: 5, selfTrust: 5,
};

function preEasyStart(planId) {
  return programPresetRevision(planId, PRE_EASY_START_REVISION[planId]);
}

function isEasyStart(preset) {
  return preset.revision > PRE_EASY_START_REVISION[preset.planId];
}

function isVaried(preset) {
  return preset.revision > PRE_EASY_START_REVISION[preset.planId] + 1;
}

function hasReset(day) {
  return day.activityIds.length > 0;
}

test('the catalogue publishes at least one plan', () => {
  assert.ok(presets.length > 0);
});

test('every plan/revision pair is published once', () => {
  const keys = presets.map((preset) => `${preset.planId}:${preset.revision}`);
  assert.equal(new Set(keys).size, keys.length);
});

test('every day names activities the registry holds', () => {
  for (const preset of presets) {
    for (const day of preset.days) {
      assert.ok(hasReset(day) || isEasyStart(preset), `${preset.planId} day ${day.day} is empty`);
      for (const activityId of day.activityIds) {
        assert.ok(
          PROGRAM_ACTIVITIES.has(activityId),
          `${preset.planId} day ${day.day} names ${activityId}`,
        );
      }
    }
  }
});

/** Historical editions grew steadily between their light days. */
test('historical editions never reduce the workload between practice days', () => {
  for (const preset of presets.filter((preset) => !isVaried(preset))) {
    const counts = preset.days
      .slice(firstGrowingDay(preset) - 1)
      .filter(hasReset)
      .map((day) => day.activityIds.length);
    assert.deepEqual(
      counts,
      [...counts].sort((left, right) => left - right),
      `${preset.planId} shrinks its day`,
    );
  }
});

test('every plan starts at one exercise and ends with more', () => {
  for (const preset of presets) {
    assert.equal(
      preset.days.find(hasReset).activityIds.length,
      1,
      `${preset.planId} does not start at one`,
    );
    assert.ok(
      preset.days[preset.days.length - 1].activityIds.length > 1,
      `${preset.planId} never grows`,
    );
  }
});

test('a day never asks for the same exercise twice', () => {
  for (const preset of presets) {
    for (const day of preset.days) {
      assert.equal(
        new Set(day.activityIds).size,
        day.activityIds.length,
        `${preset.planId} day ${day.day} repeats an activity`,
      );
    }
  }
});

test('days run from one upwards with nothing missing or repeated', () => {
  for (const preset of presets) {
    const numbers = preset.days.map((day) => day.day);
    assert.deepEqual(
      numbers,
      Array.from({ length: numbers.length }, (_, index) => index + 1),
      `${preset.planId} days are not contiguous from 1`,
    );
  }
});

test('phases cover every day exactly once, in order', () => {
  for (const preset of presets) {
    let expectedStart = 1;
    for (const phase of preset.phases) {
      assert.equal(
        phase.startDay,
        expectedStart,
        `${preset.planId} phase "${phase.name}" does not start where the last ended`,
      );
      assert.ok(
        phase.endDay >= phase.startDay,
        `${preset.planId} phase "${phase.name}" ends before it starts`,
      );
      expectedStart = phase.endDay + 1;
    }
    assert.equal(
      expectedStart - 1,
      preset.days.length,
      `${preset.planId} phases do not reach its last day`,
    );

    for (const day of preset.days) {
      assert.ok(
        programPhaseForDay(preset, day.day) != null,
        `${preset.planId} day ${day.day} has no phase`,
      );
    }
  }
});

test('every day says why it is there', () => {
  for (const preset of presets) {
    for (const day of preset.days) {
      assert.ok(day.why.trim().length > 0);
    }
  }
});

test('each block states its own reason, and no two say the same thing', () => {
  for (const preset of presets) {
    const reasons = preset.blocks.map((block) => block.why);
    // Two blocks with the same reason are one block that got split, which is how
    // a plan starts reading as a list with a sentence stapled to it.
    assert.equal(
      new Set(reasons).size,
      reasons.length,
      `${preset.planId} repeats a block reason`,
    );
  }
});

test('blocks expand to exactly the days they claim, in order', () => {
  for (const preset of presets) {
    const total = preset.blocks.reduce((sum, block) => sum + block.days, 0);
    assert.equal(preset.days.length, total, `${preset.planId} day count`);

    let day = 0;
    for (const block of preset.blocks) {
      assert.ok(block.days >= 1, `${preset.planId} has a block of no days`);
      for (let index = 0; index < block.days; index += 1) {
        // The shape is the block's; what fills it is the rotation, walked by
        // the day's index inside the block.
        assert.equal(
          preset.days[day].activityIds.length,
          block.slots.length,
          `${preset.planId} day ${day + 1} is not the block's shape`,
        );
        assert.deepEqual(
          preset.days[day].activityIds,
          block.slots.map((rotation) => rotation[index % rotation.length]),
        );
        assert.equal(preset.days[day].why, block.why);
        day += 1;
      }
    }
  }
});

/**
 * Tomorrow is not today.
 *
 * A plan that prescribes the same list for a fortnight is a reminder with a
 * countdown attached, and the thing people actually stop doing is the thing
 * they have already done four times this week. Every day has to bring something
 * that was not on yesterday's list — across block boundaries too, which is
 * where a rotation that happens to land back where it started would show up.
 */
test('historical editions add an activity yesterday did not ask for', () => {
  for (const preset of presets.filter((preset) => !isVaried(preset))) {
    for (
      let index = Math.max(1, firstVariedDay(preset) - 1);
      index < preset.days.length;
      index += 1
    ) {
      const today = preset.days[index].activityIds;
      const yesterday = preset.days[index - 1].activityIds;
      if (today.length === 0) continue;
      assert.ok(
        today.some((activityId) => !yesterday.includes(activityId)),
        `${preset.planId} day ${index + 1} repeats day ${index} exactly`,
      );
    }
  }
});

/**
 * Novelty on its own is not enough. A rotation that comes back around every
 * other day reads as two days alternating, which is the thing it was supposed
 * to replace — so an identical day may not return inside three days, block
 * boundaries included.
 */
test('historical editions do not repeat an identical day inside three days', () => {
  for (const preset of presets.filter((preset) => !isVaried(preset))) {
    const lastSeen = new Map();
    for (const day of preset.days) {
      if (day.day < firstVariedDay(preset)) continue;
      const key = day.activityIds.join('|');
      const previous = lastSeen.get(key);
      if (previous != null) {
        assert.ok(
          day.day - previous >= 3,
          `${preset.planId} repeats day ${previous} on day ${day.day}`,
        );
      }
      lastSeen.set(key, day.day);
    }
  }
});

/** A block's rotations change its activities while keeping its slot count. */
test('a rotation never changes how much a day asks for', () => {
  for (const preset of presets) {
    for (const block of preset.blocks) {
      for (const rotation of block.slots) {
        assert.ok(rotation.length >= 1, `${preset.planId} has an empty rotation`);
      }
    }
  }
});

test('expanding blocks numbers days from one without gaps', () => {
  const days = expandProgramBlocks([
    { slots: [['breathing.relaxing.2']], days: 3, why: 'a' },
    { slots: [['breathing.box.3'], ['breathing.belly.3']], days: 2, why: 'b' },
  ]);

  assert.deepEqual(
    days.map((day) => day.day),
    [1, 2, 3, 4, 5],
  );
  assert.deepEqual(days[2].activityIds, ['breathing.relaxing.2']);
  assert.deepEqual(days[4].activityIds, [
    'breathing.box.3',
    'breathing.belly.3',
  ]);
});

test('a rotation is walked one step a day, and wraps', () => {
  const days = expandProgramBlocks([
    {
      slots: [
        ['breathing.box.3', 'breathing.triangle.4'],
        ['breathing.belly.3', 'breathing.relaxing.2', 'breathing.sitali.3'],
      ],
      days: 4,
      why: 'a',
    },
  ]);

  assert.deepEqual(
    days.map((day) => day.activityIds),
    [
      ['breathing.box.3', 'breathing.belly.3'],
      ['breathing.triangle.4', 'breathing.relaxing.2'],
      ['breathing.box.3', 'breathing.sitali.3'],
      // Both wrap on their own length, so a day is a pairing somebody authored
      // rather than one the arithmetic produced.
      ['breathing.triangle.4', 'breathing.belly.3'],
    ],
  );
});

test('a block that runs for no days is refused, not silently dropped', () => {
  assert.throws(
    () =>
      expandProgramBlocks([
        { slots: [['breathing.box.3']], days: 0, why: 'x' },
      ]),
    /runs for no days/,
  );
  assert.throws(
    () => expandProgramBlocks([{ slots: [], days: 2, why: 'x' }]),
    /at least one activity/,
  );
  assert.throws(
    () => expandProgramBlocks([{ slots: [[]], days: 2, why: 'x' }]),
    /nothing in it/,
  );
  assert.throws(
    () =>
      expandProgramBlocks([
        { slots: [['breathing.box.3']], days: 1, why: 'x', rest: true },
      ]),
    /asks for an activity/,
  );
});

test('a rest block expands to days that ask for no activity', () => {
  const days = expandProgramBlocks([
    { slots: [], days: 1, why: 'Rest', rest: true },
    { slots: [['breathing.box.3']], days: 1, why: 'Back' },
  ]);
  assert.deepEqual(
    days.map(({ day, activityIds }) => [day, activityIds]),
    [[1, []], [2, ['breathing.box.3']]],
  );
});

test('no plan prescribes a high-ventilation technique without a safety gate', () => {
  for (const preset of presets) {
    for (const day of preset.days) {
      for (const activityId of day.activityIds) {
        const activity = PROGRAM_ACTIVITIES.get(activityId);
        if (activity.delivery.modality !== 'breathing') continue;
        assert.ok(
          !['wimhof', 'bhastrika'].includes(activity.delivery.techniqueId),
          `${preset.planId} day ${day.day} prescribes ${activity.delivery.techniqueId}`,
        );
      }
    }
  }
});

test('all published plans are whole numbers of weeks', () => {
  assert.deepEqual(
    [...new Set(presets.map((preset) => preset.planId))].sort(),
    [
      'focus',
      'home',
      'morning',
      'night',
      'phone',
      'pressure',
      'quiet',
      'recovery',
      'selfTrust',
    ],
  );
  assert.deepEqual(
    presets
      .map((preset) => `${preset.planId}:${preset.revision}:${preset.days.length}`)
      .sort(),
    [
      'focus:1:42',
      'focus:2:42',
      'focus:3:42',
      'focus:4:42',
      'focus:5:42',
      'focus:6:42',
      'focus:7:42',
      'focus:8:42',
      'home:1:28',
      'home:2:28',
      'home:3:28',
      'home:4:28',
      'home:5:28',
      'home:6:28',
      'home:7:28',
      'morning:1:28',
      'morning:2:28',
      'morning:3:28',
      'morning:4:28',
      'morning:5:28',
      'morning:6:28',
      'morning:7:28',
      'morning:8:28',
      'night:1:28',
      'night:2:28',
      'night:3:28',
      'night:4:28',
      'night:5:28',
      'night:6:28',
      'phone:1:28',
      'phone:2:28',
      'phone:3:28',
      'phone:4:28',
      'phone:5:28',
      'phone:6:28',
      'phone:7:28',
      'pressure:1:56',
      'pressure:2:56',
      'pressure:3:56',
      'pressure:4:56',
      'pressure:5:56',
      'pressure:6:56',
      'pressure:7:56',
      'pressure:8:56',
      'quiet:1:42',
      'quiet:2:42',
      'quiet:3:42',
      'quiet:4:42',
      'quiet:5:42',
      'quiet:6:42',
      'quiet:7:42',
      'quiet:8:42',
      'recovery:1:28',
      'recovery:2:28',
      'recovery:3:28',
      'recovery:4:28',
      'recovery:5:28',
      'recovery:6:28',
      'recovery:7:28',
      'selfTrust:1:42',
      'selfTrust:2:42',
      'selfTrust:3:42',
      'selfTrust:4:42',
      'selfTrust:5:42',
      'selfTrust:6:42',
      'selfTrust:7:42',
    ],
  );
});

test('no plan day is a whole week long or longer than the plan', () => {
  for (const preset of presets) {
    assert.equal(preset.days.length % 7, 0, `${preset.planId} is not whole weeks`);
    assert.equal(programPresetWeeks(preset), preset.days.length / 7);
  }
});

test('breathing activities name a technique the app can actually run', () => {
  for (const activity of PROGRAM_ACTIVITIES.values()) {
    if (activity.delivery.modality !== 'breathing') continue;
    assert.ok(
      TECHNIQUE_IDS.includes(activity.delivery.techniqueId),
      `${activity.id} names an unknown technique`,
    );
    assert.ok(activity.delivery.minutes > 0);
  }
});

test("an activity's estimated time is exactly the session it delivers", () => {
  for (const activity of PROGRAM_ACTIVITIES.values()) {
    const { delivery } = activity;
    if (delivery.modality !== 'breathing' && delivery.modality !== 'attention') continue;
    assert.equal(activity.estimatedSeconds, delivery.minutes * 60, activity.id);
  }
});

test('every authored fallback exists and is not the activity itself', () => {
  for (const activity of PROGRAM_ACTIVITIES.values()) {
    for (const fallbackId of activity.fallbackActivityIds) {
      assert.ok(
        PROGRAM_ACTIVITIES.has(fallbackId),
        `${activity.id} falls back to unknown ${fallbackId}`,
      );
      assert.notEqual(fallbackId, activity.id);
    }
  }
});

test('a session of the named technique proves its day; another does not', () => {
  const activity = PROGRAM_ACTIVITIES.get('breathing.relaxing.2');
  assert.ok(activity != null);

  assert.equal(
    completionProvesActivity(activity, {
      modality: 'breathing',
      techniqueId: 'relaxing',
    }),
    true,
  );
  assert.equal(
    completionProvesActivity(activity, {
      modality: 'breathing',
      techniqueId: 'box',
    }),
    false,
  );
  // A modality we have not authored yet cannot accidentally satisfy a day.
  assert.equal(
    completionProvesActivity(activity, { modality: 'reflection' }),
    false,
  );
});

test('weeks are counted from the day, one-based', () => {
  assert.equal(programDayWeek(1), 1);
  assert.equal(programDayWeek(7), 1);
  assert.equal(programDayWeek(8), 2);
  assert.equal(programDayWeek(28), 4);
});

test('a plan is looked up by its exact revision, and the latest is published', () => {
  assert.equal(programPresetRevision('night', 1)?.planId, 'night');
  assert.equal(programPresetRevision('night', 99), null);
  assert.equal(latestProgramPreset('night')?.revision, 6);
  assert.equal(latestProgramPreset('focus')?.revision, 8);
  assert.equal(latestProgramPreset('home')?.revision, 7);
});

test('previous plan revisions stay available with their original Reset schedule', () => {
  for (const planId of Object.keys(PRE_EASY_START_REVISION)) {
    const previous = programPresetRevision(planId, PRE_EASY_START_REVISION[planId]);
    assert.ok(previous.days.every((day) => day.activityIds.length > 0), planId);
    assert.equal(latestProgramPreset(planId).revision, previous.revision + 2);
  }
});

test('day 2 always has a Reset in every published plan, and exactly one in new plans', () => {
  for (const preset of presets) {
    assert.ok(preset.days[1].activityIds.length >= 1, `${preset.planId} revision ${preset.revision}`);
  }
  for (const planId of Object.keys(PRE_EASY_START_REVISION)) {
    assert.equal(latestProgramPreset(planId).days[1].activityIds.length, 1, planId);
  }
});

test('all 57 earlier published presets retain their complete authored content', () => {
  const historical = presets.filter((preset) => !isVaried(preset));
  assert.equal(historical.length, 57);
  // Full catalogue fingerprint from commit 29effdb3, before varied editions.
  // Covers activities, blocks, phases and copy, not just revision numbers.
  assert.equal(createHash('sha256').update(JSON.stringify(historical)).digest('hex'),
    '53d9d85d7e9c0a007b59bc90200febd1cc372861dc6f782f521a6082361efbbf');
});

test('varied editions favor zero and one Reset throughout the plan, with occasional pairs', () => {
  for (const planId of Object.keys(PRE_EASY_START_REVISION)) {
    const preset = latestProgramPreset(planId);
    const previous = programPresetRevision(planId, preset.revision - 1);
    assert.ok(isVaried(preset), planId);
    const counts = preset.days.map((day) => day.activityIds.length);
    const zeros = counts.filter((count) => count === 0).length;
    const ones = counts.filter((count) => count === 1).length;
    assert.deepEqual([...new Set(counts)].sort(), [0, 1, 2], planId);
    assert.ok(zeros >= Math.floor(counts.length * 0.2), `${planId} needs regular light days`);
    assert.ok(zeros > previous.days.filter((day) => !hasReset(day)).length, planId);
    assert.ok(ones > previous.days.filter((day) => day.activityIds.length === 1).length, planId);
    assert.ok(zeros + ones >= counts.length * 0.7, `${planId} is still dominated by pairs`);
    for (const phase of preset.phases) {
      const phaseCounts = counts.slice(phase.startDay - 1, phase.endDay);
      assert.ok(phaseCounts.includes(0) && phaseCounts.includes(1) && phaseCounts.includes(2),
        `${planId} phase ${phase.name} needs a varied workload`);
    }
    for (let index = 1; index < counts.length; index += 1) {
      assert.ok(counts[index] !== 0 || counts[index - 1] !== 0, `${planId} repeats light days consecutively`);
      if (index >= 2) {
        assert.ok(counts.slice(index - 2, index + 1).some((count) => count < 2),
          `${planId} has three consecutive paired days`);
      }
    }
    assert.equal(counts.at(-1), 2, `${planId} closes with a practice day`);
    assert.equal(preset.days.length, previous.days.length, planId);
    assert.equal(preset.outcome, previous.outcome, planId);
    assert.deepEqual(preset.phases.map(({ name, startDay, endDay }) => ({ name, startDay, endDay })),
      previous.phases.map(({ name, startDay, endDay }) => ({ name, startDay, endDay })), planId);
    for (const day of preset.days) {
      assert.ok(day.activityIds.every((id) => previous.days[day.day - 1].activityIds.includes(id)),
        `${planId} day ${day.day} introduces an unrelated practice`);
    }
  }
});

test('varied editions keep tool introductions and breathing lessons paired with their practices', () => {
  for (const planId of ADDED_TOOL_PLANS) {
    const preset = latestProgramPreset(planId);
    assert.deepEqual(preset.days[(planId === 'quiet' ? 5 : 3) - 1].activityIds, [FIVE_SENSES], planId);
    assert.ok(preset.days[5].activityIds.includes(MUSCLE_RELEASE), planId);
    assert.equal(preset.days[7].activityIds.length, 2, planId);
  }
  assert.ok(latestProgramPreset('quiet').days[12].activityIds[0].startsWith('breathing.'));
  assert.ok(latestProgramPreset('selfTrust').days[13].activityIds[0].startsWith('breathing.'));
});

test('new non-sleep plans never require the third bedtime slot', () => {
  const planIds = [...new Set(presets.map((preset) => preset.planId))];
  for (const planId of planIds.filter((id) => id !== 'night')) {
    const latest = preEasyStart(planId);
    const previous = programPresetRevision(planId, 4);
    assert.ok(latest.revision >= 5, planId);
    assert.ok(previous.days.some((day) => day.activityIds.length === 3), planId);
    assert.equal(latest.days.length, previous.days.length, planId);
    for (const day of latest.days) {
      assert.ok(day.activityIds.length <= 2, `${planId} day ${day.day}`);
      const previousIds = previous.days[day.day - 1].activityIds;
      assert.equal(day.activityIds[0], previousIds[0]);
      assert.ok(day.activityIds.every((id) => previousIds.includes(id)), `${planId} day ${day.day}`);
    }
    assert.ok(!latest.phases.some((phase) => /third|three/i.test(phase.intent)), planId);
  }
});

test('the sleep plan retains its bedtime schedule in the new lesson edition', () => {
  const night = preEasyStart('night');
  assert.deepEqual(night.days, programPresetRevision('night', 3).days);
  assert.ok(night.days.some((day) => day.activityIds.length === 3));
});

test('every breathing reset a new enrollment gets is one or two minutes', () => {
  const planIds = [...new Set(presets.map((preset) => preset.planId))];
  for (const planId of planIds) {
    const preset = latestProgramPreset(planId);
    for (const day of preset.days) {
      for (const minutes of breathingMinutes(day.activityIds)) {
        assert.ok([1, 2].includes(minutes), `${planId} day ${day.day} asks for ${minutes} minutes`);
      }
    }
  }
});

test('revision 2 starts on one-minute breathing resets', () => {
  for (const planId of Object.keys(OPENING)) {
    const preset = programPresetRevision(planId, 2);
    for (const day of preset.days.slice(0, ONE_MINUTE_START_DAYS)) {
      assert.deepEqual(
        breathingMinutes(day.activityIds),
        day.activityIds.filter((activityId) => activityId.startsWith('breathing.')).map(() => 1),
        `${planId} day ${day.day}`,
      );
    }
  }
});

/**
 * After the first days, lengths alternate rather than settle: a day of several
 * Resets pairs a one-minute with a two-minute, a lone breathing Reset beside a
 * scripted one is the short one, and lone breathing days take turns.
 */
test('from day 4, revision 2 mixes one- and two-minute breathing resets about evenly', () => {
  for (const planId of Object.keys(OPENING)) {
    const preset = programPresetRevision(planId, 2);
    let oneMinute = 0;
    let breathing = 0;
    preset.days.forEach((day, index) => {
      const minutes = breathingMinutes(day.activityIds);
      oneMinute += minutes.filter((value) => value === 1).length;
      breathing += minutes.length;
      if (day.day <= ONE_MINUTE_START_DAYS) return;

      if (minutes.length >= 2) {
        assert.equal(new Set(minutes).size, 2, `${planId} day ${day.day} is all one length`);
      } else if (minutes.length === 1 && day.activityIds.length > 1) {
        assert.equal(minutes[0], 1, `${planId} day ${day.day} pairs two of a length`);
      } else if (minutes.length === 1) {
        const yesterday = preset.days[index - 1].activityIds;
        if (yesterday.length === 1 && breathingMinutes(yesterday).length === 1) {
          assert.notEqual(minutes[0], breathingMinutes(yesterday)[0], `${planId} day ${day.day}`);
        }
      }
    });
    const share = oneMinute / breathing;
    assert.ok(share >= 0.4 && share <= 0.6, `${planId} is ${Math.round(share * 100)}% one-minute`);
  }
});

test('a one-minute breathing reset still runs at least four full breaths', () => {
  const techniques = readFileSync(
    new URL('../../exercise/guidedBreathing/techniques.ts', import.meta.url),
    'utf8',
  );
  for (const activity of PROGRAM_ACTIVITIES.values()) {
    const { delivery } = activity;
    if (delivery.modality !== 'breathing' || delivery.minutes !== 1) continue;
    const source = techniques.match(
      new RegExp(`id: '${delivery.techniqueId}',[\\s\\S]*?pattern: (\\{[^}]*\\})`),
    );
    assert.ok(source != null, activity.id);
    const pattern = JSON.parse(source[1].replace(/(\w+):/g, '"$1":'));
    const option = getRoundsDurationOptions(pattern, 1).find((candidate) => candidate.minutes === 1);
    assert.ok(option.rounds >= 4, `${activity.id} runs ${option.rounds} breaths`);
  }
});

test('revision 2 opens on one home session, adding tools only as authored', () => {
  for (const [planId, steps] of Object.entries(OPENING)) {
    const preset = programPresetRevision(planId, 2);
    assert.ok(preset != null, planId);
    const expected = steps.flatMap(([activityIds, days]) =>
      Array.from({ length: days }, () => activityIds),
    );
    assert.equal(expected.length, HOME_SESSION_DAYS, planId);
    assert.deepEqual(
      preset.days
        .slice(0, HOME_SESSION_DAYS)
        .map((day) => day.activityIds.map(techniqueOf)),
      expected,
      planId,
    );
  }
});

test('revision 2 keeps revision 1 shape from day 11', () => {
  for (const planId of Object.keys(OPENING)) {
    const before = programPresetRevision(planId, 1);
    const after = programPresetRevision(planId, 2);
    assert.equal(after.days.length, before.days.length, planId);
    assert.deepEqual(after.phases, before.phases, planId);
    for (const day of after.days.slice(HOME_SESSION_DAYS)) {
      assert.equal(
        day.activityIds.length,
        before.days[day.day - 1].activityIds.length,
        `${planId} day ${day.day}`,
      );
    }
  }
});

test('the Night Reset is four whole weeks and ends on a full day', () => {
  const night = programPresetRevision('night', 1);
  assert.ok(night != null);
  assert.equal(night.days.length, 28);
  assert.equal(programPresetWeeks(night), 4);
  assert.deepEqual(programDayDefinition(night, 28)?.activityIds, [
    'breathing.relaxing.2',
    'breathing.coherent-6.5',
    'breathing.sleep-descent.5',
  ]);
  assert.equal(programDayCount(night, 1), 1);
  assert.equal(programDayCount(night, 28), 3);
  assert.equal(programDayDefinition(night, 29), null);
});

const ADDED_TOOL_PLANS = ['morning', 'focus', 'quiet', 'home', 'phone', 'recovery', 'selfTrust'];

test('easy-start editions teach both tools before practising them regularly', () => {
  for (const planId of ADDED_TOOL_PLANS) {
    const preset = programPresetRevision(planId, PRE_EASY_START_REVISION[planId] + 1);
    const groundingDay = planId === 'quiet' ? 5 : 3;
    assert.ok(preset.days[groundingDay - 1].activityIds.includes(FIVE_SENSES), planId);
    assert.ok(preset.days[5].activityIds.includes(MUSCLE_RELEASE), planId);
    assert.deepEqual(preset.days.slice(7, 10).map((day) => day.activityIds[1]),
      planId === 'quiet' ? [MUSCLE_RELEASE, FIVE_SENSES, FIVE_SENSES] : [MUSCLE_RELEASE, FIVE_SENSES, MUSCLE_RELEASE]);
    for (const day of preset.days.slice(10)) {
      if ((day.day - 11) % 3 !== 0) continue;
      assert.equal(day.activityIds[1], (day.day - 11) % 6 === 0 ? MUSCLE_RELEASE : FIVE_SENSES);
    }
  }
});

test('new tool editions preserve published phases, length and later daily workload', () => {
  for (const planId of ADDED_TOOL_PLANS) {
    const toolRevision = ['morning', 'focus', 'quiet'].includes(planId) ? 3 : 2;
    const after = programPresetRevision(planId, toolRevision);
    const before = programPresetRevision(planId, toolRevision - 1);
    assert.equal(after.days.length, before.days.length, planId);
    assert.deepEqual(after.phases, before.phases, planId);
    after.days.slice(10).forEach((day) => {
      assert.equal(day.activityIds.length, before.days[day.day - 1].activityIds.length, `${planId} day ${day.day}`);
    });
    for (const day of after.days.slice(0, 3)) {
      assert.deepEqual(breathingMinutes(day.activityIds), [1]);
    }
    const lengths = after.days.flatMap((day) => breathingMinutes(day.activityIds));
    const oneMinuteShare = lengths.filter((minutes) => minutes === 1).length / lengths.length;
    assert.ok(oneMinuteShare >= 0.35 && oneMinuteShare <= 0.65, `${planId} duration balance`);
  }
});


test('every latest plan includes both guided non-breathing resets', () => {
  for (const planId of [...new Set(presets.map((preset) => preset.planId))]) {
    const activityIds = latestProgramPreset(planId).days.flatMap((day) => day.activityIds);
    assert.ok(activityIds.includes(FIVE_SENSES), `${planId} has no grounding`);
    assert.ok(activityIds.includes(MUSCLE_RELEASE), `${planId} has no muscle release`);
  }
});


test('new calming openings use a longer exhale to match their first breathing lesson', () => {
  for (const planId of ['focus', 'quiet', 'home', 'phone', 'recovery', 'selfTrust']) {
    const preset = preEasyStart(planId);
    for (const day of preset.days.slice(0, planId === 'quiet' ? 3 : 10)) {
      assert.equal(techniqueOf(day.activityIds[0]), RELAXING, `${planId} day ${day.day}`);
    }
  }
  const quiet = preEasyStart('quiet');
  for (const day of quiet.days.slice(3, 10)) {
    assert.equal(techniqueOf(day.activityIds[0]), RESONANCE, `quiet day ${day.day}`);
  }
});

test('a new plan opens on a day with no Reset, then at most one a day until day 6', () => {
  for (const planId of Object.keys(PRE_EASY_START_REVISION)) {
    const preset = latestProgramPreset(planId);
    assert.ok(isEasyStart(preset), planId);
    assert.deepEqual(preset.days[0].activityIds, [], planId);
    assert.equal(preset.blocks[0].rest, true, planId);
    for (const day of preset.days.slice(1, 5)) {
      assert.equal(day.activityIds.length, 1, `${planId} day ${day.day}`);
    }
    const groundingDay = planId === 'quiet' ? 5 : 3;
    assert.deepEqual(preset.days[groundingDay - 1].activityIds, [FIVE_SENSES], planId);
  }
});

test('light days skip the first ten days, tool days and the last day', () => {
  for (const planId of Object.keys(PRE_EASY_START_REVISION)) {
    const preset = programPresetRevision(planId, PRE_EASY_START_REVISION[planId] + 1);
    const previous = preEasyStart(planId);
    const lightDays = preset.days.filter((day) => day.day > 1 && !hasReset(day));
    assert.ok(lightDays.length >= 3, `${planId} has ${lightDays.length} light days`);
    for (const { day } of lightDays) {
      assert.ok(day > 10 && day < preset.days.length, `${planId} day ${day}`);
      assert.ok(
        previous.days[day - 1].activityIds.every((id) => id.startsWith('breathing.')),
        `${planId} light day ${day} replaces a tool day`,
      );
      assert.ok(hasReset(preset.days[day - 2]) && hasReset(preset.days[day]), `${planId} day ${day}`);
    }
  }
});

test('a new plan keeps its predecessor everywhere except day 1, the grounding day and light days', () => {
  for (const planId of Object.keys(PRE_EASY_START_REVISION)) {
    const preset = programPresetRevision(planId, PRE_EASY_START_REVISION[planId] + 1);
    const previous = preEasyStart(planId);
    const groundingDay = planId === 'quiet' ? 5 : 3;
    assert.equal(preset.revision, previous.revision + 1, planId);
    assert.equal(preset.days.length, previous.days.length, planId);
    assert.deepEqual(preset.phases, previous.phases, planId);
    assert.equal(preset.outcome, previous.outcome, planId);
    for (const day of preset.days) {
      if (day.day === 1 || day.day === groundingDay || !hasReset(day)) continue;
      assert.deepEqual(day.activityIds, previous.days[day.day - 1].activityIds, `${planId} day ${day.day}`);
    }
  }
});
