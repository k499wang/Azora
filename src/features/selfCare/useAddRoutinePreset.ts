import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../../app/navigation';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';

type RoutinePresetSourceScreen = 'RoutineCategory' | 'RoutineLibraryDetail';

interface UseAddRoutinePresetOptions {
  sourceScreen: RoutinePresetSourceScreen;
  onAllowed: () => void;
}

/** Opens the Pro offer before a curated routine can create personal to-dos. */
export function useAddRoutinePreset({
  sourceScreen,
  onAllowed,
}: UseAddRoutinePresetOptions) {
  const navigation = useNavigation<RootStackNavigationProp>();
  const access = useFeatureAccess(FeatureKey.RoutinePresets);

  const addToRoutine = () => {
    if (access.allowed) {
      onAllowed();
      return;
    }

    trackFeatureGateHit({
      feature: FeatureKey.RoutinePresets,
      placement: PaywallPlacement.RoutinePresetProGate,
      sourceScreen,
      sourceAction: 'add_to_my_routine',
      access,
    });
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.RoutinePresetProGate,
      sourceScreen,
      sourceAction: 'add_to_my_routine',
      feature: FeatureKey.RoutinePresets,
    });
  };

  return { addToRoutine, isLoading: access.isLoading };
}
