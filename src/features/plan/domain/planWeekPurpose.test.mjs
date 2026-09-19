import { test } from 'node:test';
import assert from 'node:assert/strict';

import { planWeekPurpose, planWeekPurposeLines } from './planWeekPurpose.ts';
import {
  latestProgramPreset,
  programPresetWeeks,
} from '../../program/domain/programCatalogue.ts';

const PLAN_IDS = ['night', 'morning', 'pressure', 'focus', 'quiet'];

const weeksIn = (planId) => programPresetWeeks(latestProgramPreset(planId));

/** The table drifting out of step with the catalogue is what this catches. */
test('a plan authors exactly one line for each of its weeks', () => {
  for (const planId of PLAN_IDS) {
    assert.equal(planWeekPurposeLines(planId).length, weeksIn(planId), planId);
  }
});

test('every week of every plan gets a line that ends in a stop', () => {
  for (const planId of PLAN_IDS) {
    for (let week = 1; week <= weeksIn(planId); week += 1) {
      const line = planWeekPurpose(planId, week);
      assert.ok(line != null && line.length > 0, `${planId} week ${week}`);
      assert.match(line, /\.$/, `${planId} week ${week}`);
    }
  }
});

test('a week is written for a glance, not a paragraph', () => {
  for (const planId of PLAN_IDS) {
    for (const line of planWeekPurposeLines(planId)) {
      const sentences = line.match(/[.!?](\s|$)/g) ?? [];
      assert.ok(sentences.length <= 2, `${planId}: ${line}`);
    }
  }
});

/** The house style forbids it, and it creeps back in through copy edits. */
test('no line carries an em dash', () => {
  for (const planId of PLAN_IDS) {
    for (const line of planWeekPurposeLines(planId)) {
      assert.doesNotMatch(line, /\u2014/, `${planId}: ${line}`);
    }
  }
});

test('the copy never names a date or a weekday', () => {
  for (const planId of PLAN_IDS) {
    for (const line of planWeekPurposeLines(planId)) {
      assert.doesNotMatch(
        line,
        /monday|tuesday|jan|feb|mar/i,
        `${planId}: ${line}`,
      );
    }
  }
});

test('banned words stay out of the plan copy', () => {
  for (const planId of PLAN_IDS) {
    for (const line of planWeekPurposeLines(planId)) {
      assert.doesNotMatch(line, /breathwork/i, `${planId}: ${line}`);
    }
  }
});

test('no two weeks of a plan say the same thing', () => {
  for (const planId of PLAN_IDS) {
    const lines = planWeekPurposeLines(planId);
    assert.equal(new Set(lines).size, lines.length, planId);
  }
});

test('a week reads for its own plan, not for every plan at once', () => {
  const night = planWeekPurposeLines('night');
  const focus = planWeekPurposeLines('focus');
  for (let index = 0; index < Math.min(night.length, focus.length); index += 1) {
    assert.notEqual(night[index], focus[index], `week ${index + 1}`);
  }
});

test('a week outside the plan has no copy rather than the wrong copy', () => {
  assert.equal(planWeekPurpose('night', 0), null);
  assert.equal(planWeekPurpose('night', weeksIn('night') + 1), null);
});
