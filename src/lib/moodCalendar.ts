/**
 * A month of check-ins, ready for the grid that draws them.
 *
 * The check-ins arrive as a run of the most recent days, newest first, across
 * however many months that run covers. This is the part that decides which of
 * them belong to the month on screen and what level each one landed on — kept
 * here so the card only has to choose colours.
 */

import { moodLevel, type MoodLevel } from '../features/mood/domain/moodCheckIn';

export interface MoodCalendarEntry {
  /** `YYYY-MM-DD`, the day the check-in was answered for. */
  localDate: string;
  score: number;
}

/**
 * Day of the month to the level answered on it.
 *
 * A day with no check-in is simply absent from the map. It is not a bad day
 * and must never be coloured as one: the grid would then punish the days
 * somebody was too low to open the app, which is the one thing it is for.
 */
export function moodLevelsByDay(
  entries: MoodCalendarEntry[],
  monthDate: Date,
): Map<number, MoodLevel> {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  const levels = new Map<number, MoodLevel>();

  for (const entry of entries) {
    if (!entry.localDate.startsWith(prefix)) continue;

    const day = Number(entry.localDate.slice(prefix.length));
    if (!Number.isInteger(day) || day < 1 || day > 31) continue;

    levels.set(day, moodLevel(entry.score));
  }

  return levels;
}
