import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import type { RootStackNavigationProp } from '../../../../app/navigation';
import type { FeatureAccessState } from '../../../../hooks/useFeatureAccess';
import { AnalyticsEvent } from '../../../../services/analytics/events';
import { trackFeatureGateHit } from '../../../../services/analytics/tracking';
import { PaywallPlacement } from '../../../../services/paywall';
import { FeatureKey, type FeatureKeyValue } from '../../../../services/subscriptions/featureAccess';
import { triggerTapHaptic } from '../../../../native/tapHaptics';
import { formatPattern, type BreathingTechnique } from '../../guidedBreathing/techniques';

export type BreathingTechniqueSourceScreen =
  | 'Explore'
  | 'ExerciseSearch'
  | 'Home'
  | 'MoodCheckIn';

export type BreathingTechniqueSourceAction =
  | 'breathing_library'
  | 'exercise_search_result'
  | 'extra_practice'
  | 'mood_suggestion';

interface UseOpenBreathingTechniqueOptions {
  technique: BreathingTechnique;
  recommended?: boolean;
  exerciseAccess: FeatureAccessState;
  feature?: FeatureKeyValue;
  sourceScreen: BreathingTechniqueSourceScreen;
  sourceAction: BreathingTechniqueSourceAction;
  /**
   * Fired once the gate has passed and the session is about to open, for a
   * caller with something of its own to record about the choice. It never runs
   * on the paywall path: a technique somebody was shown a paywall for was not
   * a technique they started.
   */
  onOpened?: () => void;
  /**
   * Whether the caller is still there when the session ends.
   *
   * `push` for a screen the user chose the exercise from and should come back
   * to: the library, a search result, Home. `replace` for one that has already
   * finished its job by the time it makes the offer — the check-in is answered
   * and stored before the suggestion exists, so it is swapped for the session
   * rather than left underneath it, where quitting would drop the user back
   * onto a question they have already answered.
   *
   * It is also what makes that transition one move. A caller that stays has to
   * be dismissed first, and a screen covering the whole display cannot be
   * dismissed without showing what is behind it on the way out.
   *
   * The paywall is pushed either way: it is presented over whatever asked for
   * it, and somebody who declines it should land back on the offer.
   */
  openAs?: 'push' | 'replace';
}

export function useOpenBreathingTechnique({
  technique,
  recommended = false,
  exerciseAccess,
  feature = FeatureKey.DailyExercise,
  sourceScreen,
  sourceAction,
  onOpened,
  openAs = 'push',
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
        feature,
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen,
        sourceAction,
        access: exerciseAccess,
      });
      navigation.navigate('ProPaywall', {
        placement: PaywallPlacement.ExercisePremiumGate,
        sourceScreen,
        sourceAction,
        feature,
      });
      return;
    }

    onOpened?.();
    if (openAs === 'replace') {
      navigation.replace('ExerciseSession', { techniqueId: technique.id });
      return;
    }
    navigation.navigate('ExerciseSession', { techniqueId: technique.id });
  };
}
