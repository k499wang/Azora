import { useCallback, useEffect, useRef, useState } from 'react';
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
import CoinFlightLayer, {
  COIN_FLIGHT_MS,
  type CoinFlightHandle,
} from '../components/common/CoinFlightLayer';
import WalletCoins from '../components/common/WalletCoins';
import TopBarStreak from '../components/common/TopBarStreak';
import PlanWeekStrip, { PLAN_WEEK_STRIP_DAYS } from '../features/plan/PlanWeekStrip';
import TodoListSection from '../features/selfCare/TodoListSection';
import FirstWinOfDayPresenter from '../features/selfCare/FirstWinOfDayPresenter';
import { useFirstWinOfDayStore } from '../features/selfCare/firstWinOfDayStore';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { getActiveSelfCareGoalsQueryOptions } from '../queries/selfCare/useActiveSelfCareGoalsQuery';
import { useDailyActivityRangeQuery } from '../queries/tracking/useDailyActivityRangeQuery';
import { useAuthStore } from '../stores/authStore';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { radius } from '../theme/card';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { useTourScroller } from '../features/tour/tourTargets';

const TAB_BAR_HEIGHT = 49;
const ROUTINE_HUE = colors.playful.sky;

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
  const [selectedLocalDate, setSelectedLocalDate] = useState(todayLocalDate);
  const activityQuery = useDailyActivityRangeQuery(userId, PLAN_WEEK_STRIP_DAYS);
  const viewingPastDay = selectedLocalDate !== todayLocalDate;

  useEffect(() => {
    setSelectedLocalDate(todayLocalDate);
  }, [todayLocalDate]);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[ROUTINE_HUE.base, ROUTINE_HUE.mid]}
        style={[styles.block, { paddingTop: contentInset }]}
      >
        <ScreenContent width="grouped">
          <TabTitleRow
            title="My Routine"
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
            activity={activityQuery.data ?? []}
            selectedLocalDate={selectedLocalDate}
            onSelectDay={setSelectedLocalDate}
          />
        </ScreenContent>
      </LinearGradient>
      <View style={styles.sheet}>
        <Animated.ScrollView
          {...routineTourScroll}
          ref={routineScroll}
          contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: tabBarHeight + spacing.xl }}
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
              readOnly={viewingPastDay}
              tourAddHabitTarget
              scrollRef={routineScroll}
              onBrowseRoutines={browseRoutines}
              onCoinsEarned={launchCoins}
              onCompleted={celebrateCompletion}
            />
          </ScreenContent>
        </Animated.ScrollView>
      </View>
      {/* Both mounted with the screen, not with focus, so the confetti canvases
          and the coin pool are built once rather than on every return. */}
      <HomeCelebrationLayer
        ref={celebrations}
        active={isFocused}
        tabBarHeight={tabBarHeight}
      />
      <CoinFlightLayer ref={coinFlights} targetRef={coinPill} />
      <FirstWinOfDayPresenter active={isFocused} />
      {isFocused ? <StatusBar style="light" /> : null}
    </View>
  );
}

// Completion refreshes the profile. Keep that observer in the chip so it
// does not rebuild the calendar and decorative coin pool on each response.
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
  },
  // Rides up over the block's bottom edge, so the rounded corners are cut
  // out of the colour rather than drawn on the canvas. Only the list inside
  // it scrolls; the header stays put, and the corners clip what scrolls past.
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
});
