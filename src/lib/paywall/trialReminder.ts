/**
 * How many days before a trial renews its reminder fires. The paywall promises
 * this date and the scheduler keeps it, so both read it from here.
 */
export const TRIAL_REMINDER_DAYS_BEFORE_END = 2;

const DEFAULT_TRIAL_DAYS = 7;

/** "7-day free trial" → 7; anything unreadable falls back to the 7-day trial we sell. */
export function trialDaysFromLabel(label: string | null | undefined): number {
  const days = Number.parseInt(label ?? '', 10);
  return Number.isFinite(days) && days > 1 ? days : DEFAULT_TRIAL_DAYS;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** The dates a trial started today will be reminded on and billed on. */
export function trialTimelineDates(today: Date, trialDays: number): { reminder: Date; billing: Date } {
  const billing = addDays(today, trialDays);
  return { reminder: addDays(billing, -TRIAL_REMINDER_DAYS_BEFORE_END), billing };
}

/** "Oct 22": specific enough to plan around, short enough for a timeline label. */
export function formatTrialDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
