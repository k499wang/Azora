import test from 'node:test';
import assert from 'node:assert/strict';
import { programPlanPreviewRows } from './programPlanPreview.ts';
import {
  PROGRAM_ACTIVITIES,
  allProgramPresets,
  programPlanShape,
} from './programCatalogue.ts';
import { PROGRAM_SLOT_ORDER } from './programSchedule.ts';

const PLAN_IDS = allProgramPresets().map((preset) => preset.planId);

/**
 * The page shows the day the user is about to start, and nothing past it.
 *
 * It listed every hour the plan would ever use for a while, each future one
 * marked with the week it arrived. That page sells a fortnight of work to
 * somebody who has not done day one, and it makes week one read as a warm-up
 * for the real plan rather than as the plan.
 */
test('the page shows only what the plan asks for now', () => {
  for (const planId of PLAN_IDS) {
    const rows = programPlanPreviewRows(planId);
    const preset = allProgramPresets().find((p) => p.planId === planId);
    const shape = programPlanShape(preset);

    assert.equal(rows.length, shape.firstDayCount, planId);
    assert.deepEqual(
      rows.map((row) => row.slot),
      PROGRAM_SLOT_ORDER.slice(0, shape.firstDayCount),
      planId,
    );
  }
});

test('no row promises a week, because no row is about a later one', () => {
  for (const planId of PLAN_IDS) {
    for (const row of programPlanPreviewRows(planId)) {
      assert.equal(row.joinsInWeek, undefined, planId);
      assert.doesNotMatch(row.title, /week/i, planId);
    }
  }
});

test('every row is the exercise day one actually runs, in its own hour', () => {
  for (const planId of PLAN_IDS) {
    const preset = allProgramPresets().find((p) => p.planId === planId);
    const firstDay = preset.days[0];

    programPlanPreviewRows(planId).forEach((row, position) => {
      const activity = PROGRAM_ACTIVITIES.get(firstDay.activityIds[position]);
      assert.equal(
        row.minutes,
        Math.round(activity.estimatedSeconds / 60),
        `${planId} row ${position} is not day one's work`,
      );
    });
  }
});

/**
 * The names on the page are the names the rows will carry on Home. A plan whose
 * lines are called something else is a second plan, and the user meets the
 * rename on the morning they are trying to start.
 */
test('every row is named, in the words Home uses', () => {
  for (const planId of PLAN_IDS) {
    for (const row of programPlanPreviewRows(planId)) {
      assert.ok(row.title.length > 0, planId);
      assert.ok(row.minutes >= 1, `${planId} ${row.title}`);
    }
  }
  assert.equal(programPlanPreviewRows('night')[0].title, 'Stress Relief');
});
