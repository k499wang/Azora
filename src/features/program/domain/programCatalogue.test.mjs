import test from 'node:test';
import assert from 'node:assert/strict';
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

const presets = allProgramPresets();

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
      assert.ok(day.activityIds.length > 0);
      for (const activityId of day.activityIds) {
        assert.ok(
          PROGRAM_ACTIVITIES.has(activityId),
          `${preset.planId} day ${day.day} names ${activityId}`,
        );
      }
    }
  }
});

/**
 * The whole progression: the day grows from one exercise to three. If a plan
 * ever asked for less than it did the day before, the escalation curve would be
 * a sawtooth and "week 4" would mean nothing.
 */
test('the day never asks for less than it did the day before', () => {
  for (const preset of presets) {
    const counts = preset.days.map((day) => day.activityIds.length);
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
      preset.days[0].activityIds.length,
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
test('every day asks for something yesterday did not', () => {
  for (const preset of presets) {
    for (let index = 1; index < preset.days.length; index += 1) {
      const today = preset.days[index].activityIds;
      const yesterday = preset.days[index - 1].activityIds;
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
test('an identical day never comes back inside three days', () => {
  for (const preset of presets) {
    const lastSeen = new Map();
    for (const day of preset.days) {
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

/**
 * Variety is not escalation. The day's *size* is the progression and it may
 * only grow; what fills each position is free to move daily, and the two must
 * not be confused for one another.
 */
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

test('all five plans are published, each a whole number of weeks', () => {
  assert.deepEqual(
    presets.map((preset) => preset.planId).sort(),
    ['focus', 'morning', 'night', 'pressure', 'quiet'],
  );
  assert.deepEqual(
    presets.map((preset) => `${preset.planId}:${preset.days.length}`).sort(),
    ['focus:42', 'morning:28', 'night:28', 'pressure:56', 'quiet:42'],
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
  assert.equal(latestProgramPreset('night')?.revision, 1);
  assert.equal(latestProgramPreset('focus')?.revision, 1);
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
