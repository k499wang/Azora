import { test } from 'node:test';
import assert from 'node:assert/strict';

import { planWeekPurpose } from './planWeekPurpose.ts';
import { planCalendar } from './planCalendar.ts';

const PLAN_IDS = ['night', 'morning', 'pressure', 'focus', 'quiet'];

function weeksFor(planId) {
  return planCalendar(planId, 1).weeks;
}

test('every week of every plan gets a line', () => {
  for (const planId of PLAN_IDS) {
    const weeks = weeksFor(planId);
    for (const week of weeks) {
      const line = planWeekPurpose(week, weeks.length);
      assert.ok(line.length > 0, `${planId} week ${week.week}`);
      assert.match(line, /\.$/, `${planId} week ${week.week} ends in a stop`);
    }
  }
});

test('week one is about the habit, not the dose', () => {
  for (const planId of PLAN_IDS) {
    const weeks = weeksFor(planId);
    assert.match(planWeekPurpose(weeks[0], weeks.length), /habit/);
  }
});

test('a week that grows says so, and names the reset that joins', () => {
  for (const planId of PLAN_IDS) {
    const weeks = weeksFor(planId);
    for (const week of weeks) {
      if (week.leastResets === week.mostResets) continue;
      const line = planWeekPurpose(week, weeks.length);
      assert.match(line, /grows this week/, `${planId} week ${week.week}`);
      assert.doesNotMatch(line, /undefined|NaN/);
    }
  }
});

test('the line never names a date or a weekday', () => {
  for (const planId of PLAN_IDS) {
    const weeks = weeksFor(planId);
    for (const week of weeks) {
      const line = planWeekPurpose(week, weeks.length);
      assert.doesNotMatch(line, /monday|tuesday|jan|feb|mar/i);
    }
  }
});

test('banned words stay out of the plan copy', () => {
  for (const planId of PLAN_IDS) {
    const weeks = weeksFor(planId);
    for (const week of weeks) {
      assert.doesNotMatch(planWeekPurpose(week, weeks.length), /breathwork/i);
    }
  }
});
