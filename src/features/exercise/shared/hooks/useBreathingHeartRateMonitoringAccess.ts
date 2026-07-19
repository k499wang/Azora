import { useEffect } from 'react';
import { FeatureKey } from '../../../../services/subscriptions/featureAccess';
import { useFeatureAccess } from '../../../../hooks/useFeatureAccess';
import { useHeartRateMonitoringPreference } from '../../../../hooks/useHeartRateMonitoringPreference';

export function useBreathingHeartRateMonitoringAccess() {
  const {
    heartRateMonitoringEnabled,
    heartRateMonitoringPreferenceLoaded,
    heartRateMonitoringPreferenceIsUnset,
    setHeartRateMonitoringEnabled,
  } = useHeartRateMonitoringPreference();
  const access = useFeatureAccess(FeatureKey.BreathingHeartRateMonitoring);
  const heartRateMonitoringAllowed = access.allowed;
  const heartRateMonitoringAccessLoading = access.isLoading;
  const heartRateMonitoringProLocked =
    !heartRateMonitoringAllowed && !heartRateMonitoringAccessLoading;

  useEffect(() => {
    if (!heartRateMonitoringProLocked || !heartRateMonitoringEnabled) return;
    setHeartRateMonitoringEnabled(false);
  }, [
    heartRateMonitoringEnabled,
    heartRateMonitoringProLocked,
    setHeartRateMonitoringEnabled,
  ]);

  // Pro users get heart-rate monitoring by default until they explicitly
  // choose a preference.
  useEffect(() => {
    if (
      !heartRateMonitoringPreferenceLoaded ||
      !heartRateMonitoringPreferenceIsUnset ||
      !heartRateMonitoringAllowed ||
      heartRateMonitoringEnabled
    ) {
      return;
    }

    setHeartRateMonitoringEnabled(true);
  }, [
    heartRateMonitoringAllowed,
    heartRateMonitoringEnabled,
    heartRateMonitoringPreferenceIsUnset,
    heartRateMonitoringPreferenceLoaded,
    setHeartRateMonitoringEnabled,
  ]);

  return {
    heartRateMonitoringEnabled,
    heartRateMonitoringPreferenceLoaded,
    heartRateMonitoringAllowed,
    heartRateMonitoringAccessLoading,
    heartRateMonitoringProLocked,
    setHeartRateMonitoringEnabled,
  };
}
