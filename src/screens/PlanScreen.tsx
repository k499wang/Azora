import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsRegularWidth } from '../hooks/useIsRegularWidth';
import type { PlanScreenProps } from '../app/navigation';
import { Text } from '../components/common/Text';
import CollapsingTitleBar, {
  useCollapsingContentInset,
  useCollapsingTitle,
} from '../components/common/CollapsingTitleBar';
import ScreenContent from '../components/common/ScreenContent';
import PlanCalendar from '../features/plan/PlanCalendar';
import PlanHeroCard from '../features/plan/PlanHeroCard';
import PlanWeekStrip, {
  PLAN_WEEK_STRIP_DAYS,
} from '../features/plan/PlanWeekStrip';
import { planCalendar } from '../features/plan/domain/planCalendar';
import { useAzoraScore } from '../features/plan/useAzoraScore';
import { usePlanPositionState } from '../hooks/usePlanPosition';
import { useTodayLocalDate } from '../hooks/useTodayLocalDate';
import { useDailyActivityRangeQuery } from '../queries/tracking/useDailyActivityRangeQuery';
import { planPositionLabel } from '../lib/planProgress';
import { useAuthStore } from '../stores/authStore';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

/** Measured, the way Home measures it: the native tab bar cannot be asked. */
const TAB_BAR_HEIGHT = 49;

/**
 * The plan onboarding sold, still standing.
 *
 * Onboarding is the only place the arc has ever been visible: it names the
 * phases, says what each one sets up, and then the user lands on a list that
 * looks the same on day forty as on day four. This is the same arc, drawn as
 * the days it is actually made of — the week as a score, then every week of
 * the plan with the days behind them filled in.
 *
 * Weeks, never dates. The plan advances on days done — a dated map would tell
 * someone who missed a fortnight that they are behind on a schedule they never
 * agreed to, which is the one thing the plan promises not to do.
 */
export default function PlanScreen(_: PlanScreenProps) {
  const insets = useSafeAreaInsets();
  const { scrollY, onScroll } = useCollapsingTitle();
  const contentInset = useCollapsingContentInset();
  const isRegularWidth = useIsRegularWidth();
  const tabBarHeight = isRegularWidth ? 0 : TAB_BAR_HEIGHT + insets.bottom;
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const { position, isLoading, isError, hasEnrollment, refetch } =
    usePlanPositionState(userId);
  const { score, isLoading: scoreLoading } = useAzoraScore(userId);
  const todayLocalDate = useTodayLocalDate();
  const activityQuery = useDailyActivityRangeQuery(userId, PLAN_WEEK_STRIP_DAYS);

  // The plan as days, which is what the screen draws. The authored phase copy
  // below is read only for the one line the current phase gets.
  const calendar = useMemo(
    () => (position == null ? null : planCalendar(position.planId, position.daysDone)),
    [position],
  );


  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: contentInset,
          paddingBottom: tabBarHeight + spacing.xl,
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContent width="grouped" style={styles.titleRow}>
          <Text style={styles.largeTitle}>My Plan</Text>
        </ScreenContent>

        {/* This week, dated, straight on the canvas. The gauge below counts
            the week; this says which days — and a card around it would have
            made the page open on two cards saying the same thing. */}
        <ScreenContent width="grouped" style={styles.stripRow}>
          <PlanWeekStrip
            todayLocalDate={todayLocalDate}
            activity={activityQuery.data ?? []}
          />
        </ScreenContent>

        <ScreenContent width="grouped" style={styles.column}>
          {isLoading ? (
            <ActivityIndicator color={colors.text.tertiary} />
          ) : position == null || calendar == null ? (
            <View style={[card.base, card.shadow, styles.header]}>
              <Text style={styles.planName}>
                {isError
                  ? 'Your plan couldn’t load'
                  : hasEnrollment
                    ? 'Your plan needs a newer app'
                    : 'No plan yet'}
              </Text>
              <Text style={styles.position}>
                {isError
                  ? 'Please try again to see your progress.'
                  : hasEnrollment
                    ? 'Update the app to see this plan and its progress.'
                    : 'There’s no program available for this account yet. You can still find your daily exercises on Home.'}
              </Text>
              {isError && (
                <Pressable accessibilityRole="button" onPress={() => { void refetch(); }}>
                  <Text style={styles.position}>Try again</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <>
              {/* The week as one number, and the plan's own progress under it
                  in plain words. Progress is a count, not a score: it only
                  ever goes up, and a gauge of it would be congratulating
                  somebody for having been here a while. */}
              <PlanHeroCard
                score={score}
                position={planPositionLabel(position)}
                isLoading={scoreLoading}
              />

              {/* Every day of the plan, the ones behind them filled in. The
                  endpoint is visible from the first day: seeing the last week
                  is what makes this a thing to finish rather than a list that
                  repeats. */}
              <PlanCalendar calendar={calendar} />
            </>
          )}
        </ScreenContent>
      </Animated.ScrollView>

      <CollapsingTitleBar title="My Plan" scrollY={scrollY} />
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
    paddingBottom: spacing.lg,
  },
  stripRow: {
    paddingHorizontal: padding.screen.horizontal,
  },
  largeTitle: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  column: {
    gap: spacing.md,
    marginTop: spacing.lg,
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
