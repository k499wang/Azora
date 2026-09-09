import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import type { RootStackNavigationProp } from '../../../../app/navigation';
import type { FeatureAccessState } from '../../../../hooks/useFeatureAccess';
import { AnalyticsEvent } from '../../../../services/analytics/events';
import { trackFeatureGateHit } from '../../../../services/analytics/tracking';
import { PaywallPlacement } from '../../../../services/paywall';
import { FeatureKey } from '../../../../services/subscriptions/featureAccess';
import { triggerTapHaptic } from '../../../../native/tapHaptics';
import { formatPattern, type BreathingTechnique } from '../../guidedBreathing/techniques';

export type BreathingTechniqueSourceScreen =
  | 'Explore'
  | 'ExerciseSearch'
  | 'Home';

export type BreathingTechniqueSourceAction =
  | 'breathing_library'
  | 'exercise_search_result'
  | 'extra_practice';

interface UseOpenBreathingTechniqueOptions {
  technique: BreathingTechnique;
  recommended?: boolean;
  exerciseAccess: FeatureAccessState;
  sourceScreen: BreathingTechniqueSourceScreen;
  sourceAction: BreathingTechniqueSourceAction;
}

export function useOpenBreathingTechnique({
  technique,
  recommended = false,
  exerciseAccess,
  sourceScreen,
  sourceAction,
}: UseOpenBreathingTechniqueOptions) {
  const navigation = useNavigation<RootStackNavigationProp>();
  const posthog = usePostHog();

  return () => {
    triggerTapHaptic();
    posthog.capture(AnalyticsEvent.BreathingTechniqueSelected, {
      technique_id: technique.id,
      technique_name: technique.name,
      technique_category: technique.category,
      pattern: formatPattern(technique.pattern),
      recommended,
      source_screen: sourceScreen,
      source_action: sourceAction,
    });

    if (!exerciseAccess.allowed && !exerciseAccess.isLoading) {
      trackFeatureGateHit({
        feature: FeatureKey.DailyExercise,
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen,
        sourceAction,
        access: exerciseAccess,
      });
      navigation.navigate('ProPaywall', {
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen,
        sourceAction,
        feature: FeatureKey.DailyExercise,
      });
      return;
    }

    navigation.navigate('ExerciseSession', { techniqueId: technique.id });
  };
}
