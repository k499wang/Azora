import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../../app/navigation';
import type { FeatureAccessState } from '../../hooks/useFeatureAccess';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { FeatureKey } from '../../services/subscriptions/featureAccess';
import { useExercisePaywallGate } from '../exercise/shared/hooks/useExercisePaywallGate';

interface UseOpenAttentionResetOptions {
  activityId: string;
  exerciseAccess: FeatureAccessState;
  sourceScreen: string;
  sourceAction: string;
}

/** Opens a guided attention Reset from the library, behind the library's Pro gate. */
export function useOpenAttentionReset({
  activityId,
  exerciseAccess,
  sourceScreen,
  sourceAction,
}: UseOpenAttentionResetOptions) {
  const navigation = useNavigation<RootStackNavigationProp>();
  const passGate = useExercisePaywallGate({
    access: exerciseAccess,
    feature: FeatureKey.ExerciseLibrary,
    sourceScreen,
  });

  return () => {
    triggerTapHaptic();
    if (!passGate(sourceAction)) return;
    navigation.navigate('AttentionSession', { activityId });
  };
}
