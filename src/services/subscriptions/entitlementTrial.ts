export function getRevenueCatTrialEndsAt(entitlement: {
  periodType?: string | null;
  expirationDate?: string | null;
}): string | null {
  const isTrial = entitlement.periodType?.toUpperCase() === 'TRIAL';
  return isTrial ? (entitlement.expirationDate ?? null) : null;
}
