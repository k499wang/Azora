import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
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
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import type { SelfCareGoalDraft } from '../../services/selfCare/selfCareService';
import Confetti from '../../components/common/Confetti';
import Overline from '../../components/common/Overline';
import AddGoalSheet from './AddGoalSheet';
import GoalDetailSheet from './GoalDetailSheet';
import GoalEditSheet from './GoalEditSheet';
import Collapsible, {
  COLLAPSE_TIMING,
} from '../../components/common/Collapsible';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useSelfCareGoalsQuery } from '../../queries/selfCare/useSelfCareGoalsQuery';
import { useCreateSelfCareGoalMutation } from '../../queries/selfCare/useCreateSelfCareGoalMutation';
import { useToggleSelfCareGoalMutation } from '../../queries/selfCare/useToggleSelfCareGoalMutation';
import { useArchiveSelfCareGoalMutation } from '../../queries/selfCare/useArchiveSelfCareGoalMutation';
import { useSetSelfCareGoalFeaturedMutation } from '../../queries/selfCare/useSetSelfCareGoalFeaturedMutation';
import { useUpdateSelfCareGoalMutation } from '../../queries/selfCare/useUpdateSelfCareGoalMutation';
import {
  completedGoalsSummary,
  selfCareGoalDaypartLabel,
  MAX_SELF_CARE_GOALS,
  planSelfCareGoalList,
  type SelfCareGoal,
} from './domain/selfCareGoal';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { triggerSuccessHaptic, triggerTapHaptic } from '../../native/tapHaptics';
import { duration, easing, spring } from '../../theme/motion';
import { fonts, typography, wrappedLineHeight } from '../../theme/typography';
import {
  TODAY_JOURNEY_COLUMN_WIDTH,
  TODAY_JOURNEY_DASH_GAP,
  TODAY_JOURNEY_DASH_HEIGHT,
  TODAY_JOURNEY_GROUP_GAP,
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
const DAY_DONE_ICON_SIZE = 64;
// The card's button is not the list's way in — it sits under a headline with
// nothing competing for the tap, so it shrinks to what it says.
const DAY_DONE_ADD_HEIGHT = 44;
const DAY_DONE_ADD_BADGE_SIZE = 28;
const COMPLETED_ROW_HEIGHT = 44;
const GOAL_ICON_SIZE = 34;
const FEATURED_STAR_SIZE = 26;
const GOAL_TITLE_LINE_HEIGHT = wrappedLineHeight(
  typography.body.large.fontSize,
);
const COMPLETED_ROW_LINE_HEIGHT = wrappedLineHeight(
  typography.body.medium.fontSize,
);
/** A long task gets the room it needs instead of being cut off at two lines. */
const GOAL_TITLE_MAX_LINES = 3;
const GOAL_CHECK_SIZE = 42;
const JOURNEY_ROW_GAP = spacing.md;
const ADD_ROW_OFFSET = TODAY_JOURNEY_GROUP_GAP - JOURNEY_ROW_GAP;
/**
 * The celebration when a to-do lands: the green disc springs in past its own
 * size and a ring pushes out through it. Sized in multiples of the marker so it
 * stays tied to the dot it is congratulating rather than to the row it sits in.
 */
const MARKER_HALO_SIZE = TODAY_JOURNEY_MARKER_SIZE * 2.6;
const MARKER_CONFETTI_SIZE = TODAY_JOURNEY_MARKER_SIZE * 14;
const MARKER_CONFETTI_SPREAD = 1.15;
const MARKER_CONFETTI_PIECE_SCALE = 1.7;
const MARKER_CONFETTI_PIECE_COUNT = 26;
// Longer than the disc's own beat: the bigger burst has further to travel.
const MARKER_CONFETTI_MS = 950;
// Hoisted so the memoized burst is not handed a new array on every re-render
// the toggle mutation causes while it is in flight.
const MARKER_CONFETTI_COLORS = [
  colors.success[500],
  colors.success[300],
] as const;
// The disc's own beat. Short on purpose: it is the smallest part of the
// celebration, and the fall across the section carries the rest.
const MARKER_POP_MS = 620;
/** the wind-up before the disc springs back — a beat, not a step */
const SQUASH_MS = 70;
interface TodoListSectionProps {
  /**
   * Everything on both of Home's lists is finished. Decided above this section,
   * since the card it shows stands for the whole day and not for this list.
   */
  dayDone: boolean;
  /**
   * A to-do was finished and left the rail in the same render, so it has no
   * marker of its own to celebrate from. Home fires the burst instead, from its
   * own fixed place on the screen.
   */
  onCelebrate: () => void;
  /**
   * A to-do was finished, wherever its row ended up. Home confirms it with the
   * bar above the tab bar — the one celebration that plays for every
   * completion, not only the ones that leave the rail.
   */
  onCompleted: (goalTitle: string) => void;
  userId: string | null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

interface GoalCardProps {
  goal: SelfCareGoal;
  busy: boolean;
  onToggle: () => void;
  onOpen: () => void;
}

/**
 * Shaped like a closed daily above it, so a goal you wrote and a daily the app
 * scheduled read as the same kind of thing on the same journey.
 */
function GoalCard({ goal, busy, onToggle, onOpen }: GoalCardProps) {
  return (
    <View style={[card.base, styles.goalCard]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={goal.title}
        accessibilityHint="Opens this to-do"
        onPress={() => {
          triggerTapHaptic();
          onOpen();
        }}
        style={({ pressed }) => [styles.goalButton, pressed && pressable.subtle]}
      >
        <Icon
          name={goal.icon}
          size={GOAL_ICON_SIZE}
          color={
            goal.completedToday ? colors.text.tertiary : colors.primary.blue600
          }
        />
        <View style={styles.goalText}>
          {goal.featuredToday ? (
            <Text style={styles.goalFeaturedLabel}>Task of the day</Text>
          ) : null}
          <Text
            numberOfLines={GOAL_TITLE_MAX_LINES}
            style={[
              styles.goalTitle,
              goal.completedToday && styles.goalTitleDone,
            ]}
          >
            {goal.title}
          </Text>
          {goal.scheduledTime == null ? null : (
            <Text style={styles.goalTime}>
              {selfCareGoalDaypartLabel(goal.scheduledTime)}
            </Text>
          )}
        </View>
        {goal.featuredToday ? (
          <Icon
            name="star"
            size={FEATURED_STAR_SIZE}
            color={colors.reward.gold}
          />
        ) : null}
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
function useCompletionBurst(completed: boolean) {
  const [burst, setBurst] = useState<number | null>(null);
  const nextBurst = useRef(0);
  const wasCompleted = useRef(completed);

  useEffect(() => {
    if (completed && !wasCompleted.current) {
      nextBurst.current += 1;
      setBurst(nextBurst.current);
    }
    wasCompleted.current = completed;
  }, [completed]);

  const clearBurst = useCallback((completedBurst: number) => {
    setBurst((current) => current === completedBurst ? null : current);
  }, []);
  return { burst, clearBurst };
}

/**
 * The dot on the rail, and the whole reward for finishing a to-do. Un-ticking
 * one takes the disc back off quietly — an undo is not an event.
 */
// Memoized: the toggle mutation re-renders this list several times while the
// burst is in the air, and re-rendering the marker means re-mounting the
// pieces mid-flight.
const GoalStatusMarker = memo(function GoalStatusMarker({
  completed,
}: {
  completed: boolean;
}) {
  const { burst, clearBurst } = useCompletionBurst(completed);
  const fill = useSharedValue(completed ? 1 : 0);
  const halo = useSharedValue(0);

  useEffect(() => {
    if (burst == null) return;
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
      withTiming(1, { duration: MARKER_POP_MS, easing: easing.burst }),
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
      {burst == null ? null : (
        <View pointerEvents="none" style={styles.markerConfetti}>
          <Confetti
            key={burst}
            pieceColors={MARKER_CONFETTI_COLORS}
            pieceCount={MARKER_CONFETTI_PIECE_COUNT}
            spread={MARKER_CONFETTI_SPREAD}
            pieceScale={MARKER_CONFETTI_PIECE_SCALE}
            durationMs={MARKER_CONFETTI_MS}
            onComplete={() => clearBurst(burst)}
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
});

/**
 * The finished to-dos, folded into the summary row above them. Height is
 * measured once from the laid-out list and animated to, so opening it slides
 * the rows down out of the scrim instead of popping them into place.
 */
/**
 * Two celebrations, picked by what happens to the row.
 *
 * A to-do that stays on the rail is congratulated where it sits: the green
 * burst goes off from its own marker, pointing at the thing you just did. A
 * to-do that vanishes in the same render — swept into the drawer past the
 * collapse threshold, or taken with the whole list by the day-done card — has
 * no marker left to fire from, so Home bursts from its own fixed place instead.
 *
 * This calls back with the to-do that was just finished, for the caller to
 * make that choice. It ignores the first pass, so a list that loads with
 * finished to-dos on it does not celebrate them again, and reads the whole list
 * rather than one row — the row is often gone by the time the celebration would
 * play.
 *
 * The callback runs a tick after the completion lands rather than inside it.
 * Which of the two celebrations is right depends on `dayDone`, and Home decides
 * that from the same query this list reads, so it can arrive a commit later
 * than the completion does. Choosing on the spot loses the last to-do of the
 * day in that gap: it still looks like a row on the rail, so the burst is left
 * to a marker that unmounts before it can play, and nothing fires at all.
 */
function useGoalCompletionCelebration(
  goals: SelfCareGoal[],
  onCompleted: (goalId: string) => void,
) {
  const previouslyCompleted = useRef<Set<string> | null>(null);
  const callback = useRef(onCompleted);
  callback.current = onCompleted;

  useEffect(() => {
    const completed = new Set(
      goals.filter((goal) => goal.completedToday).map((goal) => goal.id),
    );
    const previous = previouslyCompleted.current;
    previouslyCompleted.current = completed;
    if (previous == null) return;
    for (const goalId of completed) {
      if (previous.has(goalId)) continue;
      const settled = setTimeout(() => callback.current(goalId), 0);
      return () => clearTimeout(settled);
    }
  }, [goals]);
}

/** The way onto the list, shown under it and inside the day-done card. */
function AddGoalRow({
  onPress,
  compact = false,
  style,
}: {
  onPress: () => void;
  /** the smaller form the day-done card carries */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add a goal"
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        styles.addRow,
        compact && styles.addRowCompact,
        style,
        pressed && pressable.surface,
      ]}
    >
      <View style={[styles.addBadge, compact && styles.addBadgeCompact]}>
        <Icon name="plus" size={compact ? 16 : 20} color={colors.text.secondary} />
      </View>
      <Text style={[styles.addLabel, compact && styles.addLabelCompact]}>
        Add a goal
      </Text>
    </Pressable>
  );
}

export default function TodoListSection({
  userId,
  dayDone,
  onCelebrate,
  onCompleted,
}: TodoListSectionProps) {
  const localDate = useTodayLocalDate();
  const goalsQuery = useSelfCareGoalsQuery(userId, localDate);
  const createGoal = useCreateSelfCareGoalMutation(userId, localDate);
  const toggleGoal = useToggleSelfCareGoalMutation(userId, localDate);
  const archiveGoal = useArchiveSelfCareGoalMutation(userId, localDate);
  const featureGoal = useSetSelfCareGoalFeaturedMutation(userId, localDate);
  const updateGoal = useUpdateSelfCareGoalMutation(userId, localDate);
  const [adding, setAdding] = useState(false);
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);
  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  /**
   * The to-do the detail sheet is handing to the edit sheet on its way out.
   *
   * Both sheets are modals, and a modal asked to present while another is still
   * dismissing is dropped on the floor — the second one simply never appears.
   * So the handover waits for the first to be off the screen.
   */
  const pendingEditGoalId = useRef<string | null>(null);
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
  // With the day done every finished to-do folds into the drawer, so the card
  // stands alone rather than sitting on top of the list it is celebrating.
  const plan = planSelfCareGoalList(goals);
  const railGoals = dayDone ? [] : plan.rail;
  const drawerGoals = dayDone ? goals : plan.drawer;
  useGoalCompletionCelebration(goals, (goalId) => {
    onCompleted(goals.find((goal) => goal.id === goalId)?.title ?? '');
    // Still on the rail: its own marker has the burst, and a second celebration
    // over the top of it would only bury it.
    if (railGoals.some((goal) => goal.id === goalId)) return;
    onCelebrate();
  });

  const detailGoal = goals.find((goal) => goal.id === detailGoalId) ?? null;
  const editGoal = goals.find((goal) => goal.id === editGoalId) ?? null;
  const atLimit = goals.length >= MAX_SELF_CARE_GOALS;
  // The create error belongs to the sheet that is still open over this list.
  const mutationError =
    toggleGoal.error ?? archiveGoal.error ?? featureGoal.error;
  const addNodeVisible = goalsQuery.isSuccess && !atLimit;
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
    chevronTurn.value = withTiming(completedOpen ? 1 : 0, COLLAPSE_TIMING);
  }, [completedOpen, chevronTurn]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(chevronTurn.value, [0, 1], [-90, 0])}deg` },
    ],
  }));

  if (userId == null) return null;

  const save = (draft: SelfCareGoalDraft) => {
    if (createGoal.isPending || atLimit) return;
    createGoal.mutate(draft, { onSuccess: () => setAdding(false) });
  };

  const closeSheet = () => {
    setAdding(false);
    createGoal.reset();
  };

  return (
    <View style={styles.section}>
      {dayDone ? null : <Overline label="To-dos" style={styles.groupLabel} />}

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
      ) : dayDone ? (
        <View style={styles.dayDone}>
          <Icon
            name="celebration"
            size={DAY_DONE_ICON_SIZE}
            color={colors.primary.blue600}
          />
          <Text style={styles.dayDoneTitle}>
            Woohoo! You’re all completed for the day!
          </Text>
          {atLimit ? null : (
            <AddGoalRow
              compact
              onPress={() => setAdding(true)}
              style={styles.dayDoneAdd}
            />
          )}
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
                onOpen={() => setDetailGoalId(goal.id)}
              />
            </View>
          ))}
          {addNodeVisible ? (
            <AddGoalRow onPress={() => setAdding(true)} />
          ) : null}
        </View>
      ) : null}

      {dayDone || drawerGoals.length === 0 ? null : (
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
          <Collapsible open={completedOpen} contentStyle={styles.completedList}>
            {drawerGoals.map((goal) => (
              <Pressable
                key={goal.id}
                accessibilityRole="button"
                accessibilityLabel={`${goal.title}, completed`}
                accessibilityHint="Opens this to-do"
                onPress={() => {
                  triggerTapHaptic();
                  setDetailGoalId(goal.id);
                }}
                style={({ pressed }) => [
                  styles.completedRow,
                  pressed && pressable.subtle,
                ]}
              >
                <View style={styles.completedRowBadge}>
                  <Icon name={goal.icon} size={20} color={colors.text.tertiary} />
                </View>
                <Text
                  style={styles.completedRowTitle}
                  numberOfLines={GOAL_TITLE_MAX_LINES}
                >
                  {goal.title}
                </Text>
              </Pressable>
            ))}
          </Collapsible>
        </View>
      )}

      <GoalDetailSheet
        goal={detailGoal}
        busy={toggleGoal.isPending || archiveGoal.isPending}
        onClose={() => setDetailGoalId(null)}
        onToggleComplete={() => {
          if (detailGoal == null) return;
          toggleGoal.mutate({
            goalId: detailGoal.id,
            completed: !detailGoal.completedToday,
          });
          // Closed on the way out so the celebration has the screen to itself.
          setDetailGoalId(null);
        }}
        onToggleFeatured={() => {
          if (detailGoal == null) return;
          featureGoal.mutate({
            goalId: detailGoal.id,
            featured: !detailGoal.featuredToday,
          });
        }}
        onEdit={() => {
          if (detailGoal == null) return;
          pendingEditGoalId.current = detailGoal.id;
          setDetailGoalId(null);
        }}
        onDismissed={() => {
          const next = pendingEditGoalId.current;
          pendingEditGoalId.current = null;
          if (next != null) setEditGoalId(next);
        }}
        onRemove={() => {
          if (detailGoal == null) return;
          setDetailGoalId(null);
          archiveGoal.mutate(detailGoal.id);
        }}
      />

      <GoalEditSheet
        goal={editGoal}
        pending={updateGoal.isPending}
        error={updateGoal.error}
        onClose={() => {
          setEditGoalId(null);
          updateGoal.reset();
        }}
        onSave={(edit) => {
          if (editGoal == null) return;
          updateGoal.mutate(
            { goalId: editGoal.id, ...edit },
            { onSuccess: () => setEditGoalId(null) },
          );
        }}
      />

      <AddGoalSheet
        visible={adding}
        onClose={closeSheet}
        onSubmit={save}
        pending={createGoal.isPending}
        error={createGoal.error}
      />

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
    marginBottom: TODAY_JOURNEY_GROUP_GAP - spacing.md,
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
  // Stands where the list would be, so finishing the day empties the section
  // down to one card rather than leaving a page of struck-through rows.
  dayDone: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  dayDoneTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  dayDoneAdd: {
    marginTop: 0,
    alignSelf: 'center',
  },
  addRowCompact: {
    minHeight: DAY_DONE_ADD_HEIGHT,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  addBadgeCompact: {
    width: DAY_DONE_ADD_BADGE_SIZE,
    height: DAY_DONE_ADD_BADGE_SIZE,
  },
  addLabelCompact: {
    ...typography.body.large,
    fontSize: 16,
    lineHeight: 22,
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
  markerConfetti: {
    position: 'absolute',
    top: (TODAY_JOURNEY_MARKER_SIZE - MARKER_CONFETTI_SIZE) / 2,
    left: (TODAY_JOURNEY_MARKER_SIZE - MARKER_CONFETTI_SIZE) / 2,
    width: MARKER_CONFETTI_SIZE,
    height: MARKER_CONFETTI_SIZE,
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
    paddingVertical: spacing.sm,
  },
  goalText: {
    flex: 1,
    gap: 2,
  },
  goalTime: {
    ...typography.label.detail,
    color: colors.text.tertiary,
  },
  goalFeaturedLabel: {
    ...typography.overline,
    fontFamily: fonts.semibold,
    color: colors.reward.gold,
  },
  goalTitle: {
    ...typography.body.large,
    lineHeight: GOAL_TITLE_LINE_HEIGHT,
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
    paddingBottom: spacing.sm,
  },
  completedRow: {
    minHeight: COMPLETED_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    lineHeight: COMPLETED_ROW_LINE_HEIGHT,
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
