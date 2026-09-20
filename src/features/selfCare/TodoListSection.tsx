import { useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import SectionHeader from '../../components/common/SectionHeader';
import GlassIconButton from '../../components/common/GlassIconButton';
import { usePlanPosition } from '../../hooks/usePlanPosition';
import { planPositionLabel } from '../../lib/planProgress';
import Skeleton from '../../components/common/Skeleton';
import {
  DailyTaskRow,
  type DailyRowContent,
} from '../../components/home/TodaysDailiesSection';
import type { SelfCareGoalDraft } from '../../services/selfCare/selfCareService';
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
import {
  exerciseJourneyId,
  type TodayJourneyId,
} from '../../components/home/journey/todayJourneyOrder';
import {
  todayJourneyLoadState,
  useTodayJourneyOrder,
} from '../../components/home/journey/useTodayJourneyOrder';
import type { DailyPlanActionId } from '../../services/dailyPlan/dailyPlanScheduleCore';
import type { DailyPlanSchedule } from '../../services/dailyPlan/types';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { spacing } from '../../theme/spacing';
import { triggerSuccessHaptic, triggerTapHaptic } from '../../native/tapHaptics';
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
const JOURNEY_ROW_GAP = 12;
const ADD_ROW_OFFSET = TODAY_JOURNEY_GROUP_GAP - JOURNEY_ROW_GAP;
interface JourneyTodoListSectionProps {
  mode?: 'journey';
  dailyRows: Partial<Record<DailyPlanActionId, DailyRowContent>> | null;
  /**
   * The daily check-in's row. Null when this backend cannot hold one, which is
   * the only case where the day does not ask for it.
   */
  /**
   * The rows today has that own no hour, by the id they hold in the list.
   *
   * A map rather than a prop each, because the list does nothing with them
   * except draw them where the journey puts them. A new kind of row — the
   * check-in, the day's lesson, whatever comes after — is an entry here and a
   * place in `UNTIMED_JOURNEY_ORDER`, not another branch in the renderer.
   */
  untimedRows: Partial<Record<TodayJourneyId, DailyRowContent>>;
  /** Canonical persisted schedule. Null while it is still loading. */
  schedule: DailyPlanSchedule | null;
  scheduleError: boolean;
  onRetrySchedule: () => void;
  /** The page the list sits on; the drag makes it wait rather than scroll. */
  scrollRef: JourneyScrollRef;
  userId: string | null;
}

type TodoListSectionProps = JourneyTodoListSectionProps | {
  mode: 'tasks';
  userId: string | null;
  /** A to-do was completed by the person using this screen. */
  onCompleted: (goalTitle: string) => void;
  selectedLocalDate?: string;
  /** Past days are records and must not change current tasks or history. */
  readOnly?: boolean;
  /** Opens the curated routine starting points. */
  onBrowseRoutines: () => void;
};

const EMPTY_GOALS: SelfCareGoal[] = [];
const EMPTY_UNTIMED_ROWS: Partial<Record<TodayJourneyId, DailyRowContent>> = {};
const NOT_ARRANGING = () => false;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

interface GoalCardProps {
  goal: SelfCareGoal;
  busy: boolean;
  readOnly?: boolean;
  /** whether a to-do is being dragged, so a release on this one is not a tap */
  isArranging: () => boolean;
  onToggle: () => void;
  onOpen: () => void;
  /** the same reorder the drag does, one place at a time, for VoiceOver */
  onMove?: (delta: number) => void;
}

/**
 * Shaped like a closed daily above it, so a goal you wrote and a daily the app
 * scheduled read as the same kind of thing on the same journey.
 */
function GoalCard({
  goal,
  busy,
  readOnly = false,
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
        accessibilityHint={readOnly ? 'Completed status for this day' : onMove ? "Opens this habit. Hold to rearrange your plan" : "Opens this habit"}
        {...(onMove ? journeyReorderActions(onMove) : {})}
        disabled={readOnly}
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
            goal.completedToday ? colors.text.tertiary : colors.primary.blue500
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
        disabled={busy || readOnly}
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
        <Icon
          name="check"
          size={24}
          color={
            goal.completedToday ? colors.success[700] : colors.primary.blue500
          }
        />
      </Pressable>
    </View>
  );
}

/** The way onto the personal task list. */
function AddGoalRow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add a habit"
      onPress={() => {
        triggerTapHaptic();
        onPress();
      }}
      style={({ pressed }) => [styles.addRow, pressed && pressable.surface]}
    >
      <View style={styles.addBadge}>
        <Icon name="plus" size={20} color={colors.text.secondary} />
      </View>
      <Text style={styles.addLabel}>Add a habit</Text>
    </Pressable>
  );
}

function AllDoneState({
  fillAvailableSpace = false,
  onAddHabit,
}: {
  fillAvailableSpace?: boolean;
  onAddHabit?: () => void;
}) {
  return (
    <View style={[styles.dayDone, fillAvailableSpace && styles.dayDoneFill]}>
      <Icon
        name="celebration"
        size={DAY_DONE_ICON_SIZE}
        color={colors.primary.blue500}
      />
      <Text style={styles.dayDoneTitle}>
        Woohoo! You’re all completed for the day!
      </Text>
      {onAddHabit == null ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a new habit"
          onPress={() => {
            triggerTapHaptic();
            onAddHabit();
          }}
          style={({ pressed }) => [
            styles.dayDoneAddHabit,
            pressed && pressable.surface,
          ]}
        >
          <Icon name="plus" size={16} color={colors.text.brand} />
          <Text style={styles.dayDoneAddHabitLabel}>Add a new habit</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function TodoListSection(props: TodoListSectionProps) {
  const { userId } = props;
  const tasksOnly = props.mode === 'tasks';
  const dailyRows = tasksOnly ? null : props.dailyRows;
  const untimedRows = tasksOnly ? EMPTY_UNTIMED_ROWS : props.untimedRows;
  const schedule = tasksOnly ? null : props.schedule;
  const scheduleError = tasksOnly ? false : props.scheduleError;
  const isFocused = useIsFocused();
  const focused = useRef(isFocused);
  useEffect(() => {
    focused.current = isFocused;
    return () => { focused.current = false; };
  }, [isFocused]);
  const todayLocalDate = useTodayLocalDate();
  const localDate = tasksOnly
    ? props.selectedLocalDate ?? todayLocalDate
    : todayLocalDate;
  const readOnly = tasksOnly && props.readOnly === true;
  const planPosition = usePlanPosition(tasksOnly ? null : userId);
  const goalsQuery = useSelfCareGoalsQuery(tasksOnly ? userId : null, localDate);
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
  const goals = tasksOnly ? goalsQuery.data ?? EMPTY_GOALS : EMPTY_GOALS;
  // Membership is settled by the caller, which is what knows whether there is
  // a check-in to answer or a lesson today; the order between them belongs to
  // the journey. Keyed on the ids so a row object rebuilt by a parent render
  // does not rebuild the baseline underneath a finger holding a row.
  const untimedIds = Object.keys(untimedRows) as TodayJourneyId[];
  const untimedKey = untimedIds.join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const untimedRowIds = useMemo(() => untimedIds, [untimedKey]);
  const journeyOrder = useTodayJourneyOrder({
    // A standalone task list must never reconcile or write Home's mixed order.
    userId: tasksOnly ? null : userId,
    actions: schedule?.actions ?? null,
    goals: EMPTY_GOALS,
    untimed: untimedRowIds,
  });
  const plan = planSelfCareGoalList(goals);
  const railGoals = plan.rail;
  const drawerGoals = plan.drawer;
  const shownGoals = readOnly ? goals : railGoals;
  const allGoalsCompleted =
    tasksOnly &&
    !readOnly &&
    goalsQuery.isSuccess &&
    goals.length > 0 &&
    goals.every((goal) => goal.completedToday);

  const toggleCompleted = (goal: SelfCareGoal) => {
    const completed = !goal.completedToday;
    // Feedback belongs to this user action, never to a cache refresh or a
    // completion made elsewhere while this screen is mounted.
    void toggleGoal.mutateAsync({ goalId: goal.id, completed }).then(() => {
      if (!tasksOnly || !completed || !focused.current) return;
      triggerSuccessHaptic();
      props.onCompleted(goal.title);
    }).catch(() => {
      // The mutation owns rollback and the inline error message.
    });
  };

  const detailGoal = goals.find((goal) => goal.id === detailGoalId) ?? null;
  const editGoal = goals.find((goal) => goal.id === editGoalId) ?? null;
  const atLimit = goals.length >= MAX_SELF_CARE_GOALS;
  // The create error belongs to the sheet that is still open over this list.
  const mutationError =
    toggleGoal.error ?? archiveGoal.error ?? featureGoal.error;
  const addNodeVisible = goalsQuery.isSuccess && !atLimit;
  const journeyReady = journeyOrder.ready && dailyRows != null;
  const fullOrder = journeyOrder.fullOrder;
  // Only the hours today actually fills. A plan asks for one exercise in its
  // first week and three by its last, and a slot with no row would otherwise
  // hold an empty space in the list where its exercise will eventually go.
  const visibleIdSet = new Set<TodayJourneyId>([
    ...untimedRowIds,
    ...Object.keys(dailyRows ?? {}).map((actionId) =>
      exerciseJourneyId(actionId as DailyPlanActionId),
    ),
  ]);
  // Home keeps completed plan rows in place. The completion sheet is the
  // celebration; replacing the list with a second all-done state hides the
  // plan people just finished.
  const journeyIds = !journeyReady
    ? []
    : fullOrder.filter((id) => visibleIdSet.has(id));
  const { controller, moveBy, restoreOrder } = useJourneyReorder({
    ids: journeyIds,
    gap: JOURNEY_ROW_GAP,
    enabled: !tasksOnly,
    // The rows stand up by transform rather than by their place in the layout,
    // so committing a new order re-lays out nothing. Heights here are measured
    // rather than given — a to-do's height is whatever its title needs — so
    // this only takes effect on the frame after the list first lays out.
    positioned: true,
    // A to-do arriving or leaving moves the rest of the list on the same curve
    // used by the daily rows above it.
    restingTiming: TODAY_JOURNEY_RAIL_TIMING,
    onReorder: (orderedIds) => {
      // The list changed while the finger was down — a to-do finished on
      // another device, a refetch landing — so the order is against rows that
      // have moved and the ones on screen go back where they were.
      if (!journeyOrder.commitVisibleOrder(orderedIds as TodayJourneyId[])) {
        restoreOrder();
      }
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

  const loadState = todayJourneyLoadState({
    scheduleAvailable: schedule != null && dailyRows != null,
    scheduleError,
    goalsAvailable: true,
    goalsError: false,
    orderReady: journeyOrder.ready,
  });
  const initialLoadError = tasksOnly
    ? goalsQuery.data == null && goalsQuery.isError
    : loadState === 'error';
  const initialLoading = tasksOnly
    ? goalsQuery.data == null && !goalsQuery.isError
    : loadState === 'loading';
  const retryInitialLoad = () => {
    if (!tasksOnly && schedule == null && scheduleError) props.onRetrySchedule();
    if (tasksOnly && goalsQuery.data == null && goalsQuery.isError) void goalsQuery.refetch();
  };

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
      <SectionHeader
        icon="calendar"
        title={tasksOnly ? (readOnly ? "To-dos for this day" : "My To-dos") : "My Plan"}
        right={
          tasksOnly && !readOnly ? (
            <GlassIconButton
              accessibilityLabel="Browse routine suggestions"
              size={36}
              variant="regular"
              onPress={props.onBrowseRoutines}
            >
              <Icon name="plus" size={20} color={colors.text.secondary} />
            </GlassIconButton>
          ) : planPosition == null ? null : (
            <Text style={styles.planWeek}>
              {planPositionLabel(planPosition)}
            </Text>
          )
        }
      />
      {initialLoading ? (
        <View accessibilityLabel={tasksOnly ? "Loading your to-dos" : "Loading your plan"} style={styles.loadingRows}>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} height={GOAL_ROW_HEIGHT} radius={radius.medium} />
          ))}
        </View>
      ) : initialLoadError ? (
        <View style={[card.base, styles.statusCard]}>
          <Text style={styles.statusText}>
            {tasksOnly ? "Couldn’t load your to-dos." : "Couldn’t load your plan."}
          </Text>
          <Pressable accessibilityRole="button" onPress={retryInitialLoad}>
            <Text style={styles.retryLabel}>Retry</Text>
          </Pressable>
        </View>
      ) : allGoalsCompleted ? (
        <AllDoneState
          fillAvailableSpace
          onAddHabit={atLimit ? undefined : () => setAdding(true)}
        />
      ) : tasksOnly ? (
        <View style={styles.journey}>
          {shownGoals.map((goal) => (
            <View key={goal.id} style={styles.journeyRow}>
              <GoalCard
                goal={goal}
                busy={toggleGoal.isPending && toggleGoal.variables?.goalId === goal.id}
                readOnly={readOnly}
                isArranging={NOT_ARRANGING}
                onToggle={() => toggleCompleted(goal)}
                onOpen={() => setDetailGoalId(goal.id)}
              />
            </View>
          ))}
          {!readOnly && addNodeVisible ? <AddGoalRow onPress={() => setAdding(true)} /> : null}
        </View>
      ) : journeyReady ? (
        <View style={styles.journey}>
          {/* The rows' own box. Once they are positioned by transform they
              stand at the top of it and are moved down into place, so it is
              told how tall they are together instead of being told by them —
              and the add row below stays below them. */}
          {journeyIds.length > 0 ? (
            <View
              style={[
                styles.journeyRows,
                { height: controller.contentHeight ?? undefined },
              ]}
            >
              {journeyIds.map((id, index) => {
                const untimedRow = untimedRows[id];
                const actionId = id.startsWith('exercise:')
                  ? id.slice('exercise:'.length) as DailyPlanActionId
                  : null;
                return (
                <JourneyDragRow
                  key={id}
                  controller={controller}
                  id={id}
                  index={index}
                  scrollRef={props.scrollRef}
                  style={styles.journeyRow}
                >
                  {untimedRow != null ? (
                    <DailyTaskRow
                      {...untimedRow}
                      isArranging={controller.isArranging}
                      onMove={(delta) => moveBy(id, delta)}
                    />
                  ) : actionId != null && dailyRows[actionId] != null ? (
                    <DailyTaskRow
                      {...dailyRows[actionId]}
                      isArranging={controller.isArranging}
                      onMove={(delta) => moveBy(id, delta)}
                    />
                  ) : null}
                </JourneyDragRow>
              )})}
            </View>
          ) : null}
        </View>
      ) : null}

      {!tasksOnly || readOnly || allGoalsCompleted || drawerGoals.length === 0 ? null : (
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
                accessibilityHint="Opens this habit"
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

      {tasksOnly && !readOnly ? <>
      <GoalDetailSheet
        goal={detailGoal}
        busy={toggleGoal.isPending || archiveGoal.isPending}
        onClose={() => setDetailGoalId(null)}
        onToggleComplete={() => {
          if (detailGoal == null) return;
          toggleCompleted(detailGoal);
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
          const goalId = detailGoal.id;
          setDetailGoalId(null);
          archiveGoal.mutate(goalId);
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
        <Text style={styles.limitText}>Remove a habit before adding another.</Text>
      ) : null}
      {mutationError != null ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {errorMessage(mutationError)}
        </Text>
      ) : null}
      </> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  planWeek: {
    ...typography.label.detail,
    color: colors.text.tertiary,
  },
  journey: {
    position: 'relative',
    gap: JOURNEY_ROW_GAP,
  },
  loadingRows: {
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
  dayDoneFill: {
    minHeight: 280,
    justifyContent: 'center',
  },
  dayDoneAddHabit: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background.accentSoft,
  },
  dayDoneAddHabitLabel: {
    ...typography.label.detail,
    fontFamily: fonts.semibold,
    color: colors.text.brand,
  },
  dayDoneTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
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
    gap: 6,
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
    textDecorationLine: 'line-through',
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
