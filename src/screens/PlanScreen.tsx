import { useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PlanScreenProps } from '../app/navigation';
import { Text } from '../components/common/Text';
import CollapsingTitleBar, {
  useCollapsingContentInset,
  useCollapsingTitle,
} from '../components/common/CollapsingTitleBar';
import ScreenContent from '../components/common/ScreenContent';
import TabTitleRow from '../components/common/TabTitleRow';
import HomeCelebrationLayer, {
  type HomeCelebrationHandle,
} from '../components/home/HomeCelebrationLayer';
import TopBarStreak from '../components/common/TopBarStreak';
import PlanWeekStrip, { PLAN_WEEK_STRIP_DAYS } from '../features/plan/PlanWeekStrip';
import TodoListSection from '../features/selfCare/TodoListSection';
import RoutineFirstCompletionModal from '../features/selfCare/RoutineFirstCompletionModal';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useDailyActivityRangeQuery } from '../queries/tracking/useDailyActivityRangeQuery';
import { useAuthStore } from '../stores/authStore';
import { useProfileSummaryQuery } from '../queries/profile/useProfileSummaryQuery';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';
import { parseLocalDate } from '../lib/calendar/weekCalendarDays';
import { withTodaysSession } from '../lib/weeklyProgress';

const TAB_BAR_HEIGHT = 49;

export default function PlanScreen({ navigation }: PlanScreenProps) {
  const isFocused = useIsFocused();
  const celebrations = useRef<HomeCelebrationHandle>(null);
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingTitle();
  const contentInset = useCollapsingContentInset();
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const profileSummary = useProfileSummaryQuery(userId).data;
  const todayLocalDate = useTodayLocalDate();
  const [selectedLocalDate, setSelectedLocalDate] = useState(todayLocalDate);
  const [firstRoutineCompletion, setFirstRoutineCompletion] = useState<{
    streakDays: number;
    completedDaysAgo: number[];
  } | null>(null);
  const activityQuery = useDailyActivityRangeQuery(userId, PLAN_WEEK_STRIP_DAYS);
  const viewingPastDay = selectedLocalDate !== todayLocalDate;

  useEffect(() => {
    setSelectedLocalDate(todayLocalDate);
  }, [todayLocalDate]);

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingTop: contentInset, paddingBottom: tabBarHeight + spacing.xl }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent width="grouped">
          <TabTitleRow
            title="My Routine"
            action={
              <TopBarStreak
                streakDays={profileSummary?.currentStreak ?? 0}
                onPress={() => navigation.navigate('Insights')}
              />
            }
          />
        </ScreenContent>
        <ScreenContent width="grouped" style={styles.column}>
          <PlanWeekStrip
            todayLocalDate={todayLocalDate}
            activity={activityQuery.data ?? []}
            selectedLocalDate={selectedLocalDate}
            onSelectDay={setSelectedLocalDate}
          />
          {viewingPastDay ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return to today's to-dos"
              onPress={() => setSelectedLocalDate(todayLocalDate)}
              style={styles.historyDate}
            >
              <Text style={styles.historyDateLabel}>
                {parseLocalDate(selectedLocalDate).toLocaleDateString(undefined, {
                  weekday: 'long', month: 'long', day: 'numeric',
                })}
              </Text>
              <Text style={styles.historyToday}>Today</Text>
            </Pressable>
          ) : null}
          <TodoListSection
            mode="tasks"
            userId={userId}
            selectedLocalDate={selectedLocalDate}
            readOnly={viewingPastDay}
            onBrowseRoutines={() => navigation.navigate('RoutineBrowser')}
            onCompleted={({ goalTitle, isFirstTodoToday }) => {
              if (isFirstTodoToday) {
                const streakView = withTodaysSession(
                  profileSummary?.currentStreak ?? 0,
                  profileSummary?.completedDaysAgo ?? [],
                );
                setFirstRoutineCompletion({
                  streakDays: streakView.currentStreak,
                  completedDaysAgo: streakView.completedDaysAgo,
                });
                return;
              }
              celebrations.current?.confirm(goalTitle);
              celebrations.current?.burst();
            }}
          />
        </ScreenContent>
      </Animated.ScrollView>
      <CollapsingTitleBar title="My Routine" scrollY={scrollY} />
      {isFocused ? (
        <HomeCelebrationLayer ref={celebrations} tabBarHeight={tabBarHeight} />
      ) : null}
      <RoutineFirstCompletionModal
        visible={firstRoutineCompletion != null}
        streakDays={firstRoutineCompletion?.streakDays ?? 1}
        completedDaysAgo={firstRoutineCompletion?.completedDaysAgo ?? []}
        onContinue={() => setFirstRoutineCompletion(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  content: {},
  column: {
    gap: spacing.xl,
    paddingHorizontal: padding.screen.horizontal,
  },
  historyDate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDateLabel: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  historyToday: {
    ...typography.label.detail,
    color: colors.text.brand,
  },
});
