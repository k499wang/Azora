import { useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../../../../app/navigation';
import { FeatureKey } from '../../../../services/subscriptions/featureAccess';
import { useFeatureAccess } from '../../../../hooks/useFeatureAccess';
import { useHeartRateMonitoringPreference } from '../../../../hooks/useHeartRateMonitoringPreference';
import { trackFeatureGateHit } from '../../../../services/analytics/tracking';
import { PaywallPlacement } from '../../../../services/paywall';

interface Options {
  sourceScreen: string;
}

export function useBreathingHeartRateMonitoringAccess({ sourceScreen }: Options) {
  const navigation = useNavigation<RootStackNavigationProp>();
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

  // The intro toggle is the only place a session offers the setting, so an
  // upgrade prompt has to come from here rather than from a settings sheet.
  const requestHeartRateMonitoring = useCallback(
    (enabled: boolean) => {
      if (enabled && heartRateMonitoringProLocked) {
        trackFeatureGateHit({
          feature: FeatureKey.BreathingHeartRateMonitoring,
          placement: PaywallPlacement.HeartRateProGate,
          sourceScreen,
          sourceAction: 'heart_rate_monitoring_toggle',
          access,
        });
        navigation.navigate('ProPaywall', {
          placement: PaywallPlacement.HeartRateProGate,
          sourceScreen,
          sourceAction: 'heart_rate_monitoring_toggle',
          feature: FeatureKey.BreathingHeartRateMonitoring,
        });
        return;
      }
      setHeartRateMonitoringEnabled(enabled);
    },
    [
      access,
      heartRateMonitoringProLocked,
      navigation,
      setHeartRateMonitoringEnabled,
      sourceScreen,
    ],
  );

  return {
    heartRateMonitoringEnabled,
    heartRateMonitoringPreferenceLoaded,
    heartRateMonitoringAllowed,
    heartRateMonitoringAccessLoading,
    heartRateMonitoringProLocked,
    setHeartRateMonitoringEnabled,
    requestHeartRateMonitoring,
  };
}
