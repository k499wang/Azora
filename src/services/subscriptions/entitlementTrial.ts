export function getRevenueCatTrialEndsAt(entitlement: {
  periodType?: string | null;
  expirationDate?: string | null;
}): string | null {
  // A paid intro (e.g. 30 days at a lower price) ends in a full-price renewal
  // just like a free trial, so it gets the same trial-ending reminder.
  const periodType = entitlement.periodType?.toUpperCase();
  const isTrial = periodType === 'TRIAL' || periodType === 'INTRO';
  return isTrial ? (entitlement.expirationDate ?? null) : null;
}
