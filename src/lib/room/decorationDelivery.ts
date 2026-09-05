/**
 * The wait between finishing a day and the decoration it earned turning up.
 *
 * Finishing the dailies still closes the day the moment it happens; what the
 * day earned arrives a few hours later, so the loop has two moments in it
 * rather than one. Set this to 0 to hand the piece over the instant the day is
 * done, which is how the room worked before.
 */
export const DECORATION_DELIVERY_MS = 4 * 60 * 60 * 1000;

/**
 * How close to midnight a delivery may still be booked.
 *
 * The room turns over at local midnight, so a piece promised any later is one
 * nobody can ever collect: tomorrow reads as a fresh unclaimed day and today's
 * earn is gone. Past this point the wait is given up rather than the piece.
 */
const DELIVERY_CUTOFF_MS = 60 * 60 * 1000;

/**
 * When the piece earned by a day finished at `completedAt` can be placed.
 *
 * A day finished late shortens its own wait, down to none at all — the clock
 * is there to make the reward worth coming back for, and it is never worth
 * losing the reward over.
 *
 * `delayMs` is a parameter so the dev build can hand in a wait short enough to
 * sit through, without this module having to know a build type.
 */
export function decorationReadyAt(
  completedAt: Date,
  delayMs: number = DECORATION_DELIVERY_MS,
): number {
  const completed = completedAt.getTime();

  // Not `setDate(+1)`: on a DST day the next midnight is 23 or 25 hours away,
  // and this is the form that lands on it either way.
  const nextMidnight = new Date(completedAt);
  nextMidnight.setHours(24, 0, 0, 0);

  const latest = Math.max(completed, nextMidnight.getTime() - DELIVERY_CUTOFF_MS);
  return Math.min(completed + delayMs, latest);
}

/**
 * A `null` delivery reads as ready. It means this device never saw the day
 * complete — a reinstall, a second phone — and handing the piece over early
 * beats withholding one that was genuinely earned.
 */
export function isDecorationReady(
  readyAt: number | null,
  nowMs: number,
): boolean {
  return readyAt == null || nowMs >= readyAt;
}

/** `HH:MM` in local time, for the clock formatter the daily plan already uses. */
export function decorationArrivalClock(readyAt: number): string {
  const at = new Date(readyAt);
  return [at.getHours(), at.getMinutes()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}
