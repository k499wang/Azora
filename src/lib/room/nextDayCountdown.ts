/**
 * How long until the loop turns over.
 *
 * The next piece is earned by finishing tomorrow's dailies, and "tomorrow"
 * starts at local midnight — the same boundary `useTodayLocalDate` waits on.
 * Counting 24 hours from when the piece was placed would promise a different
 * moment than the one the app actually rolls over on.
 */
export function msUntilNextLocalDay(now: Date): number {
  const nextDay = new Date(now);
  // Not `setDate(+1)`: on a DST day the next midnight is 23 or 25 hours away,
  // and this is the form that lands on it either way.
  nextDay.setHours(24, 0, 0, 0);

  return Math.max(0, nextDay.getTime() - now.getTime());
}

/** `hh:mm:ss`, zero-padded so the line never changes width as it ticks. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));

  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}
