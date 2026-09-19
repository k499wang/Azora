/**
 * What a week of the plan is for, in one line.
 *
 * Derived rather than authored. Twenty-eight hand-written lines across the five
 * plans would be twenty-eight chances for the copy to outlive the catalogue —
 * a week that says "a second reset joins" after the plan moved that step is the
 * small lie that stops the screen being worth reading. Everything here is read
 * off the week itself, so it cannot drift.
 *
 * It is deliberately not plan-specific. What a week is *for* is the same shape
 * in all five plans — settle, grow, hold — and the plan's own character is
 * already carried by the days above the line.
 */

import type { PlanCalendarWeek } from './planCalendar';

const ORDINALS = [
  '',
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
] as const;

function ordinal(count: number): string {
  return ORDINALS[count] ?? `${count}th`;
}

export function planWeekPurpose(
  week: PlanCalendarWeek,
  totalWeeks: number,
): string {
  if (week.week === 1) {
    return 'Getting the hour to stick. The doses stay small on purpose, so the habit is the only thing being asked for.';
  }

  // A week that straddles a growth step is about that step and nothing else.
  if (week.leastResets !== week.mostResets) {
    // A third reset joins two, not one.
    const already = week.mostResets > 2 ? 'the ones' : 'the one';
    return `The day grows this week: a ${ordinal(week.mostResets)} reset joins ${already} you already do.`;
  }

  if (week.week === totalWeeks) {
    return 'The last stretch, where the practice stops needing a plan behind it.';
  }

  switch (week.phaseName) {
    case 'Settling in':
      return 'Still settling. The same shape as last week, so it gets easier rather than bigger.';
    case 'When it starts to stick':
      return 'The stretch where it starts holding on its own, and a missed day feels like the odd one out.';
    default:
      return 'Holding what you have built. Nothing new is added; the point now is that it keeps happening.';
  }
}
