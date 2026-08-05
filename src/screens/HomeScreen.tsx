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
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useRecommendedTechnique } from '../features/exercise/guidedBreathing/hooks/useRecommendedTechnique';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import type { HomeScreenProps } from '../app/navigation';
import { useHomeStatsQuery } from '../queries/tracking/useHomeStatsQuery';
import { useAuthStore } from '../stores/authStore';
import { useDailyPlanScheduleQuery } from '../queries/dailyPlan/useDailyPlanScheduleQuery';
import { DEFAULT_DAILY_PLAN_SCHEDULE } from '../services/dailyPlan/types';
import { useDailyExercisePlan } from '../features/exercise/guidedBreathing/hooks/useDailyExercisePlan';
import { getTechnique } from '../features/exercise/guidedBreathing/techniques';
import { useCompletedBreathingTechniqueIdsQuery } from '../queries/tracking/useCompletedBreathingTechniqueIdsQuery';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import HomeTreeHero from '../features/garden/components/HomeTreeHero';
import { buildHomeTreeProgress } from '../features/garden/domain/homeTreeProgress';
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
  const profileQuery = useProfileQuery(user?.id ?? null);
  const profileSummaryQuery = useProfileSummaryQuery(user?.id ?? null);
  const dailyPlanScheduleQuery = useDailyPlanScheduleQuery(user?.id ?? null);
  const dailyPlanSchedule =
    dailyPlanScheduleQuery.data ?? DEFAULT_DAILY_PLAN_SCHEDULE;
  const dailyExerciseAccess = useFeatureAccess(FeatureKey.DailyExercise);
  const recommendedTechnique = useRecommendedTechnique(user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const dailyExercisePlan = useDailyExercisePlan({
    userId: user?.id ?? null,
    primaryTechniqueId: recommendedTechnique.isLoading
      ? undefined
      : recommendedTechnique.technique?.id ?? null,
    onboardingCompletedAt:
      profileQuery.isSuccess && !profileQuery.isPlaceholderData
      ? profileQuery.data?.onboardingCompletedAt ?? null
      : undefined,
    todayLocalDate,
  });
  const handPickedTechnique = getTechnique(dailyExercisePlan.techniqueId);
  const completedTechniqueIdsQuery = useCompletedBreathingTechniqueIdsQuery(
    user?.id ?? null,
    todayLocalDate,
  );
  const homeStatsQuery = useHomeStatsQuery(user?.id ?? null, todayLocalDate);
  const stats = homeStatsQuery.data;

  // The recently-logged list and its analytics now live on the Heart tab
  // (see RecentlyLoggedSection — it uses useIsFocused to gate the view event).

  const currentStreak = stats?.streak?.currentStreak ?? 0;
  const todayActivity = stats?.dailyActivity.find(
    (activity) => activity.activityDate === todayLocalDate,
  );
  const completedTechniqueIds = completedTechniqueIdsQuery.data ?? [];
  const guidedExerciseCompleted = recommendedTechnique.technique != null &&
    completedTechniqueIds.includes(recommendedTechnique.technique.id);
  const handPickedExerciseCompleted = handPickedTechnique != null &&
    completedTechniqueIds.includes(handPickedTechnique.id);
  const breathHoldCompleted = todayActivity?.dailyBreathHoldCompleted ?? false;
  const treeProgressUnavailable =
    profileSummaryQuery.data?.partialErrors.activeDays === true;
  const treeProgress = profileSummaryQuery.data == null || treeProgressUnavailable
    ? null
    : buildHomeTreeProgress(profileSummaryQuery.data.activeDays);
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
    const technique = recommendedTechnique.technique;
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
    if (handPickedTechnique == null) return;

    if (!dailyExerciseAccess.allowed && !dailyExerciseAccess.isLoading) {
      showProPaywall(
        FeatureKey.DailyExercise,
        PaywallPlacement.ExercisePremiumGate,
        dailyExerciseAccess,
        'todays_dailies_hand_picked',
      );
      return;
    }

    navigation.navigate('ExerciseSession', {
      techniqueId: handPickedTechnique.id,
    });
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
        <AppTopBar tinted showAvatar={false} showStreak={false}>
          <View style={styles.weekCalendar}>
            <WeekCalendarStrip
              todayLocalDate={todayLocalDate}
              completedDaysAgo={stats?.completedDaysAgo ?? []}
            />
          </View>
        </AppTopBar>

        <View style={styles.bodySection}>
          <HomeTreeHero
            progress={treeProgress}
            progressUnavailable={treeProgressUnavailable}
          />
          <TodaysDailiesSection
            technique={recommendedTechnique.technique}
            techniqueLoading={recommendedTechnique.isLoading}
            sessionTime={dailyPlanSchedule.actions.session}
            handPickedTechnique={handPickedTechnique}
            handPickedTechniqueLoading={dailyExercisePlan.isLoading}
            handPickedTime={dailyPlanSchedule.actions.handPicked}
            breathHoldTime={dailyPlanSchedule.actions.checkIn}
            guidedExerciseCompleted={guidedExerciseCompleted}
            handPickedExerciseCompleted={handPickedExerciseCompleted}
            breathHoldCompleted={breathHoldCompleted}
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
    gap: margin.sectionGap,
  },
  weekCalendar: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  bodySection: {
    paddingHorizontal: padding.screen.horizontal,
    gap: spacing.md,
  },
});
