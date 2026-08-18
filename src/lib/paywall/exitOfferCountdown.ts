/** Whole seconds remaining, rounded up so a live offer never displays expired. */
export function secondsUntilDeadline(deadlineMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}
