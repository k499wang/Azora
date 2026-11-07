import type { PaywallOffering, PaywallPackageId, PaywallPackageOption } from '../../services/paywall';

/** A weekly free trial leads unless another plan has a free trial too. */
function defaultPackage(packages: readonly PaywallPackageOption[]): PaywallPackageOption | null {
  const freeTrials = packages.filter((pkg) => pkg.trialLabel != null);
  const onlyFreeTrial = freeTrials.length === 1 ? freeTrials[0] : null;
  return (onlyFreeTrial?.billingPeriod === 'week' ? onlyFreeTrial : null)
    ?? packages.find((pkg) => pkg.isRecommended)
    ?? packages[0]
    ?? null;
}

/** The plan selected when a paywall opens, before anyone taps. */
export function defaultPackageId(packages: readonly PaywallPackageOption[]): PaywallPackageId | null {
  return defaultPackage(packages)?.id ?? null;
}

/** The one package a single-choice paywall sells from this offering. */
export function singlePackage(
  offering: Pick<PaywallOffering, 'onlyPackageId' | 'packages'> | null | undefined,
): PaywallPackageOption | null {
  const packages = offering?.packages ?? [];
  return packages.find((pkg) => pkg.id === offering?.onlyPackageId) ?? defaultPackage(packages);
}
