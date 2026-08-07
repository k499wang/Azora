import { useCallback } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { usePostHog } from 'posthog-react-native';
import { AnalyticsEvent } from '../services/analytics/events';
import { trackFeatureGateHit } from '../services/analytics/tracking';
import { colors } from '../theme/colors';
import { spacing, padding, margin } from '../theme/spacing';
import AppTopBar from '../components/common/AppTopBar';
import CompactActionBanner from '../components/common/CompactActionBanner';
import WeekCalendarStrip from '../components/common/WeekCalendarStrip';
import TodaysDailiesSection from '../components/home/TodaysDailiesSection';
import HomeRoom from '../features/room/HomeRoom';
import { useDailiesCompletion } from '../hooks/useDailiesCompletion';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import type { HomeScreenProps } from '../app/navigation';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';
import { useAuthStore } from '../stores/authStore';
import { useDailyPlanScheduleQuery } from '../queries/dailyPlan/useDailyPlanScheduleQuery';
import { DEFAULT_DAILY_PLAN_SCHEDULE } from '../services/dailyPlan/types';
import { PaywallPlacement } from '../services/paywall';
import { FeatureKey } from '../services/subscriptions/featureAccess';
import type {
  FeatureAccessResult,
  FeatureKeyValue,
} from '../services/subscriptions/featureAccess';

const SURVEY_DISCOUNT_URL = 'https://docs.google.com/forms/d/1wdbzWnXbhdpFZ3HoPcRet5K7EGW9RRtEQqrVYiXHwtc/viewform?edit_requested=true';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const posthog = usePostHog();
  const user = useAuthStore((state) => state.user);
  const dailyPlanScheduleQuery = useDailyPlanScheduleQuery(user?.id ?? null);
  const dailyPlanSchedule =
    dailyPlanScheduleQuery.data ?? DEFAULT_DAILY_PLAN_SCHEDULE;
  const dailyExerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const dailies = useDailiesCompletion(user?.id ?? null);
  const todayLocalDate = dailies.todayLocalDate;
  const homeStatsQuery = useHomeStatsQuery(user?.id ?? null, todayLocalDate);
  const stats = homeStatsQuery.data;

  // The recently-logged list and its analytics now live on the Heart tab
  // (see RecentlyLoggedSection — it uses useIsFocused to gate the view event).

  const currentStreak = stats?.streak?.currentStreak ?? 0;
  const showProPaywall = useCallback((
    feature: FeatureKeyValue,
    placement: typeof PaywallPlacement[keyof typeof PaywallPlacement],
    access: FeatureAccessResult,
    sourceAction?: string,
  ) => {
    trackFeatureGateHit({
      feature,
      placement,
      sourceScreen: 'Home',
      sourceAction,
      access,
    });
    navigation.navigate('ProPaywall', {
      placement,
      sourceScreen: 'Home',
      sourceAction,
      feature,
    });
  }, [navigation]);

  const startGuidedExercise = () => {
    const technique = dailies.guidedTechnique;
    if (technique == null) return;

    if (!dailyExerciseAccess.allowed && !dailyExerciseAccess.isLoading) {
      showProPaywall(
        FeatureKey.DailyExercise,
        PaywallPlacement.ExercisePremiumGate,
        dailyExerciseAccess,
        'todays_dailies_guided',
      );
      return;
    }

    navigation.navigate('ExerciseSession', { techniqueId: technique.id });
  };

  const startHandPickedExercise = () => {
    const technique = dailies.handPickedTechnique;
    if (technique == null) return;

    if (!dailyExerciseAccess.allowed && !dailyExerciseAccess.isLoading) {
      showProPaywall(
        FeatureKey.DailyExercise,
        PaywallPlacement.ExercisePremiumGate,
        dailyExerciseAccess,
        'todays_dailies_hand_picked',
      );
      return;
    }

    navigation.navigate('ExerciseSession', { techniqueId: technique.id });
  };

  const startDailyBreathHold = (sourceAction: string) => {
    posthog.capture(AnalyticsEvent.DailyPlanStarted, {
      streak_days: currentStreak,
    });

    if (!dailyExerciseAccess.allowed && !dailyExerciseAccess.isLoading) {
      showProPaywall(
        FeatureKey.DailyExercise,
        PaywallPlacement.ExercisePremiumGate,
        dailyExerciseAccess,
        sourceAction,
      );
      return;
    }

    navigation.navigate('DailyExercise');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
        alwaysBounceVertical
        overScrollMode="always"
      >
        <AppTopBar>
          <View style={styles.weekCalendar}>
            <WeekCalendarStrip
              todayLocalDate={todayLocalDate}
              completedDaysAgo={stats?.completedDaysAgo ?? []}
            />
          </View>
        </AppTopBar>

        <HomeRoom />

        <View style={styles.bodySection}>
          <TodaysDailiesSection
            technique={dailies.guidedTechnique}
            techniqueLoading={dailies.guidedTechniqueLoading}
            sessionTime={dailyPlanSchedule.actions.session}
            handPickedTechnique={dailies.handPickedTechnique}
            handPickedTechniqueLoading={dailies.handPickedTechniqueLoading}
            handPickedTime={dailyPlanSchedule.actions.handPicked}
            breathHoldTime={dailyPlanSchedule.actions.checkIn}
            guidedExerciseCompleted={dailies.guidedCompleted}
            handPickedExerciseCompleted={dailies.handPickedCompleted}
            breathHoldCompleted={dailies.breathHoldCompleted}
            exerciseAccessAllowed={
              dailyExerciseAccess.allowed || dailyExerciseAccess.isLoading
            }
            onPressGuidedExercise={startGuidedExercise}
            onPressHandPickedExercise={startHandPickedExercise}
            onPressBreathHold={() => startDailyBreathHold('todays_dailies_breathhold')}
          />
          <CompactActionBanner
            icon="message"
            label="Take a survey and get 50% off"
            onPress={() => void Linking.openURL(SURVEY_DISCOUNT_URL)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: spacing['7xl'] + spacing.xl,
    gap: margin.itemGap,
  },
  weekCalendar: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.md,
  },
  bodySection: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
});
