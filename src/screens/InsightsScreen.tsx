import { useMemo, useCallback, type ComponentRef } from 'react';
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
import TabTitleRow from '../components/common/TabTitleRow';
import PlanCalendar from '../features/plan/PlanCalendar';
import PlanHeroCard from '../features/plan/PlanHeroCard';
import PlanStartEmptyState from '../features/plan/PlanStartEmptyState';
import PlanChoicePicker from '../features/plan/PlanChoicePicker';
import PlanFinishedState from '../features/plan/PlanFinishedState';
import { planCalendar } from '../features/plan/domain/planCalendar';
import { planStartOffer } from '../features/plan/domain/planStart';
import { useAzoraScore } from '../features/plan/useAzoraScore';
import { usePlanPositionState } from '../hooks/usePlanPosition';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useSavedOnboardingProfileQuery } from '../queries/profile/useSavedOnboardingProfileQuery';
import { useStartProgramEnrollmentMutation } from '../queries/program/useStartProgramEnrollmentMutation';
import { useUserEntitlementQuery } from '../queries/subscriptions/useUserEntitlementQuery';
import { ONBOARDING_INTENT_LOOKUP_OPTIONS } from '../components/onboarding/data/intentOptions';
import { buildIntentTitleLookup, planPositionLabel } from '../lib/planProgress';
import { useAuthStore } from '../stores/authStore';
import { PaywallPlacement } from '../services/paywall';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import { useTourScroller, useTourTarget } from '../features/tour/tourTargets';

/** Measured, the way Home measures it: the native tab bar cannot be asked. */
const TAB_BAR_HEIGHT = 49;
/** Built once, the same lookup the onboarding seal resolves its plan through. */
const INTENT_TITLES = buildIntentTitleLookup(ONBOARDING_INTENT_LOOKUP_OPTIONS);

export default function InsightsScreen({ navigation }: InsightsScreenProps) {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingTitle();
  const contentInset = useCollapsingContentInset();
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const entitlementQuery = useUserEntitlementQuery(userId);
  const isPro = entitlementQuery.data?.isPro === true;
  const { position, isLoading, isError, hasEnrollment, refetch } =
    usePlanPositionState(userId);
  const { score, isLoading: scoreLoading } = useAzoraScore(userId);
  const todayLocalDate = useTodayLocalDate();
  const azoraScoreTarget = useTourTarget('azoraScore');
  const tourScroll = useTourScroller<ComponentRef<typeof Animated.ScrollView>>([
    'azoraScore',
  ]);

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
        {...tourScroll}
        style={styles.scroll}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: contentInset,
          paddingBottom: tabBarHeight + spacing.xl,
        }}
        onScroll={onScroll}
        onScrollEndDrag={tourScroll.onScroll}
        onMomentumScrollEnd={tourScroll.onScroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent width="grouped">
          <TabTitleRow title="Your Plan" />
        </ScreenContent>

        {showPlanHero && position != null ? (
          <ScreenContent width="grouped" style={styles.scoreCard}>
            <View {...azoraScoreTarget}>
              <PlanHeroCard
                score={score}
                position={planPositionLabel(position)}
                isLoading={scoreLoading}
              />
            </View>
          </ScreenContent>
        ) : null}

        {showFinished && position != null ? (
          <ScreenContent width="grouped" style={styles.planStateScreen}>
            <PlanFinishedState
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
          <ScreenContent width="grouped" style={styles.planStateScreen}>
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
  scoreCard: {
    paddingHorizontal: padding.screen.horizontal,
    paddingBottom: spacing.lg,
  },
  column: {
    gap: spacing.md,
    paddingHorizontal: padding.screen.horizontal,
  },
  planStateScreen: {
    flexGrow: 1,
    justifyContent: 'center',
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
