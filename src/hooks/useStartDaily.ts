import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { usePostHog } from 'posthog-react-native';
import { useFeatureAccess } from './useFeatureAccess';
import { AnalyticsEvent } from '../services/analytics/events';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { useAuthStore } from '../stores/authStore';
import type { RootStackNavigationProp } from '../app/navigation';
import type { DailiesCompletion } from './useDailiesCompletion';

export type DailyId = 'guided' | 'handPicked' | 'breathHold';

export interface StartDaily {
  start: (daily: DailyId) => void;
  /** true while access is still resolving, so callers do not flash a lock */
  accessAllowed: boolean;
}

const SOURCE_ACTION: Record<DailyId, string> = {
  guided: 'todays_dailies_guided',
  handPicked: 'todays_dailies_hand_picked',
  breathHold: 'todays_dailies_breathhold',
};

/**
 * Starting one of today's dailies, with the Pro gate applied.
 *
 * Home and the post-session banner both offer this, and the gating is the part
 * that must not drift — a second copy is how a screen ends up launching a
 * locked exercise.
 */
type StartDailyTechniques = Pick<
  DailiesCompletion,
  'guidedTechnique' | 'handPickedTechnique'
>;

export function useStartDaily(
  sourceScreen: string,
  dailies: StartDailyTechniques,
): StartDaily {
  const navigation = useNavigation<RootStackNavigationProp>();
  const posthog = usePostHog();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const access = useFeatureAccess(FeatureKey.DailyExercise);
  const profileSummary = useProfileSummaryQuery(userId).data;

  const { guidedTechnique, handPickedTechnique } = dailies;

  const start = useCallback(
    (daily: DailyId) => {
      const technique =
        daily === 'guided'
          ? guidedTechnique
          : daily === 'handPicked'
            ? handPickedTechnique
            : null;

      if (daily !== 'breathHold' && technique == null) return;

      if (daily === 'breathHold') {
        posthog.capture(AnalyticsEvent.DailyPlanStarted, {
          streak_days: profileSummary?.currentStreak ?? 0,
        });
      }

      if (!access.allowed && !access.isLoading) {
        trackFeatureGateHit({
          feature: FeatureKey.DailyExercise,
          placement: PaywallPlacement.ExercisePremiumGate,
          sourceScreen,
          sourceAction: SOURCE_ACTION[daily],
          access,
        });
        navigation.navigate('ProPaywall', {
          placement: PaywallPlacement.ExercisePremiumGate,
          sourceScreen,
          sourceAction: SOURCE_ACTION[daily],
          feature: FeatureKey.DailyExercise,
        });
        return;
      }

      if (daily === 'breathHold') {
        navigation.navigate('DailyExercise');
        return;
      }

      navigation.navigate('ExerciseSession', {
        techniqueId: (technique as { id: string }).id,
      });
    },
    [
      access,
      guidedTechnique,
      handPickedTechnique,
      navigation,
      posthog,
      profileSummary?.currentStreak,
      sourceScreen,
    ],
  );

  return { start, accessAllowed: access.allowed || access.isLoading };
}
