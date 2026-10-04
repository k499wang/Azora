import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Animated, {
  FadeIn,
  LinearTransition,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withDelay,
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
import CompletedGoalsDrawer from './CompletedGoalsDrawer';
import { useSettlingGoals } from './useSettlingGoals';
import {
  CHECK_MARK_SIZE,
  GOAL_COMPLETION_MOTION_MS,
  GOAL_FILING_MS,
  goalCompletionMotionSettled,
  useGoalCompletionMotion,
} from './useGoalCompletionMotion';
import { useFirstWinOfDay } from './useFirstWinOfDay';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useSelfCareGoalsQuery } from '../../queries/selfCare/useSelfCareGoalsQuery';
import { useCreateSelfCareGoalMutation } from '../../queries/selfCare/useCreateSelfCareGoalMutation';
import { useToggleSelfCareGoalMutation } from '../../queries/selfCare/useToggleSelfCareGoalMutation';
import { useArchiveSelfCareGoalMutation } from '../../queries/selfCare/useArchiveSelfCareGoalMutation';
import { useSetSelfCareGoalFeaturedMutation } from '../../queries/selfCare/useSetSelfCareGoalFeaturedMutation';
import { useUpdateSelfCareGoalMutation } from '../../queries/selfCare/useUpdateSelfCareGoalMutation';
import {
  selfCareGoalCoins,
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
import { card, radius, TASK_KEY_HEIGHT, TASK_KEY_WIDTH } from '../../theme/card';
import { colors } from '../../theme/colors';
import { pressable } from '../../theme/pressable';
import { duration, easing } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { triggerSuccessHaptic, triggerTapHaptic } from '../../native/tapHaptics';
import { fonts, typography } from '../../theme/typography';
import JourneyDragRow from '../../components/home/journey/JourneyDragRow';
import TaskCardBody, {
  taskCard,
  TASK_TITLE_MAX_LINES,
} from '../../components/home/journey/TaskCardBody';
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
  type JourneyReorderController,
  type JourneyScrollRef,
} from '../../components/home/journey/useJourneyReorder';
import {
  loadSelfCareGoalPlaces,
  saveSelfCareGoalPlaces,
  selfCareGoalPlacesLoaded,
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
const DAY_DONE_ICON_SIZE = 64;
const EMPTY_DAY_ICON_SIZE = 40;
const FEATURED_STAR_SIZE = 26;
const GOAL_CHECK_FILL_SIZE = Math.ceil(Math.hypot(TASK_KEY_WIDTH, TASK_KEY_HEIGHT));
/** A beat after the tick lands, so the finished card is seen before it is filed. */
const GOAL_HOLD_MS = GOAL_COMPLETION_MOTION_MS + 200;
const JOURNEY_ROW_GAP = 12;
const ADD_ROW_OFFSET = TODAY_JOURNEY_GROUP_GAP - JOURNEY_ROW_GAP;
/** The height of the room card's own button, whose slot this takes. */
const START_NEXT_MIN_HEIGHT = 56;
const ALL_DONE_RESIZE = LinearTransition.duration(GOAL_FILING_MS).easing(easing.enter);
// A load shorter than this never shows the skeleton: shown for a few frames and
// swapped straight out, it read as the list flashing.
const SKELETON_REVEAL = FadeIn.delay(200).duration(duration.fast);

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
  /** A tick paid out; `from` is where the finger was, in window coordinates. */
  onCoinsEarned?: (earned: { coins: number; from?: ScreenPoint }) => void;
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

interface ScreenPoint {
  x: number;
  y: number;
}

/** A VoiceOver activation has no finger, so it reports no usable point. */
function tapPoint(event: GestureResponderEvent): ScreenPoint | undefined {
  const { pageX, pageY } = event.nativeEvent;
  if (!Number.isFinite(pageX) || !Number.isFinite(pageY) || (pageX === 0 && pageY === 0)) {
    return undefined;
  }
  return { x: pageX, y: pageY };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Please try again.';
}

interface GoalCardProps {
  goal: SelfCareGoal;
  /** finished, and fading out ahead of being filed into the drawer */
  filing?: boolean;
  /** joining a list already on screen, so it fades in once its slot opens */
  arriving?: boolean;
  readOnly?: boolean;
  /** whether a to-do is being dragged, so a release on this one is not a tap */
  isArranging: () => boolean;
  onToggle: (goal: SelfCareGoal, from?: ScreenPoint) => boolean;
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
  filing = false,
  arriving = false,
  readOnly = false,
  isArranging,
  onToggle,
  onOpen,
  onMove,
}: GoalCardProps) {
  const motion = useGoalCompletionMotion(goal.completedToday, filing, arriving);
  const coins = selfCareGoalCoins(goal.recurrence);
  const checkboxLabel = `${goal.title}, worth ${coins} coins, ${goal.completedToday ? 'completed' : 'not completed'}`;
  const content = (
    <TaskCardBody
      icon={<RoutineTaskIcon name={goal.icon} done={goal.completedToday} />}
      coins={coins}
      badge={
        goal.featuredToday ? (
          <Icon
            bold
            name="star"
            size={FEATURED_STAR_SIZE}
            color={colors.reward.gold}
          />
        ) : null
      }
    >
      {goal.featuredToday ? (
        <Text style={[taskCard.overline, styles.goalFeaturedLabel]}>Task of the day</Text>
      ) : null}
      <StruckTitle
        title={goal.title}
        numberOfLines={TASK_TITLE_MAX_LINES}
        progress={motion.strike}
        inked={goal.completedToday || motion.sparked}
        style={taskCard.title}
      />
      <Text style={taskCard.detail}>
        {selfCareGoalRecurrenceLabel(goal.recurrence)}
        {goal.scheduledTime == null
          ? ''
          : ` · ${selfCareGoalDaypartLabel(goal.scheduledTime)}`}
      </Text>
    </TaskCardBody>
  );

  if (readOnly) {
    return (
      <View
        accessible
        accessibilityLabel={checkboxLabel}
        style={[taskCard.surface, styles.goalCard, taskCard.face, styles.goalButton]}
      >
        {content}
      </View>
    );
  }

  return (
    // Untouchable while anything on it is moving, or while it is on its way
    // into the drawer: a tap mid-motion reversed it halfway through.
    <Animated.View
      pointerEvents={filing || motion.locked ? 'none' : 'auto'}
      style={[taskCard.surface, styles.goalCard, motion.cardStyle]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.goalFlash, motion.flashStyle]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={goal.title}
        disabled={filing || motion.locked}
        accessibilityState={{ disabled: filing || motion.locked }}
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
        style={({ pressed }) => [taskCard.face, styles.goalButton, pressed && pressable.subtle]}
      >
        {content}
      </Pressable>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: goal.completedToday, disabled: filing || motion.locked }}
        accessibilityLabel={checkboxLabel}
        disabled={filing || motion.locked}
        onPressIn={motion.prime}
        onPress={(event) => {
          if (isArranging()) return;
          const next = !goal.completedToday;
          if (!onToggle(goal, tapPoint(event))) return;
          if (next) triggerSuccessHaptic();
          else triggerTapHaptic();
          motion.play(next);
        }}
        hitSlop={6}
        style={({ pressed }) => pressed && pressable.control}
      >
        {motion.sparked ? (
          <CheckBurst
            width={TASK_KEY_WIDTH}
            height={TASK_KEY_HEIGHT}
            progress={motion.burst}
          />
        ) : null}
        <Animated.View style={[styles.goalCheck, motion.checkStyle]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.goalCheckFill, motion.checkFillStyle]}
          />
          <Animated.View style={motion.checkMarkStyle}>
            <Animated.View style={motion.checkMarkTodoStyle}>
              <Icon bold name="check" size={CHECK_MARK_SIZE} color={colors.playful.sky.base} />
            </Animated.View>
            <Animated.View
              style={[styles.goalCheckMarkWindow, motion.checkMarkWindowStyle]}
            >
              <Animated.View style={motion.checkMarkDoneStyle}>
                <Icon bold name="check" size={CHECK_MARK_SIZE} color={colors.success[700]} />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

interface GoalRowProps extends Omit<GoalCardProps, 'isArranging'> {
  controller: JourneyReorderController;
  index: number;
  scrollRef?: JourneyScrollRef;
}

/**
 * A to-do card in its draggable slot, memoised as one piece.
 *
 * A gesture detector pushes its config to the native module on every render it
 * gets, whether or not the gesture changed. A tick renders the list several
 * times while the celebration is starting, so an unmemoised row cost one native
 * call per habit per render on the frames the confetti and coins were flying.
 */
const GoalRow = memo(function GoalRow({
  controller,
  index,
  scrollRef,
  ...card
}: GoalRowProps) {
  return (
    <JourneyDragRow
      controller={controller}
      id={card.goal.id}
      index={index}
      scrollRef={scrollRef}
      style={GOAL_ROW_STYLE}
    >
      <GoalCard {...card} isArranging={controller.isArranging} />
    </JourneyDragRow>
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
        <Icon bold name="plus" size={20} color={colors.text.secondary} />
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
        bold
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
          <Icon bold name="plus" size={16} color={colors.text.brand} />
          <Text style={styles.dayDoneAddHabitLabel}>Add a new habit</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

function EmptyDayState() {
  return (
    <Animated.View entering={FadeIn.duration(duration.slow)}
      style={[styles.dayDone, styles.dayDoneFill]}
    >
      <Icon name="calendar" size={EMPTY_DAY_ICON_SIZE} color={colors.text.tertiary} />
      <Text style={styles.emptyDayText}>No to-dos on this day.</Text>
    </Animated.View>
  );
}

/**
 * Memoised: the screens around it re-render for their own reasons — the coin
 * balance moves on every tick — and the list should only render for its own.
 */
export default memo(TodoListSection);

function TodoListSection(props: TodoListSectionProps) {
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
  const reducedMotion = useReducedMotion();
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
  const togglesInFlight = useRef(new Set<string>());
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
  /**
   * A finished to-do un-ticked from its sheet, applied once the sheet is gone.
   * Applied at once, its return to the list played out underneath the sheet
   * sliding away; held, the slot opening and the card fading into it are
   * actually seen.
   */
  const pendingUntick = useRef<SelfCareGoal | null>(null);
  const settlingGoals = useSettlingGoals({
    holdMs: GOAL_HOLD_MS,
    // As long as the rows take to close up over the cards being filed, so the
    // cards unmount once nothing is still moving.
    leaveMs: Math.max(GOAL_FILING_MS, TODAY_JOURNEY_RAIL_TIMING.duration),
  });
  const [goalPlaces, setGoalPlaces] = useState<SelfCareGoalPlaces>(selfCareGoalPlacesNow);
  // The list waits for the stored order before it is drawn. Drawn first in the
  // default order, every row the person had moved slid across to its place a
  // moment later, on the first thing they saw. The read is a local one, done
  // long before the to-dos come back from the network.
  const [placesReady, setPlacesReady] = useState(selfCareGoalPlacesLoaded);
  const goals = tasksOnly ? goalsQuery.data ?? EMPTY_GOALS : EMPTY_GOALS;
  useEffect(() => {
    if (!tasksOnly || userId == null) return;
    let active = true;
    void loadSelfCareGoalPlaces().then((storedPlaces) => {
      if (!active) return;
      setGoalPlaces(storedPlaces);
      setPlacesReady(true);
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
  // Once the drawer has formed today it stays for the rest of it. Under the
  // threshold alone, un-ticking the ninth habit dissolved the drawer and poured
  // every finished habit back onto the rail at once.
  const [drawerKeptOn, setDrawerKeptOn] = useState<string | null>(null);
  // Memoised on their inputs: the list renders several times per tick, and
  // each of these is a sort of every goal.
  const currentPlan = useMemo(
    () => planSelfCareGoalList(goals, goalPlaces, settlingGoals.settling),
    [goals, goalPlaces, settlingGoals.settling],
  );
  const drawerCrossed = currentPlan.drawer.length > 0;
  const keepDrawer = drawerCrossed || drawerKeptOn === localDate;
  useEffect(() => {
    if (drawerCrossed) setDrawerKeptOn(localDate);
  }, [drawerCrossed, localDate]);
  const plan = useMemo(
    () =>
      keepDrawer && !drawerCrossed
        ? planSelfCareGoalList(goals, goalPlaces, settlingGoals.settling, true)
        : currentPlan,
    [goals, goalPlaces, settlingGoals.settling, keepDrawer, drawerCrossed, currentPlan],
  );
  const railGoals = plan.rail;
  const drawerGoals = plan.drawer;
  const shownGoals = readOnly ? goals : railGoals;
  // Keyed on the ids, not rebuilt each render: the reorder controller and every
  // row's gesture and animated style are rebuilt whenever this changes
  // identity, and a tick renders this list several times as it settles.
  const taskKey = shownGoals.map((goal) => goal.id).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const taskIds = useMemo(() => shownGoals.map((goal) => goal.id), [taskKey]);
  const allGoalsCompleted =
    tasksOnly &&
    !readOnly &&
    goalsQuery.isSuccess &&
    goals.length > 0 &&
    goals.every((goal) => goal.completedToday);
  const showAllDone = allGoalsCompleted && settlingGoals.settling.size === 0;
  const previouslyAllDone = useRef(showAllDone);
  const changingAllDone = showAllDone || previouslyAllDone.current;
  useEffect(() => {
    previouslyAllDone.current = showAllDone;
  }, [showAllDone]);
  // The cards that leave the rail once the goals still holding let go: those
  // bound for the drawer, or every card when the day is about to be replaced by
  // the all-done state. Cards bound for the drawer give up their slots as they
  // fade, so the list closes up in the same motion; cards making way for the
  // all-done state fade where they stand, since nothing replaces them on the rail.
  const clearingForAllDone =
    allGoalsCompleted &&
    settlingGoals.settling.size > 0 &&
    settlingGoals.holding.size === 0;
  const filingIds = useMemo(
    () =>
      settlingGoals.settling.size === settlingGoals.holding.size
        ? EMPTY_IDS
        : clearingForAllDone
          ? new Set(taskIds)
          : new Set(
              planSelfCareGoalList(goals, goalPlaces, settlingGoals.holding, keepDrawer)
                .drawer.map((goal) => goal.id),
            ),
    [
      settlingGoals.settling,
      settlingGoals.holding,
      clearingForAllDone,
      taskIds,
      goals,
      goalPlaces,
      keepDrawer,
    ],
  );

  const toggleCompleted = (goal: SelfCareGoal, from?: ScreenPoint) => {
    // The one guard against a second write while the first is in flight, kept
    // synchronously so two activations cannot award or celebrate twice.
    if (readOnly || togglesInFlight.current.has(goal.id)) return false;
    togglesInFlight.current.add(goal.id);
    const completed = !goal.completedToday;
    const isFirstWinToday =
      tasksOnly &&
      !readOnly &&
      completed &&
      localDate === todayLocalDate &&
      firstWin.claim();
    const write = toggleGoal.toggle({ goalId: goal.id, completed });
    // The mutation owns rollback and the inline error message.
    write.catch(() => {
      if (isFirstWinToday) firstWin.release();
    }).finally(() => togglesInFlight.current.delete(goal.id));
    // Feedback belongs to this user action, never to a cache refresh or a
    // completion made elsewhere while this screen is mounted.
    if (!tasksOnly) return true;
    if (!completed) {
      settlingGoals.release(goal.id);
      return true;
    }
    settlingGoals.hold(goal.id);
    props.onCoinsEarned?.({ coins: selfCareGoalCoins(goal.recurrence), from });
    const completion = { goalId: goal.id, goalTitle: goal.title, isFirstWinToday };
    // A tick is one boolean that almost never fails, so its cheer goes off with
    // the tap rather than a network round trip later; a failure rolls the card
    // back and says so. The first win of the day is a milestone instead: it
    // waits for the write to land, so it never celebrates one that didn't, and
    // for the tick to finish, so its modal never covers the card mid-motion.
    if (!isFirstWinToday) {
      props.onCompleted(completion);
      return true;
    }
    void Promise.all([write, goalCompletionMotionSettled()]).then(
      () => {
        if (focused.current) props.onCompleted(completion);
      },
      () => {},
    );
    return true;
  };

  // One identity for the life of the list, so the memoised cards are not
  // re-rendered by a handler that is new each render; it calls the latest.
  const toggleCompletedRef = useRef(toggleCompleted);
  toggleCompletedRef.current = toggleCompleted;
  const flushUntick = useCallback(() => {
    const untick = pendingUntick.current;
    pendingUntick.current = null;
    if (untick != null) toggleCompletedRef.current(untick);
  }, []);
  // The sheet only reports itself gone when its exit finishes. Reopened before
  // then, or the list unmounted, the un-tick still lands rather than waiting.
  useEffect(() => {
    if (detailGoalId != null) flushUntick();
  }, [detailGoalId, flushUntick]);
  useEffect(() => flushUntick, [flushUntick]);
  const toggleGoalCompleted = useCallback(
    (goal: SelfCareGoal, from?: ScreenPoint) => toggleCompletedRef.current(goal, from),
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
  // Whether the list has already been on screen. The drawer fades in when
  // habits are filed into it, but on the page's first draw it is simply there:
  // an entrance on load reads as the page still arriving.
  const listShown = useRef(false);
  const listReady = tasksOnly && goalsQuery.data != null && placesReady;
  useEffect(() => {
    if (listReady) listShown.current = true;
  }, [listReady]);
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
    collapsed: clearingForAllDone ? EMPTY_IDS : filingIds,
    // A to-do added to a list already on screen makes room for itself in the
    // frame it appears — including the first one added to a day that opened
    // all done, whose list has never been laid out.
    estimatedHeight: tasksOnly && listShown.current ? GOAL_ROW_HEIGHT : undefined,
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

  // What stands under the to-do rows — the add row, the drawer — follows them
  // down and up on their own curve, and only by transform.
  //
  // Reanimated applies a transform or an opacity on every frame, but skips a
  // frame's layout change whenever React is committing, and the list re-renders
  // exactly as it resizes. Placed by an animated height, the add row and the
  // drawer stalled and caught up while the cards slid on smoothly beside them.
  // So they stand out of flow at the top of the list and are moved down to
  // where the rows end; the list's laid-out height only sets how far the page
  // scrolls, where a skipped frame is never seen. It grows at once, so the
  // page never scrolls short of what is drawn, and shrinks in one step once
  // the rows have closed up: shrunk with them, it was a layout pass of the
  // whole page on every frame of the slide, which is what made it stutter.
  //
  // Unplaced until the rows are first positioned, a frame after the list first
  // lays out, and hidden until then rather than drawn over the rows.
  const contentHeight = controller.contentHeight;
  // The list is drawn once in flow to be measured, then stood up by transform
  // where it was measured — every row remounted — and only then are the add
  // row and the drawer placed under it. Shown through that, the rows jittered
  // through the remount and the rest arrived a frame or two behind them. So it
  // stays hidden until it is in place, and then fades in as one piece.
  const listPlaced = contentHeight != null || taskIds.length === 0;
  const listOpacity = useSharedValue(0);
  useEffect(() => {
    if (!listPlaced) {
      listOpacity.value = 0;
      return;
    }
    listOpacity.value = reducedMotion
      ? 1
      : withTiming(1, { duration: duration.base, easing: easing.enter });
  }, [listPlaced, listOpacity, reducedMotion]);
  // Read from the render too, so a list remounting unplaced is hidden from its
  // first frame rather than from the frame after the effect above.
  const revealStyle = useAnimatedStyle(
    () => ({ opacity: listPlaced ? listOpacity.value : 0 }),
    [listPlaced],
  );
  const rowsEnd =
    tasksOnly && !readOnly && goalsQuery.data != null && placesReady && !showAllDone
      ? taskIds.length === 0
        ? 0
        : contentHeight == null
          ? null
          : contentHeight + JOURNEY_ROW_GAP
      : null;
  /** where the rows are drawn to end; -1 while unplaced */
  const rowsDrawnEnd = useSharedValue(-1);
  /** where the page's scroll extent puts the rows' end; -1 while unplaced */
  const rowsExtentEnd = useSharedValue(-1);
  const addRowHeight = useSharedValue(ADD_ROW_OFFSET + ADD_ROW_HEIGHT);
  const drawerHeight = useSharedValue(0);
  // Tracked here rather than read back off the shared value, which would
  // block the JS thread on the UI thread in the middle of a tick.
  const rowsPlaced = useRef(false);
  const extentEnd = useRef(-1);
  useEffect(() => {
    if (rowsEnd == null) {
      rowsPlaced.current = false;
      extentEnd.current = -1;
      rowsExtentEnd.value = -1;
      rowsDrawnEnd.value = -1;
      return;
    }
    const animate = rowsPlaced.current && !reducedMotion;
    rowsDrawnEnd.value = animate
      ? withTiming(rowsEnd, TODAY_JOURNEY_RAIL_TIMING)
      : rowsEnd;
    rowsExtentEnd.value = animate && rowsEnd < extentEnd.current
      ? withDelay(
          TODAY_JOURNEY_RAIL_TIMING.duration,
          withTiming(rowsEnd, { duration: 0 }),
        )
      : rowsEnd;
    extentEnd.current = rowsEnd;
    rowsPlaced.current = true;
  }, [rowsEnd, rowsDrawnEnd, rowsExtentEnd, reducedMotion]);
  const measureAddRow = useCallback((event: LayoutChangeEvent) => {
    addRowHeight.value = event.nativeEvent.layout.height;
  }, [addRowHeight]);
  const measureDrawer = useCallback((event: LayoutChangeEvent) => {
    drawerHeight.value = event.nativeEvent.layout.height;
  }, [drawerHeight]);
  const listExtentStyle = useAnimatedStyle(() => {
    if (rowsExtentEnd.value < 0) return {};
    const drawer = drawerHeight.value > 0 ? spacing.md + drawerHeight.value : 0;
    return { height: rowsExtentEnd.value + addRowHeight.value + drawer };
  });

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

  // The rail as it was last drawn, so a card can tell it has just joined it —
  // un-ticked out of the drawer, or newly added.
  const railIdsBefore = useRef<ReadonlySet<string> | null>(null);
  useEffect(() => {
    railIdsBefore.current = new Set(taskIds);
  }, [taskIds]);

  // When the all-done state is about to take the list's place, the drawer and
  // the add row fade out with the cards: same length, same curve as a card's
  // leave, so the whole list goes as one.
  const clearFade = useSharedValue(0);
  const clearFadeTarget = useRef(0);
  useEffect(() => {
    const target = clearingForAllDone ? 1 : 0;
    if (clearFadeTarget.current === target) return;
    clearFadeTarget.current = target;
    clearFade.value = reducedMotion ? target : withTiming(target, {
      duration: GOAL_FILING_MS,
      easing: easing.enter,
    });
  }, [clearingForAllDone, clearFade, reducedMotion]);
  useEffect(() => () => {
    [rowsDrawnEnd, rowsExtentEnd, clearFade, listOpacity].forEach(cancelAnimation);
  }, [rowsDrawnEnd, rowsExtentEnd, clearFade, listOpacity]);
  const addRowPlaceStyle = useAnimatedStyle(() =>
    rowsDrawnEnd.value < 0
      ? { opacity: 0 }
      : {
          opacity: 1 - clearFade.value,
          transform: [{ translateY: rowsDrawnEnd.value }],
        },
  );
  const drawerPlaceStyle = useAnimatedStyle(() =>
    rowsDrawnEnd.value < 0
      ? { opacity: 0 }
      : {
          opacity: 1 - clearFade.value,
          transform: [
            { translateY: rowsDrawnEnd.value + addRowHeight.value + spacing.md },
          ],
        },
  );

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
    ? (goalsQuery.data == null && !goalsQuery.isError) ||
      (goalsQuery.data != null && !placesReady)
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
    <Animated.View
      // Only the terminal swap uses a layout transition. Ordinary list
      // resizing already has one owner: rowsDrawnEnd on the UI thread.
      layout={changingAllDone && !reducedMotion ? ALL_DONE_RESIZE : undefined}
      style={styles.section}
      {...(props.mode === 'tasks' && props.tourAddHabitTarget ? routineOverviewTarget : {})}
    >
      {initialLoading || initialLoadError || startNextPress == null || nextRow == null ? null : (
        <View {...startNext?.target}>
          <ChunkyButton
            label="Start my plan"
            labelSize="xlarge"
            icon={<Icon bold name="play-triangle" size={22} color={colors.text.inverse} />}
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
                <Icon bold name="plus" size={20} color={colors.text.secondary} />
              </GlassIconButton>
            </View>
          ) : planPosition == null ? null : (
            <NextDayCountdown label="Refreshes in" style={styles.planWeek} />
          )
        }
      />
      {initialLoading ? (
        <Animated.View
          entering={reducedMotion ? undefined : SKELETON_REVEAL}
          accessibilityLabel={tasksOnly ? "Loading your to-dos" : "Loading your plan"}
          style={styles.loadingRows}
        >
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} height={GOAL_ROW_HEIGHT} radius={radius.medium} />
          ))}
        </Animated.View>
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
        <Animated.View
          style={[styles.journey, revealStyle, !readOnly && listExtentStyle]}
        >
          {taskIds.length > 0 ? (
            <View
              style={[
                styles.journeyRows,
                { height: contentHeight ?? undefined },
              ]}
            >
              {shownGoals.map((goal, index) => (
                <GoalRow
                  key={goal.id}
                  controller={controller}
                  index={index}
                  scrollRef={props.scrollRef}
                  goal={goal}
                  filing={filingIds.has(goal.id)}
                  arriving={
                    listShown.current &&
                    railIdsBefore.current != null &&
                    !railIdsBefore.current.has(goal.id)
                  }
                  readOnly={readOnly}
                  onToggle={toggleGoalCompleted}
                  onOpen={setDetailGoalId}
                  onMove={moveBy}
                />
              ))}
            </View>
          ) : readOnly ? (
            <EmptyDayState />
          ) : null}
          {readOnly ? null : (
            <>
              <Animated.View
                style={[styles.belowRows, addRowPlaceStyle]}
                onLayout={measureAddRow}
              >
                {addNodeVisible ? <AddGoalRow onPress={() => setAdding(true)} /> : null}
              </Animated.View>
              <Animated.View
                style={[styles.belowRows, drawerPlaceStyle]}
                onLayout={measureDrawer}
              >
                {drawerGoals.length === 0 ? null : (
                  <CompletedGoalsDrawer
                    goals={drawerGoals}
                    onOpenGoal={setDetailGoalId}
                    animateEntrance={listShown.current}
                  />
                )}
              </Animated.View>
            </>
          )}
        </Animated.View>
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

      {tasksOnly && !readOnly ? <>
      <GoalDetailSheet
        goal={detailGoal}
        busy={archiveGoal.isPending}
        onClose={() => setDetailGoalId(null)}
        onToggleComplete={() => {
          if (detailGoal == null) return;
          if (detailGoal.completedToday) {
            pendingUntick.current = detailGoal;
          } else {
            toggleCompleted(detailGoal);
          }
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
          flushUntick();
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
    </Animated.View>
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
  // Out of flow at the top of the list, moved down to where the rows end.
  belowRows: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  journeyRow: {
    minHeight: GOAL_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  // Never a touch target itself, only the card inside it is. While the card is
  // locked — moving, or on its way into the drawer — a press finds nothing
  // here, so the long press that picks a row up to drag it cannot start either.
  goalRow: {
    pointerEvents: 'box-none',
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
  emptyDayText: {
    ...typography.body.small,
    color: colors.text.secondary,
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  goalButton: {
    flex: 1,
  },
  goalFeaturedLabel: {
    color: colors.reward.gold,
  },
  goalFlash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.medium,
    backgroundColor: colors.success[100],
  },
  goalCheck: {
    ...card.taskKey,
    overflow: 'hidden',
  },
  // A window over the done mark that slides open left to right, so the mark is
  // uncovered the way it would be drawn. Moved by transform, never resized, so
  // the draw costs no layout.
  goalCheckMarkWindow: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CHECK_MARK_SIZE,
    height: CHECK_MARK_SIZE,
    overflow: 'hidden',
  },
  // The key keeps its lip when it fills in — still a key, just a green one.
  // The green is `goalCheckFill`, blooming out from the middle as it's ticked,
  // and the border colour follows it in `useGoalCompletionMotion`.
  // Wide enough to reach the corners of the key once it has fully grown.
  goalCheckFill: {
    position: 'absolute',
    width: GOAL_CHECK_FILL_SIZE,
    height: GOAL_CHECK_FILL_SIZE,
    borderRadius: GOAL_CHECK_FILL_SIZE / 2,
    backgroundColor: colors.success[100],
  },
  errorText: {
    ...typography.body.xsmall,
    color: colors.error[700],
  },
});

/** One array for every row, so the memoised rows are not handed a new style each render. */
const GOAL_ROW_STYLE = [styles.journeyRow, styles.goalRow];
