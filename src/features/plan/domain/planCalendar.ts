/**
 * The whole plan as days, so it can be seen rather than described.
 *
 * The phases used to be three paragraphs. Three paragraphs are a claim that a
 * plan exists; a grid of every day it asks for, with the ones behind you
 * filled in, is the plan itself. It also answers the question the paragraphs
 * could not — how much is left — without anybody having to count.
 *
 * Days, never dates. The plan advances on days done, so day 12 is the twelfth
 * day the user showed up, not the twelfth of the month. A dated calendar would
 * show somebody who missed a fortnight a fortnight of empty boxes they can
 * never fill, which is exactly the punishment the plan promises not to make.
 */

import { phaseBoundsForPlan } from '../../../lib/onboardingPreset';
import {
  latestProgramPreset,
  programDayCount,
  type ProgramPlanId,
} from '../../program/domain/programCatalogue';

const DAYS_PER_WEEK = 7;

export type PlanDayState =
  /** Behind them. */
  | 'done'
  /** The day on offer now. */
  | 'today'
  /** Still to come. */
  | 'ahead';

export interface PlanCalendarDay {
  /** 1-based, and the number shown in the cell. */
  day: number;
  state: PlanDayState;
}

export interface PlanCalendarWeek {
  /** 1-based. */
  week: number;
  /** The stretch of the plan this week belongs to, e.g. `Settling in`. */
  phaseName: string;
  /** Where the user is against this week, for how hard it is drawn. */
  state: PlanDayState;
  days: readonly PlanCalendarDay[];
  /** How many of the week's days are behind them, for the bar and the count. */
  daysDone: number;
  /**
   * How many resets a day this week asks for, at its lightest and heaviest.
   *
   * Two numbers rather than a sentence: a week can straddle a growth step —
   * the second reset joins mid-week in some plans — and the screen that says
   * so out loud is the one place that wording should live.
   */
  leastResets: number;
  mostResets: number;
  /** `Days 8\u201314`, the span this week covers. Days, never dates. */
  span: string;
}

export interface PlanCalendarPhase {
  name: string;
  startWeek: number;
  endWeek: number;
  weeks: readonly PlanCalendarWeek[];
  /** Where the user is against this phase, for how hard it is drawn. */
  state: PlanDayState;
}

export interface PlanCalendar {
  phases: readonly PlanCalendarPhase[];
  /** Every week of the plan in order, which is what the screen draws. */
  weeks: readonly PlanCalendarWeek[];
  totalDays: number;
  daysDone: number;
  daysLeft: number;
}

/**
 * The plan, grouped into phases and weeks.
 *
 * `daysDone` is the count the plan itself keeps, so days 1 to `daysDone` are
 * behind them and the next one is the day on offer. There is no per-day
 * history to read: a plan that only advances when a day is finished already
 * holds the answer in one number.
 */
export function planCalendar(
  planId: ProgramPlanId,
  daysDone: number,
): PlanCalendar | null {
  const preset = latestProgramPreset(planId);
  if (preset == null) return null;

  const totalDays = preset.days.length;
  const done = Math.max(0, Math.min(totalDays, Math.floor(daysDone)));
  // Null once the plan is finished: there is no day on offer to point at.
  const todayDay = done >= totalDays ? null : done + 1;

  const phases = phaseBoundsForPlan(planId).map((phase) => {
    const weeks: PlanCalendarWeek[] = [];

    for (let week = phase.startWeek; week <= phase.endWeek; week += 1) {
      const firstDay = (week - 1) * DAYS_PER_WEEK + 1;
      if (firstDay > totalDays) break;

      const days: PlanCalendarDay[] = [];
      for (
        let day = firstDay;
        day < firstDay + DAYS_PER_WEEK && day <= totalDays;
        day += 1
      ) {
        days.push({
          day,
          state: day <= done ? 'done' : day === todayDay ? 'today' : 'ahead',
        });
      }
      weeks.push({
        week,
        phaseName: phase.name,
        state: phaseState(days),
        days,
        daysDone: days.filter((entry) => entry.state === 'done').length,
        leastResets: Math.min(...days.map((entry) => programDayCount(preset, entry.day))),
        mostResets: Math.max(...days.map((entry) => programDayCount(preset, entry.day))),
        span: `Days ${days[0].day}\u2013${days[days.length - 1].day}`,
      });
    }

    const phaseDays = weeks.flatMap((week) => week.days);
    return {
      name: phase.name,
      startWeek: phase.startWeek,
      endWeek: phase.endWeek,
      weeks,
      state: phaseState(phaseDays),
    };
  });

  const populated = phases.filter((phase) => phase.weeks.length > 0);

  return {
    phases: populated,
    weeks: populated.flatMap((phase) => phase.weeks),
    totalDays,
    daysDone: done,
    daysLeft: totalDays - done,
  };
}

function phaseState(days: readonly PlanCalendarDay[]): PlanDayState {
  if (days.some((day) => day.state === 'today')) return 'today';
  if (days.length > 0 && days.every((day) => day.state === 'done')) {
    return 'done';
  }
  return 'ahead';
}

/**
 * `Week 1 – 2`, or `Week 3` when a phase is one week long.
 *
 * Weeks rather than dates, for the same reason the days are numbered rather
 * than dated.
 */
export function planCalendarPhaseWeeks(phase: PlanCalendarPhase): string {
  return phase.startWeek === phase.endWeek
    ? `Week ${phase.startWeek}`
    : `Weeks ${phase.startWeek}–${phase.endWeek}`;
}
