import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../../../../app/navigation';
import type { FeatureAccessState } from '../../../../hooks/useFeatureAccess';
import { trackFeatureGateHit } from '../../../../services/analytics/tracking';
import { PaywallPlacement } from '../../../../services/paywall';
import type { FeatureKeyValue } from '../../../../services/subscriptions/featureAccess';

interface UseExercisePaywallGateOptions {
  access: FeatureAccessState;
  feature: FeatureKeyValue;
  sourceScreen: string;
}

/**
 * The Pro gate in front of every exercise launch. The returned check is true
 * when the exercise may open; false once a locked user has been sent to the
 * paywall instead.
 *
 * Access that is still resolving passes, so a Pro user is never shown a
 * paywall for the half-second before their entitlement loads.
 */
export function useExercisePaywallGate({
  access,
  feature,
  sourceScreen,
}: UseExercisePaywallGateOptions) {
  const navigation = useNavigation<RootStackNavigationProp>();

  return useCallback(
    (sourceAction: string): boolean => {
      if (access.allowed || access.isLoading) return true;
      trackFeatureGateHit({
        feature,
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen,
        sourceAction,
        access,
      });
      navigation.navigate('ProPaywall', {
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen,
        sourceAction,
        feature,
      });
      return false;
    },
    [access, feature, navigation, sourceScreen],
  );
}
