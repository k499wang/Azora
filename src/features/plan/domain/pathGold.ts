/**
 * Gold coins on the plan path: days finished on consecutive calendar days.
 *
 * Gold only ever adds. A day that is not gold looks exactly like any other
 * finished day, so a gap is never drawn, only a run.
 */

import { daysBetweenLocalDates } from './azoraScore';

export interface ProgramDayFinish {
  programDay: number;
  /** The user's local date the day's last activity was credited, `YYYY-MM-DD`. */
  localDate: string;
}

/** The latest credited date per plan day, which is when that day was finished. */
export function programDayFinishDates(
  completions: readonly ProgramDayFinish[],
): ProgramDayFinish[] {
  const latest = new Map<number, string>();
  for (const { programDay, localDate } of completions) {
    const seen = latest.get(programDay);
    if (seen == null || localDate > seen) latest.set(programDay, localDate);
  }
  return [...latest]
    .map(([programDay, localDate]) => ({ programDay, localDate }))
    .sort((a, b) => a.programDay - b.programDay);
}

/**
 * Day 1 is gold once finished; any later day is gold when it was finished the
 * calendar day after the one before it. A missing date is never guessed at.
 */
export function pathGoldDays(
  finishes: readonly ProgramDayFinish[],
  daysDone: number,
): ReadonlySet<number> {
  const dates = new Map(finishes.map((finish) => [finish.programDay, finish.localDate]));
  const gold = new Set<number>();
  for (let day = 1; day <= daysDone; day += 1) {
    const date = dates.get(day);
    if (date == null) continue;
    if (day === 1) {
      gold.add(day);
      continue;
    }
    const before = dates.get(day - 1);
    if (before != null && daysBetweenLocalDates(before, date) === 1) gold.add(day);
  }
  return gold;
}
