import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PlanScreenProps } from '../app/navigation';
import { useCollapsingContentInset } from '../components/common/CollapsingTitleBar';
import ScreenContent from '../components/common/ScreenContent';
import TabTitleRow from '../components/common/TabTitleRow';
import HomeCelebrationLayer, {
  type HomeCelebrationHandle,
} from '../components/home/HomeCelebrationLayer';
import TopBarStreak from '../components/common/TopBarStreak';
import PlanWeekStrip, { PLAN_WEEK_STRIP_DAYS } from '../features/plan/PlanWeekStrip';
import TodoListSection from '../features/selfCare/TodoListSection';
import FirstWinOfDayPresenter from '../features/selfCare/FirstWinOfDayPresenter';
import { useFirstWinOfDayStore } from '../features/selfCare/firstWinOfDayStore';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
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
  const routineScroll = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
  const routineTourScroll = useTourScroller<ComponentRef<typeof Animated.ScrollView>>([
    'routineAddHabit',
  ], routineScroll);
  const celebrations = useRef<HomeCelebrationHandle>(null);
  const insets = useSafeAreaInsets();
  const contentInset = useCollapsingContentInset();
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const profileSummary = useProfileSummaryQuery(userId).data;
  const todayLocalDate = useTodayLocalDate();
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
              <TopBarStreak
                size="compact"
                surface="scrim"
                streakDays={profileSummary?.currentStreak ?? 0}
                onPress={() => navigation.navigate('Insights')}
              />
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
              mode="tasks"
              userId={userId}
              selectedLocalDate={selectedLocalDate}
              readOnly={viewingPastDay}
              tourAddHabitTarget
              scrollRef={routineScroll}
              onBrowseRoutines={() => navigation.navigate('RoutineBrowser')}
              onCompleted={({ goalTitle, isFirstWinToday }) => {
                if (isFirstWinToday) {
                  useFirstWinOfDayStore.getState().show();
                  return;
                }
                celebrations.current?.confirm(goalTitle);
                celebrations.current?.burst();
              }}
            />
          </ScreenContent>
        </Animated.ScrollView>
      </View>
      {isFocused ? (
        <HomeCelebrationLayer ref={celebrations} tabBarHeight={tabBarHeight} />
      ) : null}
      <FirstWinOfDayPresenter active={isFocused} />
      {isFocused ? <StatusBar style="light" /> : null}
    </View>
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
