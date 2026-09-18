/**
 * The plan drawn as days.
 *
 * The things worth holding: every day of the plan appears exactly once, the
 * day on offer is the one after the last one done, a finished plan points at
 * no day at all, and every cell knows how much its day asks for. Each of those
 * is something somebody counts on a screen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  planCalendar,
  planCalendarPhaseWeeks,
} from './planCalendar.ts';
import { latestProgramPreset } from '../../program/domain/programCatalogue.ts';

const PLAN_IDS = ['night', 'morning', 'pressure', 'focus', 'quiet'];

const allDays = (calendar) =>
  calendar.phases.flatMap((phase) => phase.weeks.flatMap((week) => week.days));

test('every day of every plan appears exactly once, in order', () => {
  for (const planId of PLAN_IDS) {
    const calendar = planCalendar(planId, 0);
    const days = allDays(calendar).map((day) => day.day);
    const length = latestProgramPreset(planId).days.length;
    assert.equal(days.length, length, planId);
    assert.deepEqual(
      days,
      Array.from({ length }, (_, index) => index + 1),
      planId,
    );
  }
});

test('the phases cover the plan and never overlap', () => {
  for (const planId of PLAN_IDS) {
    const { phases } = planCalendar(planId, 0);
    let expected = 1;
    for (const phase of phases) {
      assert.equal(phase.startWeek, expected, `${planId} ${phase.name}`);
      expected = phase.endWeek + 1;
    }
  }
});

test('a week is seven days', () => {
  for (const planId of PLAN_IDS) {
    for (const phase of planCalendar(planId, 0).phases) {
      for (const week of phase.weeks) {
        assert.equal(week.days.length, 7, `${planId} week ${week.week}`);
      }
    }
  }
});

test('the day on offer is the one after the last one done', () => {
  const calendar = planCalendar('night', 11);
  const days = allDays(calendar);
  assert.equal(days.filter((day) => day.state === 'done').length, 11);
  assert.deepEqual(
    days.filter((day) => day.state === 'today').map((day) => day.day),
    [12],
  );
  assert.equal(days[11].state, 'today');
});

test('a plan not started yet points at day one', () => {
  const days = allDays(planCalendar('night', 0));
  assert.equal(days[0].state, 'today');
  assert.equal(days.some((day) => day.state === 'done'), false);
});

test('a finished plan points at no day, and nothing is left', () => {
  const calendar = planCalendar('night', 28);
  const days = allDays(calendar);
  assert.equal(days.every((day) => day.state === 'done'), true);
  assert.equal(days.some((day) => day.state === 'today'), false);
  assert.equal(calendar.daysLeft, 0);
});

test('a count past the end of the plan cannot overflow it', () => {
  const calendar = planCalendar('night', 999);
  assert.equal(calendar.daysDone, 28);
  assert.equal(calendar.daysLeft, 0);
  assert.equal(allDays(calendar).length, 28);
});

test('a phase is current when the day on offer is inside it', () => {
  const { phases } = planCalendar('night', 11);
  const current = phases.filter((phase) => phase.state === 'today');
  assert.equal(current.length, 1);
  const index = phases.indexOf(current[0]);
  assert.ok(phases.slice(0, index).every((phase) => phase.state === 'done'));
  assert.ok(phases.slice(index + 1).every((phase) => phase.state === 'ahead'));
});

test('a one-week phase says week, not weeks', () => {
  const phase = { name: '', weeks: [], state: 'ahead' };
  assert.equal(planCalendarPhaseWeeks({ ...phase, startWeek: 3, endWeek: 3 }), 'Week 3');
  assert.equal(
    planCalendarPhaseWeeks({ ...phase, startWeek: 1, endWeek: 2 }),
    'Weeks 1–2',
  );
});

test('a week counts the days behind them, and spans the days it holds', () => {
  const weeks = planCalendar('night', 11).weeks;
  assert.equal(weeks[0].span, 'Days 1\u20137');
  assert.equal(weeks[0].daysDone, 7);
  assert.equal(weeks[1].span, 'Days 8\u201314');
  assert.equal(weeks[1].daysDone, 4);
  assert.equal(weeks[2].daysDone, 0);
});

test('a week knows which stretch of the plan it belongs to', () => {
  for (const planId of PLAN_IDS) {
    const { weeks, phases } = planCalendar(planId, 0);
    const names = new Set(phases.map((phase) => phase.name));
    for (const week of weeks) {
      assert.ok(names.has(week.phaseName), `${planId} week ${week.week}`);
    }
  }
});

test('the weeks are every week of the plan, in order', () => {
  for (const planId of PLAN_IDS) {
    const { weeks } = planCalendar(planId, 0);
    assert.deepEqual(
      weeks.map((week) => week.week),
      Array.from({ length: weeks.length }, (_, index) => index + 1),
      planId,
    );
  }
});

test('exactly one week is the current one until the plan is finished', () => {
  for (const planId of PLAN_IDS) {
    const { weeks } = planCalendar(planId, 10);
    assert.equal(weeks.filter((week) => week.state === 'today').length, 1, planId);
  }
  assert.equal(
    planCalendar('night', 28).weeks.filter((week) => week.state === 'today').length,
    0,
  );
});
