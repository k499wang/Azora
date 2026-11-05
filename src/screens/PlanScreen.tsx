import { useCallback, useEffect, useRef, useState, type Ref } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { type ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PlanScreenProps } from '../app/navigation';
import { useCollapsingContentInset } from '../components/common/CollapsingTitleBar';
import ScreenContent from '../components/common/ScreenContent';
import TabTitleRow from '../components/common/TabTitleRow';
import HomeCelebrationLayer, {
  type HomeCelebrationHandle,
} from '../components/home/HomeCelebrationLayer';
import SurveyOfferNotice from '../components/home/SurveyOfferNotice';
import CoinFlightLayer, {
  COIN_FLIGHT_MS,
  type CoinFlightHandle,
} from '../components/common/CoinFlightLayer';
import WalletCoins from '../components/common/WalletCoins';
import TopBarStreak from '../components/common/TopBarStreak';
import PlanWeekStrip, { PLAN_WEEK_STRIP_DAYS } from '../features/plan/PlanWeekStrip';
import TodoListSection from '../features/selfCare/TodoListSection';
import AddGoalSheet from '../features/selfCare/AddGoalSheet';
import { useAddGoalSheet } from '../features/selfCare/useAddGoalSheet';
import RoutineAddMenu, { ROUTINE_ADD_BUTTON_SIZE } from '../features/selfCare/RoutineAddMenu';
import FirstWinOfDayPresenter from '../features/selfCare/FirstWinOfDayPresenter';
import EnjoymentPromptPresenter from '../features/enjoymentPrompt/EnjoymentPromptPresenter';
import { useFirstWinOfDayStore } from '../features/selfCare/firstWinOfDayStore';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';
import { useSurveyOfferNotice } from '../hooks/useSurveyOfferNotice';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { getActiveSelfCareGoalsQueryOptions } from '../queries/selfCare/useActiveSelfCareGoalsQuery';
import { getSelfCareGoalsQueryOptions } from '../queries/selfCare/useSelfCareGoalsQuery';
import { formatLocalDate, parseLocalDate } from '../lib/calendar/weekCalendarDays';
import { useDailyActivityRangeQuery } from '../queries/tracking/useDailyActivityRangeQuery';
import { useAuthStore } from '../stores/authStore';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { radius } from '../theme/card';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { useTourScroller } from '../features/tour/tourTargets';

const TAB_BAR_HEIGHT = 49;
const ROUTINE_HUE = colors.playful.sky;
const NO_ACTIVITY: never[] = [];

export default function PlanScreen({ navigation }: PlanScreenProps) {
  const isFocused = useIsFocused();
  const routineScroll = useAnimatedRef<ScrollView>();
  const routineTourScroll = useTourScroller([
    'routineOverview',
    'routineAddHabit',
  ], routineScroll);
  const celebrations = useRef<HomeCelebrationHandle>(null);
  const coinFlights = useRef<CoinFlightHandle>(null);
  const coinPill = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const contentInset = useCollapsingContentInset();
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const todayLocalDate = useTodayLocalDate();
  const queryClient = useQueryClient();
  // Stable, so the list below is not re-rendered by this screen's own updates —
  // the coin balance changes on every tick, and re-rendering the whole list on
  // each one stalled the animations that tick had just started.
  const browseRoutines = useCallback(() => {
    if (userId != null) {
      void queryClient.prefetchQuery(getActiveSelfCareGoalsQueryOptions(userId, todayLocalDate));
    }
    navigation.navigate('RoutineBrowser');
  }, [navigation, queryClient, userId, todayLocalDate]);
  const planWithAzo = useCallback(() => navigation.navigate('AzoChat', { opener: 'plan' }), [navigation]);
  const brainDump = useCallback(() => navigation.navigate('AzoPlan'), [navigation]);
  const launchCoins = useCallback(
    (earned: Parameters<CoinFlightHandle['launch']>[0]) =>
      coinFlights.current?.launch(earned),
    [],
  );
  const celebrateCompletion = useCallback(
    ({ goalTitle, isFirstWinToday }: { goalTitle: string; isFirstWinToday: boolean }) => {
      if (isFirstWinToday) {
        useFirstWinOfDayStore.getState().show();
        return;
      }
      celebrations.current?.confirm(goalTitle);
      celebrations.current?.burst();
    },
    [],
  );
  // A day picked on an earlier date lapses with it, so a new day opens on itself.
  const [picked, setPicked] = useState<{ on: string; day: string } | null>(null);
  const selectedLocalDate = picked?.on === todayLocalDate ? picked.day : todayLocalDate;
  const selectDay = useCallback(
    (day: string) => setPicked({ on: todayLocalDate, day }),
    [todayLocalDate],
  );
  // This week's days load while the screen is up, so picking one opens on its
  // to-dos instead of a skeleton waiting on the network.
  useEffect(() => {
    if (!isFocused || userId == null) return;
    const today = parseLocalDate(todayLocalDate);
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + day);
      void queryClient.prefetchQuery(getSelfCareGoalsQueryOptions(userId, formatLocalDate(date)));
    }
  }, [isFocused, userId, todayLocalDate, queryClient]);
  const activityQuery = useDailyActivityRangeQuery(userId, PLAN_WEEK_STRIP_DAYS);
  const viewingPastDay = selectedLocalDate < todayLocalDate;
  const viewingLaterDay = selectedLocalDate > todayLocalDate;
  const addGoal = useAddGoalSheet(userId, selectedLocalDate);
  const addButtonBottom = (isRegularWidth ? insets.bottom : tabBarHeight) + spacing.lg;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[ROUTINE_HUE.base, ROUTINE_HUE.mid]}
        style={[styles.block, { paddingTop: contentInset }]}
      >
        <ScreenContent width="grouped">
          <TabTitleRow
            title={routineTitle(selectedLocalDate, todayLocalDate)}
            onBlock
            action={
              <View style={styles.titleActions}>
                <View ref={coinPill} collapsable={false}>
                  <WalletCoins
                    userId={userId}
                    countUpDelayMs={COIN_FLIGHT_MS}
                    size="compact"
                    surface="scrim"
                  />
                </View>
                <RoutineStreak userId={userId} navigation={navigation} />
              </View>
            }
          />
        </ScreenContent>
        <ScreenContent width="grouped" style={styles.weekStrip}>
          <PlanWeekStrip
            hue={ROUTINE_HUE}
            todayLocalDate={todayLocalDate}
            activity={activityQuery.data ?? NO_ACTIVITY}
            selectedLocalDate={selectedLocalDate}
            onSelectDay={selectDay}
          />
        </ScreenContent>
      </LinearGradient>
      <View style={styles.sheet}>
        <Animated.ScrollView
          {...routineTourScroll}
          ref={routineScroll}
          contentContainerStyle={{
            paddingTop: spacing.lg,
            paddingBottom: viewingPastDay
              ? tabBarHeight + spacing.xl
              : addButtonBottom + ROUTINE_ADD_BUTTON_SIZE + spacing.lg,
          }}
          onScrollEndDrag={routineTourScroll.onScroll}
          onMomentumScrollEnd={routineTourScroll.onScroll}
          showsVerticalScrollIndicator={false}
        >
          <ScreenContent width="grouped" style={styles.column}>
            <TodoListSection
              key={`${userId}:${selectedLocalDate}`}
              mode="tasks"
              userId={userId}
              selectedLocalDate={selectedLocalDate}
              readOnly={viewingPastDay || viewingLaterDay}
              upcoming={viewingLaterDay}
              tourOverviewTarget
              scrollRef={routineScroll}
              onAddAt={addGoal.openAt}
              onBrowseRoutines={browseRoutines}
              onCoinsEarned={launchCoins}
              onCompleted={celebrateCompletion}
            />
          </ScreenContent>
        </Animated.ScrollView>
      </View>
      {viewingPastDay ? null : (
        <View style={[styles.addButton, { bottom: addButtonBottom }]}>
          <RoutineAddMenu onPlanWithAzo={planWithAzo} onBrainDump={brainDump} onAddHabit={addGoal.open} />
        </View>
      )}
      <AddGoalSheet {...addGoal.sheet} />
      {/* Both mounted with the screen, not with focus, so the confetti canvases
          and the coin pool are built once rather than on every return. */}
      <RoutineCelebrations
        layerRef={celebrations}
        navigation={navigation}
        active={isFocused}
        tabBarHeight={tabBarHeight}
        noticeInsets={{
          bottom: addButtonBottom - spacing.xs,
          left: padding.screen.horizontal,
          right: padding.screen.horizontal,
        }}
      />
      <CoinFlightLayer ref={coinFlights} targetRef={coinPill} />
      <FirstWinOfDayPresenter active={isFocused} />
      <EnjoymentPromptPresenter active={isFocused} />
      {isFocused ? <StatusBar style="light" /> : null}
    </View>
  );
}

// Completion refreshes the profile. Keep that observer in the chip so it
// does not rebuild the calendar and decorative coin pool on each response.
function routineTitle(localDate: string, todayLocalDate: string): string {
  if (localDate === todayLocalDate) return 'Today';
  const [year, month, day] = localDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// The offer's queries refresh on completion, so they are observed here rather
// than by the screen, for the same reason as the streak chip below.
function RoutineCelebrations({ layerRef, navigation, active, tabBarHeight, noticeInsets }: {
  layerRef: Ref<HomeCelebrationHandle>;
  navigation: PlanScreenProps['navigation'];
  active: boolean;
  tabBarHeight: number;
  noticeInsets: { bottom: number; left: number; right: number };
}) {
  const openFeedback = useCallback(() => navigation.navigate('ProFeedback'), [navigation]);
  const surveyOffer = useSurveyOfferNotice(openFeedback);
  return (
    <HomeCelebrationLayer
      ref={layerRef}
      active={active}
      tabBarHeight={tabBarHeight}
      noticeInsets={noticeInsets}
      notice={
        surveyOffer.visible ? (
          <SurveyOfferNotice
            kind={surveyOffer.kind}
            onPress={surveyOffer.open}
            onDismiss={surveyOffer.dismiss}
          />
        ) : null
      }
      onNoticePreempted={surveyOffer.preempt}
    />
  );
}

function RoutineStreak({ userId, navigation }: {
  userId: string | null;
  navigation: PlanScreenProps['navigation'];
}) {
  const profileSummary = useProfileSummaryQuery(userId).data;
  return (
    <TopBarStreak
      size="compact"
      surface="scrim"
      streakDays={profileSummary?.currentStreak ?? 0}
      onPress={() => navigation.navigate('Insights')}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  block: {
    paddingBottom: spacing.lg + radius.hero,
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  weekStrip: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: -spacing.sm,
  },
  sheet: {
    flex: 1,
    marginTop: -radius.hero,
    overflow: 'hidden',
    borderTopLeftRadius: radius.hero,
    borderTopRightRadius: radius.hero,
    borderCurve: 'continuous',
    backgroundColor: colors.background.canvas,
  },
  column: {
    gap: spacing.xl,
    paddingHorizontal: padding.screen.horizontal,
  },
  addButton: {
    position: 'absolute',
    right: padding.screen.horizontal,
  },
});
