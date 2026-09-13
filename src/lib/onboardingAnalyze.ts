/**
 * How long an onboarding analyze screen runs for.
 *
 * How long a screen runs for is derived from how many answers actually feed
 * the block it follows, so the
 * sleep block — three questions — visibly takes longer than the intent block.
 * A constant duration is the tell that nothing is being read.
 */
const BASE_MS = 2000;
const PER_ANSWER_MS = 620;
const MAX_MS = 5000;

export function analyzeDurationMs(answeredCount: number): number {
  const answered = Math.max(0, Math.round(answeredCount));
  return Math.min(BASE_MS + answered * PER_ANSWER_MS, MAX_MS);
}

/** Counts the values a user actually supplied; nulls and skips do not count. */
export function countAnswered(values: readonly unknown[]): number {
  return values.filter((value) => {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  }).length;
}
