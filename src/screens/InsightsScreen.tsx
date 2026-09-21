import { useMemo, useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';
import type { InsightsScreenProps } from '../app/navigation';
import { Text } from '../components/common/Text';
import CollapsingTitleBar, {
  useCollapsingContentInset,
  useCollapsingTitle,
} from '../components/common/CollapsingTitleBar';
import ScreenContent from '../components/common/ScreenContent';
import SectionHeader from '../components/common/SectionHeader';
import ProfileCompletionCalendarCard from '../components/profile/ProfileCompletionCalendarCard';
import HotelEntryCard from '../features/room/HotelEntryCard';
import Icon from '../components/common/icons/Icon';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { triggerTapHaptic } from '../native/tapHaptics';
import PlanCalendar from '../features/plan/PlanCalendar';
import PlanHeroCard from '../features/plan/PlanHeroCard';
import PlanStartEmptyState from '../features/plan/PlanStartEmptyState';
import PlanChoicePicker from '../features/plan/PlanChoicePicker';
import PlanFinishedState from '../features/plan/PlanFinishedState';
import PlanAnalyticsSection from '../features/plan/PlanAnalyticsSection';
import { weeklyReview } from '../features/plan/domain/weeklyReview';
import {
  factorEffects,
  moodTrend,
  resetEffect,
} from '../features/plan/domain/moodAnalytics';
import { planCalendar } from '../features/plan/domain/planCalendar';
import { planStartOffer } from '../features/plan/domain/planStart';
import { useAzoraScore } from '../features/plan/useAzoraScore';
import { usePlanPositionState } from '../hooks/usePlanPosition';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useDailyActivityRangeQuery } from '../queries/tracking/useDailyActivityRangeQuery';
import { useRecentMoodCheckInsQuery } from '../queries/mood/useRecentMoodCheckInsQuery';
import { useSavedOnboardingProfileQuery } from '../queries/profile/useSavedOnboardingProfileQuery';
import { useStartProgramEnrollmentMutation } from '../queries/program/useStartProgramEnrollmentMutation';
import { useUserEntitlementQuery } from '../queries/subscriptions/useUserEntitlementQuery';
import { INTENT_OPTIONS } from '../components/onboarding/data/intentOptions';
import { buildIntentTitleLookup, planPositionLabel } from '../lib/planProgress';
import { useAuthStore } from '../stores/authStore';
import { PaywallPlacement } from '../services/paywall';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

/** Measured, the way Home measures it: the native tab bar cannot be asked. */
const TAB_BAR_HEIGHT = 49;
/** A month of mood: long enough to show a shape, short enough to read. */
const TREND_DAYS = 30;
/**
 * Days of activity the analytics read.
 *
 * Eight weeks supports the reset comparison.
 *
 * Rows of `daily_activity`, not calendar days, so a sparse user's eight weeks
 * reach back further than eight weeks. `resetEffect` is handed this number so
 * it can tell a full page from a complete history.
 */
const ACTIVITY_DAYS = 56;
/** Built once, the same lookup the onboarding seal resolves its plan through. */
const INTENT_TITLES = buildIntentTitleLookup(INTENT_OPTIONS);

export default function InsightsScreen({ navigation }: InsightsScreenProps) {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingTitle();
  const contentInset = useCollapsingContentInset();
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const profileSummaryQuery = useProfileSummaryQuery(userId);
  const profileSummary = profileSummaryQuery.data;
  const entitlementQuery = useUserEntitlementQuery(userId);
  const isPro = entitlementQuery.data?.isPro === true;
  const { position, isLoading, isError, hasEnrollment, refetch } =
    usePlanPositionState(userId);
  const { score, isLoading: scoreLoading } = useAzoraScore(userId);
  const todayLocalDate = useTodayLocalDate();
  const activityQuery = useDailyActivityRangeQuery(userId, ACTIVITY_DAYS);
  // Two months keeps the consistency calendar filled at month boundaries.
  const moodCheckInsQuery = useRecentMoodCheckInsQuery(userId, 62);

  // Last week and the week before it, from two queries the app already makes.
  const review = useMemo(
    () =>
      weeklyReview(
        activityQuery.data ?? [],
        moodCheckInsQuery.data ?? [],
        todayLocalDate,
      ),
    [activityQuery.data, moodCheckInsQuery.data, todayLocalDate],
  );
  // Both findings return null until the days behind them can carry one.
  const reset = useMemo(
    () =>
      resetEffect(
        moodCheckInsQuery.data ?? [],
        activityQuery.data ?? [],
        ACTIVITY_DAYS,
      ),
    [activityQuery.data, moodCheckInsQuery.data],
  );
  const factors = useMemo(
    () => factorEffects(moodCheckInsQuery.data ?? []),
    [moodCheckInsQuery.data],
  );
  const trend = useMemo(
    () => moodTrend(moodCheckInsQuery.data ?? [], todayLocalDate, TREND_DAYS),
    [moodCheckInsQuery.data, todayLocalDate],
  );

  // Only for somebody with no plan, and only to name the one they would get.
  const savedProfile = useSavedOnboardingProfileQuery(userId, !hasEnrollment);
  const startPlan = useStartProgramEnrollmentMutation(userId);
  const offer = useMemo(
    () => planStartOffer(savedProfile.data?.onboardingGoal, INTENT_TITLES),
    [savedProfile.data?.onboardingGoal],
  );

  const isBusy = isLoading || (!hasEnrollment && savedProfile.isPending);
  // No enrollment at all: an account that finished onboarding before plans
  // existed. The offer is the only way they will ever get one.
  const showStart = !isBusy && position == null && !hasEnrollment && !isError;

  // The plan as days, which is what the screen draws. The authored phase copy
  // below is read only for the one line the current phase gets.
  const calendar = useMemo(
    () => (position == null ? null : planCalendar(position.planId, position.daysDone)),
    [position],
  );

  const handleLockedWeekTap = useCallback(() => {
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.PlanWeekProGate,
      sourceScreen: 'Insights',
      sourceAction: 'locked_week_tap',
    });
  }, [navigation]);

  const showFinished =
    !isBusy && position != null && calendar != null && position.isFinished;
  const showPlanHero =
    !isBusy && position != null && calendar != null && !position.isFinished;

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: contentInset,
          paddingBottom: tabBarHeight + spacing.xl,
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent width="grouped" style={styles.titleRow}>
          <Text style={styles.largeTitle}>Your Plan</Text>
        </ScreenContent>

        {showPlanHero && position != null ? (
          <ScreenContent width="grouped" style={styles.scoreCard}>
            <PlanHeroCard
              score={score}
              position={planPositionLabel(position)}
              isLoading={scoreLoading}
            />
          </ScreenContent>
        ) : null}

        <ScreenContent width="grouped" style={styles.profileColumn}>
          <HotelEntryCard />
          <SectionHeader
            title="Consistency"
            right={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open your history"
                hitSlop={spacing.sm}
                onPress={() => {
                  triggerTapHaptic();
                  navigation.navigate('History');
                }}
                style={styles.sectionLink}
              >
                <Text style={styles.sectionLinkText}>See all</Text>
                <Icon name="chevron-right" size={16} color={colors.text.brand} />
              </Pressable>
            }
          />
          <ProfileCompletionCalendarCard
            completedDays={profileSummary?.completedDays ?? []}
            moodEntries={moodCheckInsQuery.data ?? []}
            onSelectDay={(date) => navigation.navigate('History', { date })}
          />
        </ScreenContent>

        {showFinished && position != null ? (
          <ScreenContent width="grouped" style={styles.planStateColumn}>
            <PlanFinishedState
              planName={position.planName}
              totalWeeks={position.totalWeeks}
            />
            <PlanChoicePicker
              onStart={(planId) => {
                startPlan.mutate({ planId, enrolledOn: todayLocalDate });
              }}
              isStarting={startPlan.isPending}
              hasFailed={startPlan.isError}
            />
          </ScreenContent>
        ) : showStart ? (
          <ScreenContent width="grouped" style={styles.planStateColumn}>
            <PlanStartEmptyState
              offer={offer}
              onStart={() => {
                startPlan.mutate({
                  planId: offer.planId,
                  enrolledOn: todayLocalDate,
                });
              }}
              isStarting={startPlan.isPending}
              hasFailed={startPlan.isError}
            />
          </ScreenContent>
        ) : (
          <ScreenContent width="grouped" style={styles.column}>
            {isBusy ? (
              <ActivityIndicator color={colors.text.tertiary} />
            ) : position == null || calendar == null ? (
              <View style={[card.base, card.shadow, styles.header]}>
                <Text style={styles.planName}>
                  {isError
                    ? 'Your plan couldn’t load'
                    : 'Your plan needs a newer app'}
                </Text>
                <Text style={styles.position}>
                  {isError
                    ? 'Please try again to see your progress.'
                    : 'Update the app to see this plan and its progress.'}
                </Text>
                {isError && (
                  <Pressable accessibilityRole="button" onPress={() => { void refetch(); }}>
                    <Text style={styles.position}>Try again</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <>
                <SectionHeader icon="stat-health-spark" title="Insights" />

                <PlanAnalyticsSection
                  review={review}
                  daysAnswered={moodCheckInsQuery.data?.length ?? 0}
                  trend={trend}
                  reset={reset}
                  factors={factors}
                />

                <SectionHeader icon="calendar" title="Your weeks" />

                <PlanCalendar
                  calendar={calendar}
                  isPro={isPro}
                  onLockedWeekTap={handleLockedWeekTap}
                />
              </>
            )}
          </ScreenContent>
        )}
      </Animated.ScrollView>

      <CollapsingTitleBar title="Your Plan" scrollY={scrollY} />
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
  },
  titleRow: {
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: spacing['2xl'],
  },
  largeTitle: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  profileColumn: {
    gap: spacing.lg,
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: spacing.xl,
  },
  scoreCard: {
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: spacing.lg,
  },
  sectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionLinkText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.brand,
  },
  column: {
    gap: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
  },
  planStateColumn: {
    gap: spacing.lg,
    paddingHorizontal: padding.screen.horizontal,
  },
  header: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  planName: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  position: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
});
