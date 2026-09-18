import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  useFeatureAccess,
  type FeatureAccessState,
} from './useFeatureAccess';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import type { RootStackNavigationProp } from '../app/navigation';
import type { DailiesCompletion } from './useDailiesCompletion';

export type DailyId = 'guided' | 'handPicked';

export interface StartDaily {
  start: (daily: DailyId) => void;
  /**
   * Starts any technique the plan prescribes, behind the same gate.
   *
   * The program day names its own exercises, so there is no fixed set of two to
   * switch on any more. The gating is the part that must not drift — a second
   * copy is how a screen ends up launching a locked exercise.
   */
  startTechnique: (techniqueId: string, sourceAction: string, durationMinutes?: number) => void;
  /** true while access is still resolving, so callers do not flash a lock */
  accessAllowed: boolean;
  /** shared with other Home exercise entry points to avoid another observer */
  exerciseAccess: FeatureAccessState;
}

const SOURCE_ACTION: Record<DailyId, string> = {
  guided: 'todays_dailies_guided',
  handPicked: 'todays_dailies_hand_picked',
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
  const access = useFeatureAccess(FeatureKey.DailyExercise);

  const { guidedTechnique, handPickedTechnique } = dailies;

  const startTechnique = useCallback(
    (techniqueId: string, sourceAction: string, durationMinutes?: number) => {
      if (!access.allowed && !access.isLoading) {
        trackFeatureGateHit({
          feature: FeatureKey.DailyExercise,
          placement: PaywallPlacement.ExercisePremiumGate,
          sourceScreen,
          sourceAction,
          access,
        });
        navigation.navigate('ProPaywall', {
          placement: PaywallPlacement.ExercisePremiumGate,
          sourceScreen,
          sourceAction,
          feature: FeatureKey.DailyExercise,
        });
        return;
      }

      navigation.navigate('ExerciseSession', { techniqueId, durationMinutes });
    },
    [access, navigation, sourceScreen],
  );

  const start = useCallback(
    (daily: DailyId) => {
      const technique =
        daily === 'guided' ? guidedTechnique : handPickedTechnique;

      if (technique == null) return;

      startTechnique(technique.id, SOURCE_ACTION[daily]);
    },
    [guidedTechnique, handPickedTechnique, startTechnique],
  );

  return {
    start,
    startTechnique,
    accessAllowed: access.allowed || access.isLoading,
    exerciseAccess: access,
  };
}
