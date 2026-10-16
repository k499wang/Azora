import { useIsFocused } from '@react-navigation/native';
import { useMemo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';
import type { InsightsScreenProps } from '../app/navigation';
import { Text } from '../components/common/Text';
import ChunkyButton from '../components/common/ChunkyButton';
import {
  useCollapsingContentInset,
  useCollapsingTitle,
} from '../components/common/CollapsingTitleBar';
import ScreenContent from '../components/common/ScreenContent';
import TabTitleRow from '../components/common/TabTitleRow';
import TopBarStreak from '../components/common/TopBarStreak';
import AzoraScoreChip from '../features/plan/AzoraScoreChip';
import FirstWinOfDayPresenter from '../features/selfCare/FirstWinOfDayPresenter';
import { usePathDayCompletion } from '../features/plan/usePathDayCompletion';
import RewardAnimationPreload from '../features/plan/RewardAnimationPreload';
import PlanPath from '../features/plan/PlanPath';
import { TopBarWeekBanner } from '../features/plan/PlanWeekBanner';
import PlanStartEmptyState from '../features/plan/PlanStartEmptyState';
import PlanChoicePicker from '../features/plan/PlanChoicePicker';
import PlanFinishedState from '../features/plan/PlanFinishedState';
import TodayJumpButton from '../features/plan/TodayJumpButton';
import { useTodayJump } from '../features/plan/useTodayJump';
import { planCalendar } from '../features/plan/domain/planCalendar';
import { planStartOffer } from '../features/plan/domain/planStart';
import { pathGoldDays } from '../features/plan/domain/pathGold';
import { useProgramDayFinishDatesQuery } from '../queries/program/useProgramDayFinishDatesQuery';
import { useAzoraScore } from '../features/plan/useAzoraScore';
import { usePlanPositionState } from '../hooks/usePlanPosition';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useSavedOnboardingProfileQuery } from '../queries/profile/useSavedOnboardingProfileQuery';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { useStartProgramEnrollmentMutation } from '../queries/program/useStartProgramEnrollmentMutation';
import { useUserEntitlementQuery } from '../queries/subscriptions/useUserEntitlementQuery';
import { ONBOARDING_INTENT_LOOKUP_OPTIONS } from '../components/onboarding/data/intentOptions';
import { pressureLessonTrackForIntent, pressureLessonTrackForEnrollment } from '../features/lessons/domain/pressureLessonTrack';
import { phoneLessonTrackForIntent, phoneLessonTrackForEnrollment } from '../features/lessons/domain/phoneLessonTrack';
import { buildIntentTitleLookup, resolvePlanIntent } from '../lib/planProgress';
import { ARCHETYPE_FOR_PLAN } from '../lib/onboardingArchetype';
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
/** How far the week card rises into the title row's bottom padding. */
const WEEK_BANNER_TUCK = spacing.md;
/** Matches the score skeleton; async stat values must not reflow the title. */
const TITLE_STAT_WIDTH = 78;
/** The plan names today's exercises itself, so the fixed pair is never used. */

export default function InsightsScreen({ navigation, route }: InsightsScreenProps) {
  const previewFinishedPlan = __DEV__ && route.params?.previewFinishedPlan === true;
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingTitle();
  const contentInset = useCollapsingContentInset();
  const [headerBottom, setHeaderBottom] = useState(0);
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const window = useWindowDimensions();
  const floatBottom = Math.max(tabBarHeight, insets.bottom) + spacing.md;
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const isFocused = useIsFocused();
  const entitlementQuery = useUserEntitlementQuery(userId);
  const isPro = entitlementQuery.data?.isPro === true;
  const { position, enrollment, isLoading, isError, hasEnrollment, refetch } =
    usePlanPositionState(userId);
  const planTitle = !previewFinishedPlan && position != null
    ? ARCHETYPE_FOR_PLAN[position.planId].planName
    : 'Your Plan';
  const { score, isLoading: scoreLoading } = useAzoraScore(userId);
  const profileSummary = useProfileSummaryQuery(userId).data;
  const todayLocalDate = useTodayLocalDate();
  const azoraScoreTarget = useTourTarget('azoraScore');
  const planWeeksTarget = useTourTarget('planWeeks');
  const tourScroll = useTourScroller<Animated.ScrollView>([
    'azoraScore',
    'planWeeks',
  ]);
  const pathTop = useSharedValue<number | null>(null);
  const weekTops = useSharedValue<number[]>([]);

  // Read the saved goal when starting a first plan or choosing the next one.
  const needsSavedGoal = !hasEnrollment || position?.isFinished === true;
  const savedProfile = useSavedOnboardingProfileQuery(userId, needsSavedGoal);
  const pressureLessonTrack = pressureLessonTrackForIntent(
    resolvePlanIntent(savedProfile.data?.onboardingGoal, INTENT_TITLES),
  );
  const phoneLessonTrack = phoneLessonTrackForIntent(
    resolvePlanIntent(savedProfile.data?.onboardingGoal, INTENT_TITLES),
  );
  const startPlan = useStartProgramEnrollmentMutation(userId);
  const offer = useMemo(
    () => planStartOffer(savedProfile.data?.onboardingGoal, INTENT_TITLES),
    [savedProfile.data?.onboardingGoal],
  );

  const isBusy = isLoading || (needsSavedGoal && savedProfile.isPending);
  const savedGoalUnavailable = needsSavedGoal && savedProfile.isError && savedProfile.data === undefined;
  // No enrollment at all: an account that finished onboarding before plans
  // existed. The offer is the only way they will ever get one.
  const showStart = !isBusy && position == null && !hasEnrollment && !isError;

  // The plan as days, which is what the screen draws. The authored phase copy
  // below is read only for the one line the current phase gets.
  const calendar = useMemo(
    () =>
      position == null
        ? null
        : planCalendar(position.planId, position.daysDone, position.finishedToday, enrollment?.presetRevision),
    [position, enrollment?.presetRevision],
  );

  const finishDates = useProgramDayFinishDatesQuery(userId, enrollment?.enrollmentId ?? null);
  // Cached dates keep the path mounted during refresh. Gold is decoration:
  // a failed read or dates from the previous enrollment never hides the plan.
  const goldDays = useMemo(
    () => pathGoldDays(finishDates.data ?? [], calendar?.daysDone ?? 0),
    [finishDates.data, calendar?.daysDone],
  );
  const pathWaiting = isBusy || (enrollment != null &&
    (entitlementQuery.isPending || ((calendar?.daysDone ?? 0) > 0 && !finishDates.isSuccess && !finishDates.isError)));
  // The today controls wait for the path, so they are placed by where today really is.
  const [drawnPath, setDrawnPath] = useState<string | null>(null);
  const pathDrawn = enrollment != null && drawnPath === enrollment.enrollmentId;
  const drawnEnrollmentId = enrollment?.enrollmentId ?? null;
  const handlePathDrawn = useCallback(() => setDrawnPath(drawnEnrollmentId), [drawnEnrollmentId]);

  const scrollPlanBy = useCallback(
    (dy: number) => {
      tourScroll.ref.current?.scrollTo({ y: Math.max(0, scrollY.value + dy), animated: true });
    },
    [tourScroll.ref, scrollY],
  );

  const openPlanPaywall = useCallback(
    (sourceAction: string) => {
      navigation.navigate('ProPaywall', {
        placement: PaywallPlacement.PlanWeekProGate,
        sourceScreen: 'Insights',
        sourceAction,
      });
    },
    [navigation],
  );
  const handleLockedWeekTap = useCallback(
    () => openPlanPaywall('locked_week_tap'),
    [openPlanPaywall],
  );

  const completion = usePathDayCompletion(userId);

  const showFinished =
    !isBusy && position != null && calendar != null && position.isFinished;
  const showPlanHero =
    !previewFinishedPlan && !pathWaiting && position != null && calendar != null && !position.isFinished;
  const showWeekBanner =
    showPlanHero && !savedGoalUnavailable && enrollment != null && calendar.weeks.length > 0;
  const visibleBottom = window.height - floatBottom;
  const today = useTodayJump({
    scrollRef: tourScroll.ref,
    scrollY,
    visibleTop: headerBottom,
    visibleBottom,
    nodeKey: `${enrollment?.enrollmentId}:${todayLocalDate}:${position?.daysDone}:${position?.finishedToday}`,
  });

  return (
    <View style={styles.screen}>
      <RewardAnimationPreload pose="proud" enabled={showPlanHero} />
      <View
        style={[styles.topBar, { paddingTop: contentInset }]}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          setHeaderBottom(y + height);
        }}
      >
        <ScreenContent width="grouped">
          <TabTitleRow
            title={planTitle}
            action={
              showPlanHero ? (
                <View style={styles.titlePills}>
                  <View {...azoraScoreTarget}>
                    <AzoraScoreChip score={score} isLoading={scoreLoading} size="compact" />
                  </View>
                  <TopBarStreak
                    size="compact"
                    streakDays={profileSummary?.currentStreak ?? 0}
                  />
                </View>
              ) : undefined
            }
          />
        </ScreenContent>
        {showWeekBanner ? (
          <ScreenContent width="grouped" style={styles.weekBannerColumn}>
            <TopBarWeekBanner
              key={enrollment.enrollmentId}
              weeks={calendar.weeks}
              planId={enrollment.planId}
              presetRevision={enrollment.presetRevision}
              phoneLessonTrack={phoneLessonTrackForEnrollment(enrollment)}
              pressureLessonTrack={pressureLessonTrackForEnrollment(enrollment)}
              isPro={isPro}
              onLockedPress={handleLockedWeekTap}
              scrollY={scrollY}
              pathTop={pathTop}
              weekTops={weekTops}
            />
          </ScreenContent>
        ) : null}
      </View>
      <Animated.ScrollView
        {...tourScroll}
        style={styles.scroll}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: spacing.md,
          paddingBottom: tabBarHeight + spacing.xl,
        }}
        onScroll={onScroll}
        scrollEventThrottle={1}
        onScrollEndDrag={tourScroll.onScroll}
        onMomentumScrollEnd={tourScroll.onScroll}
        onContentSizeChange={today.remeasure}
        onLayout={today.remeasure}
        showsVerticalScrollIndicator={false}
      >
        {savedGoalUnavailable && !previewFinishedPlan ? (
          <ScreenContent width="grouped" style={styles.planStateScreen}>
            <View style={[card.base, card.shadow, styles.header]}>
              <Text style={styles.planName}>Your goal couldn’t load</Text>
              <Text style={styles.position}>Try again so your next plan matches the goal you chose.</Text>
              <Pressable accessibilityRole="button" onPress={() => { void savedProfile.refetch(); }}>
                <Text style={styles.position}>Try again</Text>
              </Pressable>
            </View>
          </ScreenContent>
        ) : previewFinishedPlan || (showFinished && position != null) ? (
          <ScreenContent width="grouped" style={styles.planStateScreen}>
            <PlanFinishedState
              totalWeeks={previewFinishedPlan ? 6 : position?.totalWeeks ?? 6}
            />
            <PlanChoicePicker
              onStart={(planId) => {
                if (previewFinishedPlan) return;
                startPlan.mutate({ planId, pressureLessonTrack, phoneLessonTrack, enrolledOn: todayLocalDate });
              }}
              pressureLessonTrack={pressureLessonTrack}
              isStarting={!previewFinishedPlan && startPlan.isPending}
              hasFailed={!previewFinishedPlan && startPlan.isError}
            />
            {previewFinishedPlan && (
              <>
                <Text style={styles.position}>Preview only — Start buttons won’t change your plan.</Text>
                <ChunkyButton
                  label="Exit preview"
                  onPress={() => navigation.setParams({ previewFinishedPlan: undefined })}
                />
              </>
            )}
          </ScreenContent>
        ) : showStart ? (
          <ScreenContent width="grouped" style={styles.planStateScreen}>
            <PlanStartEmptyState
              offer={offer}
              onStart={() => {
                startPlan.mutate({
                  planId: offer.planId,
                  pressureLessonTrack,
                  phoneLessonTrack,
                  enrolledOn: todayLocalDate,
                });
              }}
              isStarting={startPlan.isPending}
              hasFailed={startPlan.isError}
            />
          </ScreenContent>
        ) : pathWaiting ? (
          <ScreenContent width="grouped" style={styles.planStateScreen}>
            <View style={styles.loading}>
              <ActivityIndicator color={colors.playful.sky.base} />
              <Text style={styles.position}>Loading your plan…</Text>
            </View>
          </ScreenContent>
        ) : (
          <ScreenContent
            width="grouped"
            style={styles.column}
            // The path is this column's first child, so the column's top is the path's.
            onLayout={(event) => { pathTop.value = event.nativeEvent.layout.y; }}
          >
            {position == null || calendar == null || enrollment == null ? (
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
              <View {...planWeeksTarget}>
                <PlanPath
                  key={enrollment.enrollmentId}
                  calendar={calendar}
                  enrollment={enrollment}
                  completion={completion}
                  isPro={isPro}
                  onLockedWeekTap={handleLockedWeekTap}
                  revealTop={headerBottom + spacing.md}
                  onScrollBy={scrollPlanBy}
                  todayRef={today.todayRef}
                  onTodayLayout={today.remeasure}
                  weekTops={weekTops}
                  goldDays={goldDays}
                  onDrawn={handlePathDrawn}
                />
              </View>
            )}
          </ScreenContent>
        )}
      </Animated.ScrollView>

      <TodayJumpButton
        direction={showPlanHero && pathDrawn && (today.placement === 'up' || today.placement === 'down') ? today.placement : null}
        bottom={floatBottom}
        onPress={today.jump}
      />
      <FirstWinOfDayPresenter active={isFocused && !previewFinishedPlan} />
    </View>
  );
}

const styles = StyleSheet.create({
  titlePills: {
    width: TITLE_STAT_WIDTH * 2 + spacing.xs,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.xs,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scroll: {
    flex: 1,
  },
  topBar: {
    backgroundColor: colors.background.canvas,
  },
  weekBannerColumn: {
    marginTop: -WEEK_BANNER_TUCK,
    paddingHorizontal: padding.screen.horizontal,
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
  loading: {
    alignItems: 'center',
    gap: spacing.sm,
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
