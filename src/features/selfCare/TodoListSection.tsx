import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import type { SelfCareGoalDraft } from '../../services/selfCare/selfCareService';
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
  reorderedSelfCareGoalPlaces,
  selfCareGoalDaypartLabel,
  MAX_SELF_CARE_GOALS,
  planSelfCareGoalList,
  type SelfCareGoal,
  type SelfCareGoalPlaces,
} from './domain/selfCareGoal';
import {
  loadSelfCareGoalPlaces,
  saveSelfCareGoalPlaces,
  selfCareGoalPlacesNow,
} from '../../services/preferences/selfCareGoalOrder';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { fonts, typography, wrappedLineHeight } from '../../theme/typography';
import JourneyDragRow from '../../components/home/journey/JourneyDragRow';
import {
  journeyReorderActions,
  useJourneyReorder,
  type JourneyScrollRef,
} from '../../components/home/journey/useJourneyReorder';
import {
  TODAY_JOURNEY_CARD_MIN_HEIGHT,
  TODAY_JOURNEY_GROUP_GAP,
  TODAY_JOURNEY_LABEL_GAP,
  TODAY_JOURNEY_RAIL_TIMING,
} from '../../components/home/todayJourneyLayout';

const GOAL_ROW_HEIGHT = TODAY_JOURNEY_CARD_MIN_HEIGHT;
// The add action stays compact even though user-authored to-do cards can grow.
const ADD_ROW_HEIGHT = 60;
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
const GOAL_ICON_SIZE = 38;
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
interface TodoListSectionProps {
  /**
   * Everything on both of Home's lists is finished. Decided above this section,
   * since the card it shows stands for the whole day and not for this list.
   */
  dayDone: boolean;
  /**
   * A to-do was finished. Home fires the shared completion burst from its fixed
   * place on the screen now that rows no longer have journey markers.
   */
  onCelebrate: () => void;
  /**
   * A to-do was finished, wherever its row ended up. Home confirms it with the
   * bar above the tab bar — the one celebration that plays for every
   * completion.
   */
  onCompleted: (goalTitle: string) => void;
  /** The page the list sits on; the drag makes it wait rather than scroll. */
  scrollRef: JourneyScrollRef;
  userId: string | null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

interface GoalCardProps {
  goal: SelfCareGoal;
  busy: boolean;
  /** whether a to-do is being dragged, so a release on this one is not a tap */
  isArranging: () => boolean;
  onToggle: () => void;
  onOpen: () => void;
  /** the same reorder the drag does, one place at a time, for VoiceOver */
  onMove: (delta: number) => void;
}

/**
 * Shaped like a closed daily above it, so a goal you wrote and a daily the app
 * scheduled read as the same kind of thing on the same journey.
 */
function GoalCard({
  goal,
  busy,
  isArranging,
  onToggle,
  onOpen,
  onMove,
}: GoalCardProps) {
  return (
    <View style={[card.base, styles.goalCard]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={goal.title}
        accessibilityHint="Opens this to-do. Hold to rearrange your list"
        {...journeyReorderActions(onMove)}
        onPress={() => {
          // The finger that just dropped this row is not also tapping it.
          if (isArranging()) return;
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
          if (isArranging()) return;
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
 * The finished to-dos, folded into the summary row above them. Height is
 * measured once from the laid-out list and animated to, so opening it slides
 * the rows down out of the scrim instead of popping them into place.
 */
/**
 * Reports newly finished to-dos after the initial load. Reading the whole list
 * keeps the notification reliable even when a completed row immediately moves
 * into the drawer.
 *
 * The callback runs a tick after the completion lands so Home can render the
 * canonical completion state before showing its shared feedback.
 */
function useGoalCompletionCelebration(
  /** the query's own data — `undefined` until the list has actually loaded */
  goals: SelfCareGoal[] | undefined,
  onCompleted: (goalId: string) => void,
) {
  const previouslyCompleted = useRef<Set<string> | null>(null);
  const callback = useRef(onCompleted);
  callback.current = onCompleted;

  useEffect(() => {
    // The list this hook baselines against has to be a list, not the empty
    // stand-in a pending query renders with. Baselining on that one made every
    // to-do already finished today read as finished just now, so opening the
    // app to a checklist with anything ticked on it congratulated you for it.
    if (goals == null) return;

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
  scrollRef,
}: TodoListSectionProps) {
  const localDate = useTodayLocalDate();
  const goalsQuery = useSelfCareGoalsQuery(userId, localDate);
  const createGoal = useCreateSelfCareGoalMutation(userId, localDate);
  const toggleGoal = useToggleSelfCareGoalMutation(userId, localDate);
  const archiveGoal = useArchiveSelfCareGoalMutation(userId, localDate);
  const featureGoal = useSetSelfCareGoalFeaturedMutation(userId, localDate);
  const updateGoal = useUpdateSelfCareGoalMutation(userId, localDate);
  /**
   * Where the user dragged each to-do. A device preference rather than a
   * column: the order of a checklist is worth remembering and not worth a round
   * trip before the row can settle under the finger that dropped it. Read once
   * on the way in, and written straight through on every drop.
   */
  const [places, setPlaces] = useState<SelfCareGoalPlaces>(
    selfCareGoalPlacesNow,
  );

  // Already primed on all but the very first read of the app's life, so this
  // usually settles on the same map the first render drew with.
  useEffect(() => {
    let live = true;
    void loadSelfCareGoalPlaces().then((stored) => {
      if (live) setPlaces(stored);
    });
    return () => {
      live = false;
    };
  }, []);

  /**
   * Forgets where a to-do was dragged, so it goes back to where its hour puts
   * it. Moving one to a different part of the day is the user asking for that;
   * a to-do that is gone has no place to keep.
   */
  const forgetPlace = useCallback(
    (goalId: string) => {
      if (!(goalId in places)) return;
      const next = { ...places };
      delete next[goalId];
      setPlaces(next);
      void saveSelfCareGoalPlaces(next);
    },
    [places],
  );
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
  const goals = goalsQuery.data ?? [];
  // With the day done every finished to-do folds into the drawer, so the card
  // stands alone rather than sitting on top of the list it is celebrating.
  const plan = planSelfCareGoalList(goals, places);
  const completedGoalCount = goals.filter((goal) => goal.completedToday).length;
  const railGoals = dayDone ? [] : plan.rail;
  const drawerGoals = dayDone ? goals : plan.drawer;
  useGoalCompletionCelebration(goalsQuery.data, (goalId) => {
    onCompleted(goals.find((goal) => goal.id === goalId)?.title ?? '');
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
  const railGoalKey = railGoals.map((goal) => goal.id).join('|');
  // Stable across renders that did not change the list, so the drag's own
  // bookkeeping is not rebuilt underneath a finger that is holding a row.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const railGoalIds = useMemo(() => railGoals.map((goal) => goal.id), [railGoalKey]);
  const { controller, moveBy, restoreOrder } = useJourneyReorder({
    ids: railGoalIds,
    gap: JOURNEY_ROW_GAP,
    enabled: !dayDone,
    // The rows stand up by transform rather than by their place in the layout,
    // so committing a new order re-lays out nothing. Heights here are measured
    // rather than given — a to-do's height is whatever its title needs — so
    // this only takes effect on the frame after the list first lays out.
    positioned: true,
    // A to-do arriving or leaving moves the rest of the list on the same curve
    // used by the daily rows above it.
    restingTiming: TODAY_JOURNEY_RAIL_TIMING,
    onReorder: (orderedGoalIds) => {
      // The list changed while the finger was down — a to-do finished on
      // another device, a refetch landing — so the order is against rows that
      // have moved and the ones on screen go back where they were.
      const next = reorderedSelfCareGoalPlaces(
        railGoals,
        places,
        orderedGoalIds,
      );
      if (next == null) {
        restoreOrder();
        return;
      }
      setPlaces(next);
      void saveSelfCareGoalPlaces(next);
    },
  });

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
      {dayDone ? null : (
        <Overline
          label="To-dos"
          done={completedGoalCount}
          total={goals.length}
          style={styles.groupLabel}
        />
      )}

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
        <View style={styles.journey}>
          {/* The rows' own box. Once they are positioned by transform they
              stand at the top of it and are moved down into place, so it is
              told how tall they are together instead of being told by them —
              and the add row below stays below them. */}
          <View
            style={[
              styles.journeyRows,
              { height: controller.contentHeight ?? undefined },
            ]}
          >
            {railGoals.map((goal, index) => (
              <JourneyDragRow
                key={goal.id}
                controller={controller}
                id={goal.id}
                index={index}
                scrollRef={scrollRef}
                style={styles.journeyRow}
              >
                <GoalCard
                  goal={goal}
                  busy={
                    toggleGoal.isPending &&
                    toggleGoal.variables?.goalId === goal.id
                  }
                  isArranging={controller.isArranging}
                  onToggle={() =>
                    toggleGoal.mutate({
                      goalId: goal.id,
                      completed: !goal.completedToday,
                    })
                  }
                  onOpen={() => setDetailGoalId(goal.id)}
                  onMove={(delta) => moveBy(goal.id, delta)}
                />
              </JourneyDragRow>
            ))}
          </View>
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
          forgetPlace(detailGoal.id);
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
          // An edit that moves the to-do to another part of the day means the
          // day decides where it sits again. One that only fixes a typo leaves
          // the place the user dragged it to alone.
          if (edit.scheduledTime !== editGoal.scheduledTime) {
            forgetPlace(editGoal.id);
          }
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
  // The break between the dailies above and this list. It stays a break rather
  // than a gulf: the exercises and the to-dos are the same day, so the label
  // sits nearer the rows it follows than a separate section would.
  groupLabel: {
    marginTop: spacing.sm,
    // Each section corrects its own gap to the shared label gap, so both
    // labels sit the same distance from the rows they introduce.
    marginBottom: TODAY_JOURNEY_LABEL_GAP - spacing.md,
  },
  journey: {
    position: 'relative',
    gap: JOURNEY_ROW_GAP,
  },
  // The gap is the layout's only while the rows are still being measured; once
  // they stand by transform their offsets carry it.
  journeyRows: {
    gap: JOURNEY_ROW_GAP,
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
