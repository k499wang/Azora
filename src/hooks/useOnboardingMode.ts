import { useEffect, useState } from 'react';
import { posthog } from '../config/posthog';
import {
  CLEANING_MODE_FLAG,
  onboardingModeFrom,
  type OnboardingMode,
} from '../lib/onboardingMode';

const MODE_WAIT_MS = 3000;

/**
 * Picks the onboarding flow from the `cleaning_mode` PostHog flag. Null while
 * deciding; falls back to standard if flags don't load in time. The first
 * answer sticks so the flow never switches mid-onboarding.
 */
export function useOnboardingMode(): OnboardingMode | null {
  const [mode, setMode] = useState<OnboardingMode | null>(null);

  useEffect(() => {
    let isActive = true;
    const settle = (next: OnboardingMode) => {
      if (isActive) setMode((current) => current ?? next);
    };
    const id = setTimeout(() => settle('standard'), MODE_WAIT_MS);
    // Reload rather than read the cache: the user was identified moments ago.
    posthog
      .reloadFeatureFlagsAsync()
      .then(() => onboardingModeFrom(posthog.getFeatureFlag(CLEANING_MODE_FLAG)))
      .catch((): OnboardingMode => 'standard')
      .then(settle);
    return () => {
      isActive = false;
      clearTimeout(id);
    };
  }, []);

  return mode;
}
