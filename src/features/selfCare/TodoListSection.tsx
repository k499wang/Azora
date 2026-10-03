import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import SectionHeader from '../../components/common/SectionHeader';
import GlassIconButton from '../../components/common/GlassIconButton';
import { usePlanPosition } from '../../hooks/usePlanPosition';
import NextDayCountdown from '../room/NextDayCountdown';
import Skeleton from '../../components/common/Skeleton';
import ChunkyButton from '../../components/common/ChunkyButton';
import {
  DailyTaskRow,
  type DailyRowContent,
  type DailyTaskRowProps,
  type RoomPieceState,
} from '../../components/home/TodaysDailiesSection';
import type { SelfCareGoalDraft } from '../../services/selfCare/selfCareService';
import AddGoalSheet from './AddGoalSheet';
import GoalDetailSheet from './GoalDetailSheet';
import GoalEditSheet from './GoalEditSheet';
import RoutineTaskIcon from './RoutineTaskIcon';
import StruckTitle from './StruckTitle';
import CheckBurst from './CheckBurst';
import { useSettlingGoals } from './useSettlingGoals';
import {
  GOAL_COMPLETION_MOTION_MS,
  GOAL_FILING_MS,
  goalCompletionMotionSettled,
  useGoalCompletionMotion,
} from './useGoalCompletionMotion';
import { useFirstWinOfDay } from './useFirstWinOfDay';
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
  selfCareGoalRecurrenceLabel,
  planSelfCareGoalList,
  reorderedSelfCareGoalPlaces,
  type SelfCareGoal,
  type SelfCareGoalPlaces,
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
import { duration, easing, spring } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { triggerSuccessHaptic, triggerTapHaptic } from '../../native/tapHaptics';
import { fonts, typography, wrappedLineHeight } from '../../theme/typography';
import JourneyDragRow from '../../components/home/journey/JourneyDragRow';
import {
  JourneyDestinationNode,
  JourneyRowMarker,
} from '../../components/home/journey/JourneyNodes';
import {
  journeyNextIndex,
  type JourneyRailEnds,
  type JourneyRailMetrics,
} from '../../components/home/journey/journeyReorder';
import { useJourneyRail } from '../../components/home/journey/useJourneyRail';
import {
  journeyReorderActions,
  useJourneyReorder,
  type JourneyScrollRef,
} from '../../components/home/journey/useJourneyReorder';
import {
  loadSelfCareGoalPlaces,
  saveSelfCareGoalPlaces,
  selfCareGoalPlacesNow,
} from '../../services/preferences/selfCareGoalOrder';
import {
  TODAY_JOURNEY_CARD_MIN_HEIGHT,
  TODAY_JOURNEY_COLUMN_WIDTH,
  TODAY_JOURNEY_DASH_GAP,
  TODAY_JOURNEY_DASH_HEIGHT,
  TODAY_JOURNEY_GROUP_GAP,
  TODAY_JOURNEY_RAIL_TIMING,
  TODAY_JOURNEY_RAIL_WIDTH,
  todayJourneyDashCount,
} from '../../components/home/todayJourneyLayout';
import { useTourTarget } from '../tour/tourTargets';

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
const GOAL_CHECK_FILL_SIZE = Math.ceil(GOAL_CHECK_SIZE * Math.SQRT2);
const GOAL_CHECK_MARK_SIZE = 24;
/** A beat after the tick lands, so the finished card is seen before it is filed. */
const GOAL_HOLD_MS = GOAL_COMPLETION_MOTION_MS + 500;
const DRAWER_PULSE_SCALE = 1.06;
const JOURNEY_ROW_GAP = 12;
const ADD_ROW_OFFSET = TODAY_JOURNEY_GROUP_GAP - JOURNEY_ROW_GAP;
/** The height of the room card's own button, whose slot this takes. */
const START_NEXT_MIN_HEIGHT = 56;

/** From the first row's marker to the last one the rail reaches. */
function railToLastMarker({
  firstHeight,
  lastHeight,
  lastOffset,
  height,
}: JourneyRailMetrics): JourneyRailEnds {
  'worklet';
  return {
    top: firstHeight / 2,
    bottom: height - (lastOffset + lastHeight / 2),
  };
}

/**
 * The same, running on to the room piece's marker once it reaches every row.
 * The piece is the only thing below the rows, a row gap under the last one, so
 * whatever of the box they and that gap do not fill is its card.
 */
function railToDestination(metrics: JourneyRailMetrics): JourneyRailEnds {
  'worklet';
  if (!metrics.reachesEnd) return railToLastMarker(metrics);
  const { firstHeight, lastHeight, lastOffset, height } = metrics;
  return {
    top: firstHeight / 2,
    bottom: (height - (lastOffset + lastHeight + JOURNEY_ROW_GAP)) / 2,
  };
}

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
  /** Where the plan leads — the room piece the day earns — once it is known. */
  destination?: RoomPieceState;
  /** Marks the room piece card for the app tour. */
  destinationTarget?: DailyTaskRowProps['actionTarget'];
  /**
   * Leads the plan with a button that starts the next row, standing in the
   * slot Home's room card holds while there is nothing to claim.
   */
  startNext?: { target: DailyTaskRowProps['actionTarget'] };
}

type TodoListSectionProps = JourneyTodoListSectionProps | {
  mode: 'tasks';
  userId: string | null;
  /** A to-do was completed by the person using this screen. */
  onCompleted: (completion: { goalId: string; goalTitle: string; isFirstWinToday: boolean }) => void;
  selectedLocalDate?: string;
  /** Past days are records and must not change current tasks or history. */
  readOnly?: boolean;
  /** Opens the curated routine starting points. */
  onBrowseRoutines: () => void;
  /** Marks the routine add action for the post-onboarding app tour. */
  tourAddHabitTarget?: boolean;
  /** Lets a held row keep the page from scrolling underneath it. */
  scrollRef?: JourneyScrollRef;
};

const EMPTY_GOALS: SelfCareGoal[] = [];
const EMPTY_IDS: ReadonlySet<string> = new Set();
const EMPTY_UNTIMED_ROWS: Partial<Record<TodayJourneyId, DailyRowContent>> = {};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

interface GoalCardProps {
  goal: SelfCareGoal;
  busy: boolean;
  /** finished, and fading out ahead of being filed into the drawer */
  filing?: boolean;
  readOnly?: boolean;
  /** whether a to-do is being dragged, so a release on this one is not a tap */
  isArranging: () => boolean;
  onToggle: (goal: SelfCareGoal) => void;
  onOpen: (goalId: string) => void;
  /** the same reorder the drag does, one place at a time, for VoiceOver */
  onMove?: (goalId: string, delta: number) => void;
}

/**
 * Shaped like a closed daily above it, so a goal you wrote and a daily the app
 * scheduled read as the same kind of thing on the same journey.
 *
 * Memoised, with handlers that take the goal rather than closing over it: a
 * tick rewrites one goal in the cache, and only that card should re-render.
 */
const GoalCard = memo(function GoalCard({
  goal,
  busy,
  filing = false,
  readOnly = false,
  isArranging,
  onToggle,
  onOpen,
  onMove,
}: GoalCardProps) {
  const motion = useGoalCompletionMotion(goal.completedToday, filing);
  const content = (
    <>
      <RoutineTaskIcon name={goal.icon} done={goal.completedToday} />
      <View style={styles.goalText}>
        {goal.featuredToday ? (
          <Text style={styles.goalFeaturedLabel}>Task of the day</Text>
        ) : null}
        <StruckTitle
          title={goal.title}
          numberOfLines={GOAL_TITLE_MAX_LINES}
          progress={motion.strike}
          style={styles.goalTitle}
        />
        <Text style={styles.goalTime}>
          {selfCareGoalRecurrenceLabel(goal.recurrence)}
          {goal.scheduledTime == null
            ? ''
            : ` · ${selfCareGoalDaypartLabel(goal.scheduledTime)}`}
        </Text>
      </View>
      {goal.featuredToday ? (
        <Icon
          name="star"
          size={FEATURED_STAR_SIZE}
          color={colors.reward.gold}
        />
      ) : null}
    </>
  );

  if (readOnly) {
    return (
      <View
        accessible
        accessibilityLabel={`${goal.title}, ${goal.completedToday ? 'completed' : 'not completed'}`}
        style={[card.base, styles.goalCard, styles.goalButton]}
      >
        {content}
      </View>
    );
  }

  return (
    <Animated.View style={[card.base, styles.goalCard, motion.cardStyle]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.goalFlash, motion.flashStyle]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={goal.title}
        accessibilityHint={onMove ? "Opens this habit. Hold to rearrange your plan" : "Opens this habit"}
        {...(onMove
          ? journeyReorderActions((delta) => onMove(goal.id, delta))
          : {})}
        onPress={() => {
          // The finger that just dropped this row is not also tapping it.
          if (isArranging()) return;
          triggerTapHaptic();
          onOpen(goal.id);
        }}
        style={({ pressed }) => [styles.goalButton, pressed && pressable.subtle]}
      >
        {content}
      </Pressable>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: goal.completedToday }}
        accessibilityLabel={`${goal.title}, ${goal.completedToday ? 'completed' : 'not completed'}`}
        disabled={busy}
        onPress={() => {
          if (isArranging()) return;
          const next = !goal.completedToday;
          if (next) triggerSuccessHaptic();
          else triggerTapHaptic();
          motion.play(next);
          onToggle(goal);
        }}
        hitSlop={6}
        style={({ pressed }) => pressed && pressable.control}
      >
        <CheckBurst size={GOAL_CHECK_SIZE} progress={motion.burst} />
        <Animated.View style={[styles.goalCheck, motion.checkStyle]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.goalCheckFill, motion.checkFillStyle]}
          />
          <Animated.View style={motion.checkMarkStyle}>
            <Animated.View style={motion.checkMarkTodoStyle}>
              <Icon name="check" size={GOAL_CHECK_MARK_SIZE} color={colors.primary.blue500} />
            </Animated.View>
            <Animated.View
              style={[styles.goalCheckMarkDone, motion.checkMarkDoneStyle]}
            >
              <Icon name="check" size={GOAL_CHECK_MARK_SIZE} color={colors.success[700]} />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

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
    <Animated.View
      entering={FadeIn.duration(duration.slow)}
      style={[styles.dayDone, fillAvailableSpace && styles.dayDoneFill]}
    >
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
    </Animated.View>
  );
}

export default function TodoListSection(props: TodoListSectionProps) {
  const { userId } = props;
  const tasksOnly = props.mode === 'tasks';
  const dailyRows = tasksOnly ? null : props.dailyRows;
  const untimedRows = tasksOnly ? EMPTY_UNTIMED_ROWS : props.untimedRows;
  const schedule = tasksOnly ? null : props.schedule;
  const scheduleError = tasksOnly ? false : props.scheduleError;
  const destination = tasksOnly ? undefined : props.destination;
  const destinationTarget = tasksOnly ? undefined : props.destinationTarget;
  const startNext = tasksOnly ? undefined : props.startNext;
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
  const firstWin = useFirstWinOfDay(tasksOnly ? userId : null);
  const planPosition = usePlanPosition(tasksOnly ? null : userId);
  const goalsQuery = useSelfCareGoalsQuery(tasksOnly ? userId : null, localDate);
  const createGoal = useCreateSelfCareGoalMutation(userId, localDate);
  const toggleGoal = useToggleSelfCareGoalMutation(userId, localDate);
  const archiveGoal = useArchiveSelfCareGoalMutation(userId, localDate);
  const featureGoal = useSetSelfCareGoalFeaturedMutation(userId, localDate);
  const updateGoal = useUpdateSelfCareGoalMutation(userId, localDate);
  const [adding, setAdding] = useState(false);
  const routineAddHabitTarget = useTourTarget('routineAddHabit');
  const routineOverviewTarget = useTourTarget('routineOverview');
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
  const settlingGoals = useSettlingGoals({
    holdMs: GOAL_HOLD_MS,
    leaveMs: GOAL_FILING_MS,
  });
  const [goalPlaces, setGoalPlaces] = useState<SelfCareGoalPlaces>(selfCareGoalPlacesNow);
  const goals = tasksOnly ? goalsQuery.data ?? EMPTY_GOALS : EMPTY_GOALS;
  useEffect(() => {
    if (!tasksOnly || userId == null) return;
    let active = true;
    void loadSelfCareGoalPlaces().then((storedPlaces) => {
      if (active) setGoalPlaces(storedPlaces);
    });
    return () => { active = false; };
  }, [tasksOnly, userId]);
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
  const plan = planSelfCareGoalList(goals, goalPlaces, settlingGoals.settling);
  const railGoals = plan.rail;
  const drawerGoals = plan.drawer;
  const shownGoals = readOnly ? goals : railGoals;
  const taskIds = shownGoals.map((goal) => goal.id);
  const allGoalsCompleted =
    tasksOnly &&
    !readOnly &&
    goalsQuery.isSuccess &&
    goals.length > 0 &&
    goals.every((goal) => goal.completedToday);
  const showAllDone = allGoalsCompleted && settlingGoals.settling.size === 0;
  // The cards that leave the rail once the goals still holding let go: those
  // bound for the drawer, or every card when the day is about to be replaced by
  // the all-done state. They fade out in place first.
  const filingIds =
    settlingGoals.settling.size === settlingGoals.holding.size
      ? EMPTY_IDS
      : allGoalsCompleted && settlingGoals.holding.size === 0
        ? new Set(shownGoals.map((goal) => goal.id))
        : new Set(
            planSelfCareGoalList(goals, goalPlaces, settlingGoals.holding)
              .drawer.map((goal) => goal.id),
          );

  const toggleCompleted = (goal: SelfCareGoal) => {
    const completed = !goal.completedToday;
    const isFirstWinToday =
      tasksOnly &&
      !readOnly &&
      completed &&
      localDate === todayLocalDate &&
      firstWin.claim();
    const write = toggleGoal.mutateAsync({ goalId: goal.id, completed });
    // The mutation owns rollback and the inline error message.
    write.catch(() => {
      if (isFirstWinToday) firstWin.release();
    });
    // Feedback belongs to this user action, never to a cache refresh or a
    // completion made elsewhere while this screen is mounted.
    if (!tasksOnly) return;
    if (!completed) {
      settlingGoals.release(goal.id);
      return;
    }
    settlingGoals.hold(goal.id);
    const completion = { goalId: goal.id, goalTitle: goal.title, isFirstWinToday };
    // A tick is one boolean that almost never fails, so its cheer goes off with
    // the tap rather than a network round trip later; a failure rolls the card
    // back and says so. The first win of the day is a milestone instead: it
    // waits for the write to land, so it never celebrates one that didn't, and
    // for the tick to finish, so its modal never covers the card mid-motion.
    if (!isFirstWinToday) {
      props.onCompleted(completion);
      return;
    }
    void Promise.all([write, goalCompletionMotionSettled()]).then(
      () => {
        if (focused.current) props.onCompleted(completion);
      },
      () => {},
    );
  };

  // One identity for the life of the list, so the memoised cards are not
  // re-rendered by a handler that is new each render; it calls the latest.
  const toggleCompletedRef = useRef(toggleCompleted);
  toggleCompletedRef.current = toggleCompleted;
  const toggleGoalCompleted = useCallback(
    (goal: SelfCareGoal) => toggleCompletedRef.current(goal),
    [],
  );

  const detailGoal = goals.find((goal) => goal.id === detailGoalId) ?? null;
  const editGoal = goals.find((goal) => goal.id === editGoalId) ?? null;
  // The create error belongs to the sheet that is still open over this list.
  const mutationError =
    toggleGoal.error ?? archiveGoal.error ?? featureGoal.error;
  const addNodeVisible = goalsQuery.isSuccess;
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
  const journeyRow = (id: TodayJourneyId): DailyRowContent | undefined =>
    untimedRows[id] ??
    (id.startsWith('exercise:')
      ? dailyRows?.[id.slice('exercise:'.length) as DailyPlanActionId]
      : undefined);
  const doneIds = journeyIds.filter((id) => journeyRow(id)?.completed === true);
  const doneKey = doneIds.join('|');
  // Keyed on the ids, not the rows: the rail's worklet is rebuilt whenever this
  // changes identity, and the rows are rebuilt by every parent render.
  const doneRows = useMemo(
    () => Object.fromEntries(doneIds.map((id) => [id, true])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doneKey],
  );
  const nextId = journeyIds[journeyNextIndex(journeyIds, doneRows)];
  const nextRow = nextId == null ? undefined : journeyRow(nextId);
  const startNextPress =
    startNext == null || nextRow == null || nextRow.loading === true
      ? undefined
      : nextRow.onPress;
  /**
   * The rail is measured rather than computed: a row's height is whatever its
   * title needs, so a rail derived from a row constant drifts off the markers
   * the moment one wraps.
   */
  const [journeyHeight, setJourneyHeight] = useState<number | null>(null);
  const measureJourney = useCallback((event: LayoutChangeEvent) => {
    setJourneyHeight(event.nativeEvent.layout.height);
  }, []);
  const { controller, moveBy, restoreOrder } = useJourneyReorder({
    ids: tasksOnly ? taskIds : journeyIds,
    gap: JOURNEY_ROW_GAP,
    enabled: tasksOnly ? !readOnly : true,
    // The rows stand up by transform rather than by their place in the layout,
    // so committing a new order re-lays out nothing. Heights here are measured
    // rather than given — a to-do's height is whatever its title needs — so
    // this only takes effect on the frame after the list first lays out.
    positioned: true,
    // A to-do arriving or leaving moves the rest of the list on the same curve
    // used by the daily rows above it.
    restingTiming: TODAY_JOURNEY_RAIL_TIMING,
    onReorder: (orderedIds) => {
      if (tasksOnly) {
        const nextPlaces = reorderedSelfCareGoalPlaces(shownGoals, goalPlaces, orderedIds);
        if (nextPlaces == null) {
          restoreOrder();
          return;
        }
        setGoalPlaces(nextPlaces);
        void saveSelfCareGoalPlaces(nextPlaces);
        return;
      }
      // The list changed while the finger was down — a to-do finished on
      // another device, a refetch landing — so the order is against rows that
      // have moved and the ones on screen go back where they were.
      if (!journeyOrder.commitVisibleOrder(orderedIds as TodayJourneyId[])) {
        restoreOrder();
      }
    },
  });

  // The to-do rows' box follows them down and up on their own curve. Sized by
  // a plain style it snapped to its new height on the commit, so everything
  // under it — the add row, the drawer, the end of the page — jumped ahead of
  // the rows still sliding, and the scroll view clamped in one jolt.
  //
  // Left to the plain style while it is first laid out, which has to land in
  // the same commit that positions the rows; taken over once it is standing.
  const contentHeight = controller.contentHeight;
  const rowsBoxShown =
    tasksOnly && goalsQuery.data != null && !showAllDone && taskIds.length > 0;
  const rowsBoxHeight = useSharedValue(-1);
  useEffect(() => {
    if (!rowsBoxShown || contentHeight == null) {
      rowsBoxHeight.value = -1;
      return;
    }
    rowsBoxHeight.value =
      rowsBoxHeight.value < 0
        ? contentHeight
        : withTiming(contentHeight, TODAY_JOURNEY_RAIL_TIMING);
  }, [rowsBoxShown, contentHeight, rowsBoxHeight]);
  const rowsBoxStyle = useAnimatedStyle(() =>
    rowsBoxHeight.value < 0 ? {} : { height: rowsBoxHeight.value },
  );

  const railShape = destination == null ? railToLastMarker : railToDestination;
  const railStyle = useJourneyRail({
    controller,
    ids: journeyIds,
    height: journeyHeight ?? 0,
    timing: TODAY_JOURNEY_RAIL_TIMING,
    shape: railShape,
  });
  // Filled only as far as the plan has been done in order, so finishing the
  // last row first checks it off without claiming the path to it.
  const progressStyle = useJourneyRail({
    controller,
    ids: journeyIds,
    height: journeyHeight ?? 0,
    timing: TODAY_JOURNEY_RAIL_TIMING,
    shape: railShape,
    done: doneRows,
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

  // The summary swells as each finished card is filed into it.
  const drawerCount = drawerGoals.length;
  const filedCount = useRef(drawerCount);
  const drawerPulse = useSharedValue(1);
  useEffect(() => {
    const grew = filedCount.current > 0 && drawerCount > filedCount.current;
    filedCount.current = drawerCount;
    if (!grew) return;
    drawerPulse.value = withSequence(
      withTiming(DRAWER_PULSE_SCALE, { duration: duration.fast, easing: easing.enter }),
      withSpring(1, spring.pop),
    );
  }, [drawerCount, drawerPulse]);
  const drawerPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: drawerPulse.value }],
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
    if (createGoal.isPending) return;
    createGoal.mutate(draft, { onSuccess: () => setAdding(false) });
  };

  const closeSheet = () => {
    setAdding(false);
    createGoal.reset();
  };

  return (
    <View
      style={styles.section}
      {...(props.mode === 'tasks' && props.tourAddHabitTarget ? routineOverviewTarget : {})}
    >
      {initialLoading || initialLoadError || startNextPress == null || nextRow == null ? null : (
        <View {...startNext?.target}>
          <ChunkyButton
            label="Start my plan"
            labelSize="xlarge"
            icon={<Icon name="play-triangle" size={22} color={colors.text.inverse} />}
            shape="card"
            minHeight={START_NEXT_MIN_HEIGHT}
            onPress={startNextPress}
          />
        </View>
      )}
      <SectionHeader
        icon="calendar"
        title={tasksOnly ? (readOnly ? "To-dos for this day" : "My To-dos") : "My Plan"}
        right={
          tasksOnly && !readOnly ? (
            <View
              {...(props.mode === 'tasks' && props.tourAddHabitTarget
                ? routineAddHabitTarget
                : {})}
            >
              <GlassIconButton
                accessibilityLabel="Browse routine suggestions"
                size={36}
                variant="regular"
                onPress={props.onBrowseRoutines}
              >
                <Icon name="plus" size={20} color={colors.text.secondary} />
              </GlassIconButton>
            </View>
          ) : planPosition == null ? null : (
            <NextDayCountdown label="Refreshes in" style={styles.planWeek} />
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
      ) : showAllDone ? (
        <AllDoneState
          fillAvailableSpace
          onAddHabit={() => setAdding(true)}
        />
      ) : tasksOnly ? (
        <View style={styles.journey}>
          {taskIds.length > 0 ? (
            <Animated.View
              style={[
                styles.journeyRows,
                { height: contentHeight ?? undefined },
                rowsBoxStyle,
              ]}
            >
              {shownGoals.map((goal, index) => (
                <JourneyDragRow
                  key={goal.id}
                  controller={controller}
                  id={goal.id}
                  index={index}
                  scrollRef={props.scrollRef}
                  style={styles.journeyRow}
                >
                  <GoalCard
                    goal={goal}
                    busy={toggleGoal.isPending && toggleGoal.variables?.goalId === goal.id}
                    filing={filingIds.has(goal.id)}
                    readOnly={readOnly}
                    isArranging={controller.isArranging}
                    onToggle={toggleGoalCompleted}
                    onOpen={setDetailGoalId}
                    onMove={moveBy}
                  />
                </JourneyDragRow>
              ))}
            </Animated.View>
          ) : null}
          {!readOnly && addNodeVisible ? <AddGoalRow onPress={() => setAdding(true)} /> : null}
        </View>
      ) : journeyReady ? (
        <View style={styles.journey} onLayout={measureJourney}>
          {/* Mounted with the box it is measured against, and then kept — a
              row being added is unmeasured for a frame, and the rail holds its
              last ends through that rather than blinking off and back. */}
          {journeyHeight == null ? null : (
            <>
              <Animated.View
                pointerEvents="none"
                style={[styles.journeyRail, railStyle]}
              >
                {Array.from({ length: todayJourneyDashCount(journeyHeight) }, (_, dash) => (
                  <View key={dash} style={styles.journeyRailDash} />
                ))}
              </Animated.View>
              <Animated.View
                pointerEvents="none"
                style={[styles.journeyRail, styles.journeyRailProgress, progressStyle]}
              />
            </>
          )}
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
                const row = journeyRow(id);
                return (
                <JourneyDragRow
                  key={id}
                  controller={controller}
                  id={id}
                  index={index}
                  scrollRef={props.scrollRef}
                  style={styles.journeyRow}
                >
                  {row == null ? null : (
                    <>
                      <JourneyRowMarker
                        completed={row.completed}
                        locked={row.locked}
                      />
                      <DailyTaskRow
                        {...row}
                        isArranging={controller.isArranging}
                        onMove={(delta) => moveBy(id, delta)}
                      />
                    </>
                  )}
                </JourneyDragRow>
              )})}
            </View>
          ) : null}
          {destination == null || journeyIds.length === 0 ? null : (
            <JourneyDestinationNode state={destination} target={destinationTarget} />
          )}
        </View>
      ) : null}

      {!tasksOnly || readOnly || showAllDone || drawerGoals.length === 0 ? null : (
        <Animated.View
          entering={FadeIn.duration(duration.slow)}
          style={[styles.completed, drawerPulseStyle]}
        >
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
        </Animated.View>
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
            { goalId: editGoal.id, previousRecurrence: editGoal.recurrence, ...edit },
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
  journeyRail: {
    position: 'absolute',
    overflow: 'hidden',
    left: TODAY_JOURNEY_COLUMN_WIDTH / 2 - TODAY_JOURNEY_RAIL_WIDTH / 2,
    width: TODAY_JOURNEY_RAIL_WIDTH,
    borderRadius: TODAY_JOURNEY_RAIL_WIDTH / 2,
  },
  journeyRailDash: {
    width: TODAY_JOURNEY_RAIL_WIDTH,
    height: TODAY_JOURNEY_DASH_HEIGHT,
    marginBottom: TODAY_JOURNEY_DASH_GAP,
    borderRadius: TODAY_JOURNEY_RAIL_WIDTH / 2,
    backgroundColor: colors.border.default,
  },
  journeyRailProgress: {
    backgroundColor: colors.playful.sky.base,
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
  goalFlash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.medium,
    backgroundColor: colors.success[100],
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
    overflow: 'hidden',
  },
  // The key keeps its lip when it fills in — still a key, just a green one.
  // The green is `goalCheckFill`, blooming out from the middle as it's ticked,
  // and the border colour follows it in `useGoalCompletionMotion`.
  // Wide enough to reach the corners of the key once it has fully grown.
  // Pinned to the left edge and widened by the motion, so the mark is uncovered
  // the way it would be drawn.
  goalCheckMarkDone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  goalCheckFill: {
    position: 'absolute',
    width: GOAL_CHECK_FILL_SIZE,
    height: GOAL_CHECK_FILL_SIZE,
    borderRadius: GOAL_CHECK_FILL_SIZE / 2,
    backgroundColor: colors.success[100],
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
  errorText: {
    ...typography.body.xsmall,
    color: colors.error[700],
  },
});
