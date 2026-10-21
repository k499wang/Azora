/**
 * How many days before a trial renews its reminder fires. The paywall promises
 * this date and the scheduler keeps it, so both read it from here.
 */
export type TrialReminderDaysBeforeEnd = 2 | 3;
export const TRIAL_REMINDER_DAYS_BEFORE_END: TrialReminderDaysBeforeEnd = 2;

export function availableTrialReminderDays(trialDays: number): readonly TrialReminderDaysBeforeEnd[] {
  return ([2, 3] as const).filter((days) => days < trialDays);
}

const DEFAULT_TRIAL_DAYS = 7;

/** "7-day free trial" → 7; anything unreadable falls back to the 7-day trial we sell. */
export function trialDaysFromLabel(label: string | null | undefined): number {
  const days = Number.parseInt(label ?? '', 10);
  return Number.isFinite(days) && days > 0 ? days : DEFAULT_TRIAL_DAYS;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** The dates a trial started today will be reminded on and billed on. */
export function trialTimelineDates(
  today: Date,
  trialDays: number,
  daysBeforeEnd: TrialReminderDaysBeforeEnd = TRIAL_REMINDER_DAYS_BEFORE_END,
): { reminder: Date; billing: Date } {
  const billing = addDays(today, trialDays);
  return { reminder: addDays(billing, -daysBeforeEnd), billing };
}

/** "Oct 22": specific enough to plan around, short enough for a timeline label. */
export function formatTrialDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
