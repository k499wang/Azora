import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text, TextInput } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import Confetti from '../../components/common/Confetti';
import Overline from '../../components/common/Overline';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useSelfCareGoalsQuery } from '../../queries/selfCare/useSelfCareGoalsQuery';
import { useCreateSelfCareGoalMutation } from '../../queries/selfCare/useCreateSelfCareGoalMutation';
import { useToggleSelfCareGoalMutation } from '../../queries/selfCare/useToggleSelfCareGoalMutation';
import { useArchiveSelfCareGoalMutation } from '../../queries/selfCare/useArchiveSelfCareGoalMutation';
import {
  completedGoalsSummary,
  MAX_SELF_CARE_GOALS,
  MAX_SELF_CARE_GOAL_TITLE_LENGTH,
  normalizeSelfCareGoalTitle,
  planSelfCareGoalList,
  type SelfCareGoal,
} from './domain/selfCareGoal';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { triggerSuccessHaptic, triggerTapHaptic } from '../../native/tapHaptics';
import { duration, easing, spring } from '../../theme/motion';
import { fonts, typography } from '../../theme/typography';
import {
  TODAY_JOURNEY_COLUMN_WIDTH,
  TODAY_JOURNEY_DASH_GAP,
  TODAY_JOURNEY_DASH_HEIGHT,
  TODAY_JOURNEY_MARKER_ICON_SIZE,
  TODAY_JOURNEY_MARKER_SIZE,
  TODAY_JOURNEY_RAIL_TIMING,
  TODAY_JOURNEY_RAIL_WIDTH,
  todayJourneyDashCount,
} from '../../components/home/todayJourneyLayout';

const GOAL_ROW_HEIGHT = 60;
// Matches a to-do row, so the way in sits in the same rhythm as the list.
const ADD_ROW_HEIGHT = GOAL_ROW_HEIGHT;
const ADD_BADGE_SIZE = 38;
const COMPLETED_CHECK_SIZE = 28;
// Shorter than a to-do row: the drawer summary is a lid, not another item on
// the list, so the scrim it draws sits tighter than the cards above it.
const COMPLETED_SUMMARY_HEIGHT = 46;
const COMPLETED_ICON_BADGE_SIZE = 32;
const COMPLETED_ROW_HEIGHT = 44;
const DRAWER_TIMING = { duration: duration.base, easing: easing.settle } as const;
const ADD_ROW_OFFSET = spacing.md;
const GOAL_ICON_SIZE = 34;
const GOAL_CHECK_SIZE = 42;
const JOURNEY_ROW_GAP = spacing.md;
/**
 * The celebration when a to-do lands: the green disc springs in past its own
 * size, a ring pushes out through it, and the burst goes off from the middle of
 * the marker. Sized in multiples of the marker so the whole thing stays tied to
 * the dot it is congratulating rather than to the row it sits in.
 */
const MARKER_HALO_SIZE = TODAY_JOURNEY_MARKER_SIZE * 2.6;
const MARKER_CONFETTI_SIZE = TODAY_JOURNEY_MARKER_SIZE * 7;
const MARKER_CONFETTI_SPREAD = 0.5;
// Short and over with: the burst is the size of a coin, so at the full flight
// time the pieces crawl. Ends just after the disc has finished springing.
const MARKER_CONFETTI_MS = 620;
/** the wind-up before the disc springs back — a beat, not a step */
const SQUASH_MS = 70;
const MARKER_CONFETTI_STAGGER_MS = 55;
// Hoisted so the memoized burst is not handed a new array on every re-render
// the toggle mutation causes while it is in flight.
const MARKER_CONFETTI_COLORS = [colors.success[500], colors.success[300]] as const;



interface TodoListSectionProps {
  userId: string | null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

interface GoalCardProps {
  goal: SelfCareGoal;
  busy: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

/**
 * Shaped like a closed daily above it, so a goal you wrote and a daily the app
 * scheduled read as the same kind of thing on the same journey.
 */
function GoalCard({ goal, busy, onToggle, onRemove }: GoalCardProps) {
  return (
    <View style={[card.base, styles.goalCard]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={goal.title}
        accessibilityHint="Press and hold to remove"
        onLongPress={onRemove}
        style={({ pressed }) => [styles.goalButton, pressed && pressable.subtle]}
      >
        <Icon
          name="sparkle"
          size={GOAL_ICON_SIZE}
          color={
            goal.completedToday ? colors.text.tertiary : colors.primary.blue600
          }
        />
        <Text
          numberOfLines={2}
          style={[styles.goalTitle, goal.completedToday && styles.goalTitleDone]}
        >
          {goal.title}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: goal.completedToday }}
        accessibilityLabel={`${goal.title}, ${goal.completedToday ? 'completed' : 'not completed'}`}
        disabled={busy}
        onPress={() => {
          triggerTapHaptic();
          onToggle();
        }}
        hitSlop={6}
        style={({ pressed }) => [
          styles.goalCheck,
          goal.completedToday && styles.goalCheckDone,
          pressed && pressable.control,
        ]}
      >
        <Icon name="check" size={24} color={colors.primary.blue600} />
      </Pressable>
    </View>
  );
}

/**
 * Counts the moments a to-do is finished — a rising number rather than a flag,
 * so re-completing one replays the celebration. Starts silent: a to-do that is
 * already done when the list loads has nothing to celebrate.
 */
function useCompletionBurst(completed: boolean): number {
  const [burst, setBurst] = useState(0);
  const wasCompleted = useRef(completed);

  useEffect(() => {
    if (completed && !wasCompleted.current) {
      setBurst((count) => count + 1);
    }
    wasCompleted.current = completed;
  }, [completed]);

  return burst;
}

/**
 * The dot on the rail, and the whole reward for finishing a to-do. Un-ticking
 * one takes the disc back off quietly — an undo is not an event.
 */
function GoalStatusMarker({ completed }: { completed: boolean }) {
  const burst = useCompletionBurst(completed);
  const fill = useSharedValue(completed ? 1 : 0);
  const halo = useSharedValue(0);

  useEffect(() => {
    if (burst === 0) return;
    triggerSuccessHaptic();
    // Squashed to nothing first, so the spring has somewhere to come from even
    // when the disc was already on screen.
    fill.value = withSequence(
      withTiming(0.2, { duration: SQUASH_MS, easing: easing.exit }),
      withSpring(1, spring.bounce),
    );
    halo.value = 0;
    halo.value = withDelay(
      SQUASH_MS,
      withTiming(1, { duration: MARKER_CONFETTI_MS, easing: easing.burst }),
    );
  }, [burst, fill, halo]);

  useEffect(() => {
    if (completed) return;
    fill.value = withTiming(0, { duration: duration.fast, easing: easing.exit });
  }, [completed, fill]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fill.value, [0, 0.2, 1], [0, 1, 1]),
    transform: [{ scale: fill.value }],
  }));
  // The check lags the disc by a hair and lands on its own spring, so the tick
  // reads as being stamped into the circle rather than painted on it.
  const checkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fill.value, [0, 0.55, 0.9], [0, 0, 1]),
    transform: [{ scale: interpolate(fill.value, [0.4, 1], [0.4, 1]) }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(halo.value, [0, 0.15, 1], [0, 0.5, 0]),
    transform: [{ scale: interpolate(halo.value, [0, 1], [0.35, 1]) }],
  }));

  return (
    <View style={[styles.statusMarker, styles.statusMarkerIdle]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.markerHalo, haloStyle]}
      />
      {burst === 0 ? null : (
        <View pointerEvents="none" style={styles.markerConfetti}>
          <Confetti
            key={burst}
            pieceColors={MARKER_CONFETTI_COLORS}
            pieceCount={12}
            spread={MARKER_CONFETTI_SPREAD}
            durationMs={MARKER_CONFETTI_MS}
            staggerMs={MARKER_CONFETTI_STAGGER_MS}
          />
        </View>
      )}
      <Animated.View
        style={[styles.statusMarkerFill, fillStyle]}
        pointerEvents="none"
      />
      <Animated.View style={checkStyle} pointerEvents="none">
        <Icon
          name="check"
          size={TODAY_JOURNEY_MARKER_ICON_SIZE}
          color={colors.text.inverse}
        />
      </Animated.View>
    </View>
  );
}

/**
 * The finished to-dos, folded into the summary row above them. Height is
 * measured once from the laid-out list and animated to, so opening it slides
 * the rows down out of the scrim instead of popping them into place.
 */
function CompletedDrawer({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const [contentHeight, setContentHeight] = useState(0);
  const reveal = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    // Nothing to animate to until the list has been measured, so the first
    // open after mount lands on its height rather than animating to zero.
    if (contentHeight === 0) return;
    reveal.value = withTiming(open ? 1 : 0, DRAWER_TIMING);
  }, [contentHeight, open, reveal]);

  const drawerStyle = useAnimatedStyle(
    () => ({ height: contentHeight * reveal.value }),
    [contentHeight],
  );
  // The list rides down out from under the summary rather than growing in
  // place, so the movement reads as one sheet unfolding.
  const contentStyle = useAnimatedStyle(
    () => ({
      opacity: reveal.value,
      transform: [
        { translateY: interpolate(reveal.value, [0, 1], [-contentHeight, 0]) },
      ],
    }),
    [contentHeight],
  );

  return (
    <Animated.View style={[styles.completedList, drawerStyle]}>
      <Animated.View
        style={[styles.completedListContent, contentStyle]}
        onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

export default function TodoListSection({ userId }: TodoListSectionProps) {
  const localDate = useTodayLocalDate();
  const goalsQuery = useSelfCareGoalsQuery(userId, localDate);
  const createGoal = useCreateSelfCareGoalMutation(userId, localDate);
  const toggleGoal = useToggleSelfCareGoalMutation(userId, localDate);
  const archiveGoal = useArchiveSelfCareGoalMutation(userId, localDate);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [completedOpen, setCompletedOpen] = useState(false);
  /**
   * The rail is measured rather than computed. A goal's height is whatever its
   * title needs — two lines, a larger text size, a tablet — so deriving the
   * rail from a row constant drifts the moment a row is taller than the
   * constant says, and the drift shows up as this rail colliding with the
   * dailies rail above it.
   */
  const [journeyHeight, setJourneyHeight] = useState<number | null>(null);
  // Keyed by goal so removing one cannot leave the rail measured against a row
  // that is no longer last.
  const [goalCenters, setGoalCenters] = useState<Record<string, number>>({});

  const measureJourney = useCallback((event: LayoutChangeEvent) => {
    setJourneyHeight(event.nativeEvent.layout.height);
  }, []);
  const measureGoal = useCallback((goalId: string, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    const center = y + height / 2;
    setGoalCenters((centers) =>
      centers[goalId] === center ? centers : { ...centers, [goalId]: center },
    );
  }, []);

  const goals = goalsQuery.data ?? [];
  const { rail: railGoals, drawer: drawerGoals } = planSelfCareGoalList(goals);
  const normalizedTitle = normalizeSelfCareGoalTitle(title);
  const atLimit = goals.length >= MAX_SELF_CARE_GOALS;
  const mutationError = createGoal.error ?? toggleGoal.error ?? archiveGoal.error;
  const addNodeVisible = goalsQuery.isSuccess && !adding && !atLimit;
  const journeyNodeCount = railGoals.length + (addNodeVisible ? 1 : 0);
  // The rail runs from the section's top edge to the centre of the last goal's
  // marker, both measured, so it can never outrun the rows it belongs to.
  const firstGoal = railGoals[0];
  const lastGoal = railGoals[railGoals.length - 1];
  const firstGoalCenter =
    firstGoal == null ? undefined : goalCenters[firstGoal.id];
  const lastGoalCenter =
    lastGoal == null ? undefined : goalCenters[lastGoal.id];
  const railMeasured =
    journeyHeight != null &&
    firstGoalCenter != null &&
    lastGoalCenter != null &&
    lastGoalCenter > firstGoalCenter;
  const railTop = railMeasured ? firstGoalCenter : 0;
  const railHeight = railMeasured ? lastGoalCenter - firstGoalCenter : 0;
  const railBottom = railMeasured ? journeyHeight - lastGoalCenter : 0;
  const dashCount = todayJourneyDashCount(railHeight);
  /**
   * A daily opening above pushes this rail down and changes what it has to
   * span. The rail above animates that on `TODAY_JOURNEY_RAIL_TIMING`, so this
   * one follows the same curve rather than snapping to its new length while the
   * other half of the same line is still moving.
   */
  const railBottomValue = useSharedValue(railBottom);
  useEffect(() => {
    railBottomValue.value = withTiming(railBottom, TODAY_JOURNEY_RAIL_TIMING);
  }, [railBottom, railBottomValue]);
  const railStyle = useAnimatedStyle(() => ({
    top: railTop,
    bottom: railBottomValue.value,
  }), [railTop]);
  // The chevron turns on the same curve the drawer opens on, so the arrow and
  // the list are one movement.
  const chevronTurn = useSharedValue(completedOpen ? 1 : 0);
  useEffect(() => {
    chevronTurn.value = withTiming(completedOpen ? 1 : 0, DRAWER_TIMING);
  }, [completedOpen, chevronTurn]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(chevronTurn.value, [0, 1], [-90, 0])}deg` },
    ],
  }));

  if (userId == null) return null;

  const save = () => {
    if (normalizedTitle == null || createGoal.isPending || atLimit) return;
    createGoal.mutate(normalizedTitle, {
      onSuccess: () => {
        setTitle('');
        setAdding(false);
      },
    });
  };

  const confirmRemove = (goal: SelfCareGoal) => {
    Alert.alert('Remove this to-do?', goal.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => archiveGoal.mutate(goal.id),
      },
    ]);
  };

  return (
    <View style={styles.section}>
      <Overline label="To-dos" style={styles.groupLabel} />

      {goalsQuery.isPending ? (
        <View style={styles.statusRow}>
          <ActivityIndicator color={colors.primary.blue600} />
          <Text style={styles.statusText}>Loading your list…</Text>
        </View>
      ) : goalsQuery.isError ? (
        <View style={[card.base, styles.statusCard]}>
          <Text style={styles.statusText}>Couldn’t load your list.</Text>
          <Pressable accessibilityRole="button" onPress={() => goalsQuery.refetch()}>
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : goalsQuery.isSuccess && journeyNodeCount > 0 ? (
        <View style={styles.journey} onLayout={measureJourney}>
          {railMeasured ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.journeyRail, railStyle]}
            >
              {Array.from({ length: dashCount }, (_, dash) => (
                <View key={dash} style={styles.journeyRailDash} />
              ))}
            </Animated.View>
          ) : null}
          {railGoals.map((goal) => (
            <View
              key={goal.id}
              style={styles.journeyRow}
              onLayout={(event) => measureGoal(goal.id, event)}
            >
              <View style={styles.timelineColumn} pointerEvents="none">
                <GoalStatusMarker completed={goal.completedToday} />
              </View>
              <GoalCard
                goal={goal}
                busy={
                  toggleGoal.isPending &&
                  toggleGoal.variables?.goalId === goal.id
                }
                onToggle={() =>
                  toggleGoal.mutate({
                    goalId: goal.id,
                    completed: !goal.completedToday,
                  })
                }
                onRemove={() => confirmRemove(goal)}
              />
            </View>
          ))}
          {addNodeVisible ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a goal"
              onPress={() => setAdding(true)}
              style={({ pressed }) => [
                styles.addRow,
                pressed && pressable.surface,
              ]}
            >
              <View style={styles.addBadge}>
                <Icon name="plus" size={20} color={colors.text.secondary} />
              </View>
              <Text style={styles.addLabel}>Add a goal</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {drawerGoals.length > 0 ? (
        <View style={styles.completed}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: completedOpen }}
            accessibilityLabel={completedGoalsSummary(drawerGoals.length)}
            onPress={() => {
              triggerTapHaptic();
              setCompletedOpen((open) => !open);
            }}
            style={({ pressed }) => [
              styles.completedSummary,
              pressed && pressable.surface,
            ]}
          >
            <View style={styles.completedCheck}>
              <Icon name="check" size={16} color={colors.text.secondary} />
            </View>
            <Text style={styles.completedLabel}>
              {completedGoalsSummary(drawerGoals.length)}
            </Text>
            <Animated.View style={chevronStyle}>
              <Icon
                name="chevron-down"
                size={18}
                color={colors.text.secondary}
              />
            </Animated.View>
          </Pressable>
          <CompletedDrawer open={completedOpen}>
            {drawerGoals.map((goal) => (
              <Pressable
                key={goal.id}
                accessibilityRole="button"
                accessibilityLabel={`${goal.title}, completed`}
                accessibilityHint="Press to un-complete, press and hold to remove"
                onLongPress={() => confirmRemove(goal)}
                onPress={() => {
                  triggerTapHaptic();
                  toggleGoal.mutate({ goalId: goal.id, completed: false });
                }}
                style={({ pressed }) => [
                  styles.completedRow,
                  pressed && pressable.subtle,
                ]}
              >
                <View style={styles.completedRowBadge}>
                  <Icon name="sparkle" size={20} color={colors.text.tertiary} />
                </View>
                <Text style={styles.completedRowTitle} numberOfLines={2}>
                  {goal.title}
                </Text>
              </Pressable>
            ))}
          </CompletedDrawer>
        </View>
      ) : null}

      {adding ? (
        <View style={[card.base, card.shadow, styles.composer]}>
          <TextInput
            autoFocus
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={save}
            maxLength={MAX_SELF_CARE_GOAL_TITLE_LENGTH}
            placeholder="Add a small self-care task"
            placeholderTextColor={colors.text.tertiary}
            returnKeyType="done"
            editable={!createGoal.isPending}
            style={styles.input}
            accessibilityLabel="To-do title"
          />
          <View style={styles.composerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setAdding(false);
                setTitle('');
                createGoal.reset();
              }}
              style={({ pressed }) => [styles.cancelButton, pressed && pressable.subtle]}
            >
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={normalizedTitle == null || createGoal.isPending || atLimit}
              onPress={save}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && pressable.control,
                (normalizedTitle == null || createGoal.isPending || atLimit) &&
                  styles.disabled,
              ]}
            >
              {createGoal.isPending ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <Text style={styles.saveLabel}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}

      {atLimit ? (
        <Text style={styles.limitText}>Remove a to-do before adding another.</Text>
      ) : null}
      {mutationError != null ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {errorMessage(mutationError)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  // Flush with the section title, and pulled down onto the rows it names.
  // The break between the dailies above and this list: the space over it is
  // what separates the two journeys, so it is wider than the section's own gap.
  groupLabel: {
    marginTop: spacing.md,
    marginBottom: -spacing.sm,
  },
  journey: {
    position: 'relative',
    gap: JOURNEY_ROW_GAP,
  },
  journeyRail: {
    position: 'absolute',
    overflow: 'hidden',
    left:
      TODAY_JOURNEY_COLUMN_WIDTH / 2 - TODAY_JOURNEY_RAIL_WIDTH / 2,
    width: TODAY_JOURNEY_RAIL_WIDTH,
    alignItems: 'center',
  },
  journeyRailDash: {
    width: TODAY_JOURNEY_RAIL_WIDTH,
    height: TODAY_JOURNEY_DASH_HEIGHT,
    marginBottom: TODAY_JOURNEY_DASH_GAP,
    borderRadius: TODAY_JOURNEY_RAIL_WIDTH / 2,
    backgroundColor: colors.border.default,
  },
  journeyRow: {
    minHeight: GOAL_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  addRow: {
    minHeight: ADD_ROW_HEIGHT,
    marginTop: ADD_ROW_OFFSET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.inertRow.fill,
  },
  addBadge: {
    width: ADD_BADGE_SIZE,
    height: ADD_BADGE_SIZE,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.canvas,
  },
  addLabel: {
    ...typography.body.large,
    fontSize: 20,
    lineHeight: 28,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  timelineColumn: {
    width: TODAY_JOURNEY_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  statusMarker: {
    width: TODAY_JOURNEY_MARKER_SIZE,
    height: TODAY_JOURNEY_MARKER_SIZE,
    borderRadius: TODAY_JOURNEY_MARKER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusMarkerIdle: {
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  // Laid over the idle dot rather than replacing it, and pulled out past the
  // border so the spring never shows a rim of the outline underneath.
  statusMarkerFill: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: TODAY_JOURNEY_MARKER_SIZE / 2 + 2,
    backgroundColor: colors.success[500],
  },
  markerHalo: {
    position: 'absolute',
    top: (TODAY_JOURNEY_MARKER_SIZE - MARKER_HALO_SIZE) / 2,
    left: (TODAY_JOURNEY_MARKER_SIZE - MARKER_HALO_SIZE) / 2,
    width: MARKER_HALO_SIZE,
    height: MARKER_HALO_SIZE,
    borderRadius: MARKER_HALO_SIZE / 2,
    backgroundColor: colors.success[300],
  },
  markerConfetti: {
    position: 'absolute',
    top: (TODAY_JOURNEY_MARKER_SIZE - MARKER_CONFETTI_SIZE) / 2,
    left: (TODAY_JOURNEY_MARKER_SIZE - MARKER_CONFETTI_SIZE) / 2,
    width: MARKER_CONFETTI_SIZE,
    height: MARKER_CONFETTI_SIZE,
  },
  composer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.background.cardSoft,
    color: colors.text.primary,
    ...typography.body.medium,
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  cancelLabel: {
    ...typography.button.medium,
    color: colors.text.secondary,
  },
  saveButton: {
    minWidth: 76,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.medium,
    backgroundColor: colors.primary.blue600,
  },
  saveLabel: {
    ...typography.button.medium,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  disabled: {
    opacity: 0.5,
  },
  statusRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusCard: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  statusText: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  retryLabel: {
    ...typography.button.medium,
    color: colors.text.brand,
  },
  goalCard: {
    ...card.shadow,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    borderRadius: radius.medium,
  },
  goalButton: {
    minHeight: GOAL_ROW_HEIGHT,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  goalTitle: {
    flex: 1,
    ...typography.body.large,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  goalTitleDone: {
    color: colors.text.tertiary,
  },
  // White button with a lip: the thicker bottom edge is what makes it read as
  // a raised key rather than a flat swatch.
  goalCheck: {
    width: GOAL_CHECK_SIZE,
    height: GOAL_CHECK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.small,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderBottomWidth: 3,
    borderColor: colors.border.default,
  },
  // Keeps the lip when it fills in — the button is still a key, just a green
  // one, so the shape holds and only the colour changes.
  goalCheckDone: {
    backgroundColor: colors.success[100],
    borderColor: colors.success[300],
  },
  // The scrim wraps the summary and everything it opens, so the list reads as
  // the inside of the row you pressed rather than as cards below it.
  // A tighter radius than the add row: at this row's height the card radius
  // curves through most of the edge and the scrim reads as a pill.
  completed: {
    borderRadius: radius.medium,
    backgroundColor: colors.inertRow.fill,
    overflow: 'hidden',
  },
  completedSummary: {
    height: COMPLETED_SUMMARY_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  // The same cream square as the add-goal plus, so the two rows that bookend
  // the list carry the same mark.
  completedCheck: {
    width: COMPLETED_CHECK_SIZE,
    height: COMPLETED_CHECK_SIZE,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.canvas,
  },
  completedLabel: {
    flex: 1,
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  completedList: {
    overflow: 'hidden',
  },
  // Taken out of flow so it is measured at its natural height whatever the
  // drawer above it is currently clipped to — measuring it in flow gave a
  // height of zero while the drawer was closed, and the first open had nothing
  // to animate towards, so it snapped.
  completedListContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.sm,
  },
  completedRow: {
    minHeight: COMPLETED_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  completedRowBadge: {
    width: COMPLETED_ICON_BADGE_SIZE,
    height: COMPLETED_ICON_BADGE_SIZE,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.canvas,
  },
  completedRowTitle: {
    flex: 1,
    ...typography.body.medium,
    fontFamily: fonts.medium,
    color: colors.text.tertiary,
  },
  limitText: {
    ...typography.body.xsmall,
    color: colors.text.tertiary,
  },
  errorText: {
    ...typography.body.xsmall,
    color: colors.error[700],
  },
});
