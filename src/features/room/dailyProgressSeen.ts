interface Seen {
  localDate: string;
  done: number;
}

let seen: Seen | null = null;

/**
 * Where the daily progress bar was the last time the user actually watched it.
 *
 * The bar animates from here rather than from `done - 1`, so re-running a daily
 * you already finished shows it standing still instead of replaying a step you
 * did not take. Kept in memory only: it exists to stop a repeat inside one run
 * of the app, and after a cold start `done - 1` is right again, because the
 * only way to reach the sheet is to have just completed a daily.
 */
export function readSeenDailies(localDate: string): number | null {
  return seen != null && seen.localDate === localDate ? seen.done : null;
}

export function markSeenDailies(localDate: string, done: number): void {
  seen = { localDate, done };
}
