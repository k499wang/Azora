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
import OnboardingSummaryCard from '../components/onboarding/OnboardingSummaryCard';
import { usePlanPositionState } from '../hooks/usePlanPosition';
import { planCompletionRatio, planPositionLabel } from '../lib/planProgress';
import {
  planPhaseWeeksLabel,
  planPhasesForPlan,
  type PlanPhase,
} from '../lib/onboardingPreset';
import { useProfileQuery } from '../queries/profile/useProfileQuery';
import { useAuthStore } from '../stores/authStore';
import { card } from '../theme/card';
import { colors } from '../theme/colors';
import { padding, spacing } from '../theme/spacing';
import { fonts, typography } from '../theme/typography';

const TRACK_HEIGHT = 8;
/** Measured, the way Home measures it: the native tab bar cannot be asked. */
const TAB_BAR_HEIGHT = 49;

/**
 * The plan onboarding sold, still standing.
 *
 * Onboarding is the only place the arc has ever been visible: it names the
 * phases, says what each one sets up, and then the user lands on a list that
 * looks the same on day forty as on day four. This is that same ladder, read
 * from where they actually are.
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
  const profile = useProfileQuery(userId).data;

  const phases = useMemo(() => {
    if (position == null) return null;

    return planPhasesForPlan(position.planId, {
      // Only the phase copy's date range reads this, and this screen does not
      // draw one. Kept honest anyway rather than left as an arbitrary day.
      startDate: profile?.onboardingCompletedAt
        ? new Date(profile.onboardingCompletedAt)
        : new Date(),
    });
  }, [position, profile?.onboardingCompletedAt]);

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

        <ScreenContent width="grouped" style={styles.column}>
          {isLoading ? (
            <ActivityIndicator color={colors.text.tertiary} />
          ) : position == null || phases == null ? (
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
              <View style={[card.base, card.shadow, styles.header]}>
                <Text style={styles.planName}>{position.planName}</Text>
                <Text style={styles.position}>
                  {planPositionLabel(position)}
                </Text>
                <View
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: position.totalWeeks,
                    now: position.week,
                  }}
                  style={styles.track}
                >
                  <View
                    style={[
                      styles.fill,
                      { width: `${Math.round(planCompletionRatio(position) * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.daysDone}>
                  {position.daysDone === 1
                    ? '1 day done'
                    : `${position.daysDone} days done`}
                </Text>
              </View>

              {/* The endpoint is visible from the first day: seeing the last
                  rung is what makes the plan a thing to finish rather than a
                  list that repeats. */}
              <View style={styles.ladder}>
                {phases.map((phase) => (
                  <PhaseRung
                    key={phase.name}
                    phase={phase}
                    current={phase.name === position.phase.name}
                  />
                ))}
              </View>

              {/* The same promise the plan was accepted under, said again where
                  a missed week would otherwise be felt. */}
              <Text style={styles.note}>
                Miss a day and the plan waits. It doesn’t move without you.
              </Text>
            </>
          )}
        </ScreenContent>
      </Animated.ScrollView>

      <CollapsingTitleBar title="My Plan" scrollY={scrollY} />
    </View>
  );
}

function PhaseRung({
  phase,
  current,
}: {
  phase: PlanPhase;
  current: boolean;
}) {
  return (
    <View style={current ? undefined : styles.laterPhase}>
      <OnboardingSummaryCard
        title={phase.name}
        meta={
          current
            ? `${planPhaseWeeksLabel(phase)} · You’re here`
            : planPhaseWeeksLabel(phase)
        }
        body={phase.detail}
        footer={<Text style={styles.reach}>{phase.reach}</Text>}
      />
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
  column: {
    gap: spacing.lg,
    paddingHorizontal: padding.screen.horizontal,
  },
  header: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  planName: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  position: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.primary.blue100,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: colors.primary.blue500,
  },
  daysDone: {
    ...typography.label.detail,
    color: colors.text.tertiary,
  },
  ladder: {
    gap: spacing.md,
  },
  /** Later rungs stay legible but stand back from the one in play. */
  laterPhase: {
    opacity: 0.6,
  },
  reach: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  note: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
