import type { IntroEligibility } from '../subscriptions/revenueCatClient';

export type TrialEligibilityStatus = IntroEligibility['status'] | null;

// Mirrors INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE from
// react-native-purchases. Hardcoded so this module stays RN-free for Node tests.
const INTRO_ELIGIBILITY_STATUS_ELIGIBLE: Exclude<TrialEligibilityStatus, null> = 2;

interface TrialIntroPrice {
  price: number;
  periodUnit: string;
  periodNumberOfUnits: number;
}

export function hasFreeTrialIntroPrice(
  introPrice: TrialIntroPrice | null | undefined,
): introPrice is TrialIntroPrice {
  return introPrice != null && introPrice.price === 0;
}

export function isEligibleTrialStatus(status: TrialEligibilityStatus): boolean {
  return status === INTRO_ELIGIBILITY_STATUS_ELIGIBLE;
}

export function formatEligibleTrialLabel(options: {
  introPrice: TrialIntroPrice | null | undefined;
  eligibilityStatus: TrialEligibilityStatus;
}): string | null {
  if (!hasFreeTrialIntroPrice(options.introPrice)) {
    return null;
  }

  if (!isEligibleTrialStatus(options.eligibilityStatus)) {
    return null;
  }

  return formatFreeTrialLabel(options.introPrice);
}

function formatFreeTrialLabel(introPrice: TrialIntroPrice): string {
  const unit = introPrice.periodUnit.toLowerCase();
  const suffix = introPrice.periodNumberOfUnits === 1 ? unit : `${unit}s`;
  return `${introPrice.periodNumberOfUnits} ${suffix} free`;
}
