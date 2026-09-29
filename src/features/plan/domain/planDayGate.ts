/** Days of a plan a free account can open before today's items ask for Pro. */
export const FREE_PLAN_DAYS = 2;

/** Whether today's plan items open the paywall rather than themselves. */
export function isPlanDayGated(isPro: boolean, daysDone: number | null): boolean {
  return !isPro && daysDone != null && daysDone >= FREE_PLAN_DAYS;
}
