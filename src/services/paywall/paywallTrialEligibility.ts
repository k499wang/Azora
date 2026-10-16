import type { IntroEligibility } from '../subscriptions/revenueCatClient';

export type TrialEligibilityStatus = IntroEligibility['status'] | null;

// Mirrors INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE from
// react-native-purchases. Hardcoded so this module stays RN-free for Node tests.
const INTRO_ELIGIBILITY_STATUS_ELIGIBLE: Exclude<TrialEligibilityStatus, null> = 2;

interface TrialIntroPrice {
  price: number;
  priceString?: string;
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

  const days = trialLengthDays(options.introPrice);
  return days == null ? null : `${days}-day free trial`;
}

const DAYS_PER_PERIOD_UNIT: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

function introLengthDays(introPrice: TrialIntroPrice): number | null {
  const unitDays = DAYS_PER_PERIOD_UNIT[introPrice.periodUnit];
  if (unitDays == null || introPrice.periodNumberOfUnits <= 0) return null;
  return unitDays * introPrice.periodNumberOfUnits;
}

export function trialLengthDays(
  introPrice: TrialIntroPrice | null | undefined,
): number | null {
  if (!hasFreeTrialIntroPrice(introPrice)) return null;
  return introLengthDays(introPrice);
}

export interface PaidIntroOffer {
  priceString: string;
  days: number;
}

/** A paid intro offer (e.g. a first month at a lower price) the user can still redeem. */
export function eligiblePaidIntroOffer(options: {
  introPrice: TrialIntroPrice | null | undefined;
  eligibilityStatus: TrialEligibilityStatus;
}): PaidIntroOffer | null {
  const { introPrice } = options;
  if (introPrice == null || introPrice.price <= 0 || introPrice.priceString == null) return null;
  if (!isEligibleTrialStatus(options.eligibilityStatus)) return null;
  const days = introLengthDays(introPrice);
  return days == null ? null : { priceString: introPrice.priceString, days };
}
