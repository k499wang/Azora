import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  type LayoutChangeEvent,
  type ScrollView,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Animated, {
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useScrollOffset,
  withTiming,
  type AnimatedRef,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import SectionHeader from '../../components/common/SectionHeader';
import { ARCHETYPE_FOR_PLAN } from '../../lib/onboardingArchetype';
import GlassIconButton from '../../components/common/GlassIconButton';
import ChunkyButton, { CHUNKY_TONE_QUIET } from '../../components/common/ChunkyButton';
import { useCompletionSound } from '../../hooks/useCompletionSound';
import { holdMotionQuiet } from '../../lib/ui/motionQuiet';
import { usePlanPosition } from '../../hooks/usePlanPosition';
import NextDayCountdown from '../room/NextDayCountdown';
import Skeleton from '../../components/common/Skeleton';
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
import { useSettlingGoals } from './useSettlingGoals';
import {
  GOAL_COMPLETION_MOTION_MS,
  GOAL_FILING_MS,
  goalCompletionMotionSettled,
  useGoalCompletionMotion,
} from './useGoalCompletionMotion';
import { useFirstWinOfDay } from './useFirstWinOfDay';
import { useFirstWinOfDayStore } from './firstWinOfDayStore';
import { useTodayLocalDate } from '../../hooks/useTodayLocalDate';
import { useSelfCareGoalsQuery } from '../../queries/selfCare/useSelfCareGoalsQuery';
import { useCreateSelfCareGoalMutation } from '../../queries/selfCare/useCreateSelfCareGoalMutation';
import { useToggleSelfCareGoalMutation } from '../../queries/selfCare/useToggleSelfCareGoalMutation';
import { useArchiveSelfCareGoalMutation } from '../../queries/selfCare/useArchiveSelfCareGoalMutation';
import { useSetSelfCareGoalFeaturedMutation } from '../../queries/selfCare/useSetSelfCareGoalFeaturedMutation';
import { useUpdateSelfCareGoalMutation } from '../../queries/selfCare/useUpdateSelfCareGoalMutation';
import {
  currentSelfCareGoalDaypart,
  selfCareGoalCoins,
  selfCareGoalRecurrenceLabel,
  planSelfCareGoalList,
  leavingSelfCareGoalIds,
  reorderedSelfCareGoalPlaces,
  type SelfCareGoal,
  type SelfCareGoalPlaces,
} from './domain/selfCareGoal';
import {
  todoListGoalOrder,
  todoListRows,
  type TodoListRow,
} from './domain/todoListSections';
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
import { duration, easing } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import {
  triggerMediumHaptic,
  triggerTodoCompleteHaptic,
  triggerTapHaptic,
} from '../../native/tapHaptics';
import { BurstStar } from '../../components/common/RewardSparkles';
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
import type { RootStackNavigationProp } from '../../app/navigation';
import { useFeatureAccess } from '../../hooks/useFeatureAccess';
import { trackFeatureGateHit } from '../../services/analytics/tracking';
import { PaywallPlacement } from '../../services/paywall';
import { FeatureKey } from '../../services/subscriptions/featureAccess';

const GOAL_ROW_HEIGHT = TODAY_JOURNEY_CARD_MIN_HEIGHT;
// The add action stays compact even though user-authored to-do cards can grow.
const ADD_ROW_HEIGHT = 60;
const ADD_BADGE_SIZE = 38;
const ADD_GOAL_ROW_ID = 'add-goal';
const DAY_DONE_ICON_SIZE = 64;
const DAY_DONE_BURST = Array.from({ length: 8 }, (_, i) => ({
  angle: -90 + i * 45,
  distance: DAY_DONE_ICON_SIZE * (i % 2 === 0 ? 0.95 : 0.7),
  size: i % 2 === 0 ? 16 : 11,
  color: i % 2 === 0 ? colors.reward.gold : colors.primary.blue300,
}));
const EMPTY_DAY_ICON_SIZE = 40;
const DAYPART_START_SIZE = spacing.xl;
const DAYPART_START_ICON_SIZE = 14;
const ROUTINE_PLAYER_MIN_STEPS = 2;
const FEATURED_STAR_SIZE = 12;
const CHECK_MARK_SIZE = 15;
const GOAL_CHECK_SIZE = 24;
/** A beat after the tick lands, so the finished card is seen before it is filed. */
const GOAL_HOLD_MS = GOAL_COMPLETION_MOTION_MS + 200;
/** as long as the rows take to close up over the cards being filed */
const GOAL_LEAVE_MS = Math.max(GOAL_FILING_MS, TODAY_JOURNEY_RAIL_TIMING.duration);
/** from a tick until its card has been filed and the list is still */
const GOAL_SETTLED_MS = GOAL_HOLD_MS + GOAL_LEAVE_MS;
const JOURNEY_ROW_GAP = 12;
const ADD_ROW_OFFSET = TODAY_JOURNEY_GROUP_GAP - JOURNEY_ROW_GAP;
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
  /**
   * The page the list sits on: a held row keeps it from scrolling underneath,
   * and the list only gives back room the page has scrolled out of sight.
   */
  scrollRef?: AnimatedRef<ScrollView>;
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
  /** finished, and fading out ahead of leaving the list */
  filing?: boolean;
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
  readOnly = false,
  isArranging,
  onToggle,
  onOpen,
  onMove,
}: GoalCardProps) {
  const motion = useGoalCompletionMotion(goal.completedToday, filing);
  const coins = selfCareGoalCoins(goal.recurrence);
  const checkboxLabel = `${goal.title}, worth ${coins} coins, ${goal.completedToday ? 'completed' : 'not completed'}`;
  const content = (
    <TaskCardBody
      icon={<RoutineTaskIcon name={goal.icon} done={goal.completedToday} />}
      coins={coins}
    >
      {goal.featuredToday ? (
        <View style={styles.goalFeaturedHeading}>
          <Icon
            bold
            name="star"
            size={FEATURED_STAR_SIZE}
            color={colors.reward.gold}
          />
          <Text style={[taskCard.overline, styles.goalFeaturedLabel]}>TASK OF THE DAY</Text>
        </View>
      ) : null}
      <StruckTitle
        title={goal.title}
        numberOfLines={TASK_TITLE_MAX_LINES}
        progress={motion.strike}
        inked={goal.completedToday || motion.inked}
        style={taskCard.title}
      />
      <Text style={taskCard.detail}>
        {selfCareGoalRecurrenceLabel(goal.recurrence)}
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
    // off the list: a tap mid-motion reversed it halfway through.
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
          if (next) triggerTodoCompleteHaptic();
          else triggerTapHaptic();
          motion.play(next);
        }}
        hitSlop={12}
        style={({ pressed }) => pressed && pressable.control}
      >
        <Animated.View pointerEvents="none" style={[styles.goalCheckRipple, motion.rippleStyle]} />
        <Animated.View style={[styles.goalCheck, motion.checkStyle]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.goalCheckFill, motion.checkDoneStyle]}
          />
          <Animated.View style={motion.markStyle}>
            <Icon bold name="check" size={CHECK_MARK_SIZE} color={colors.neutral[0]} />
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
  celebrate = false,
  fillAvailableSpace = false,
  onAddHabit,
}: {
  /** a tick here cleared the day, rather than the day loading already done */
  celebrate?: boolean;
  fillAvailableSpace?: boolean;
  onAddHabit?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const burst = useSharedValue(0);
  const [celebrates] = useState(celebrate);

  useEffect(() => {
    if (!celebrates) return undefined;
    triggerMediumHaptic();
    if (reducedMotion) return undefined;
    burst.value = withTiming(1, { duration: duration.slower, easing: easing.burst });
    return () => cancelAnimation(burst);
  }, [burst, celebrates, reducedMotion]);

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeIn.duration(duration.fast).easing(easing.enter)}
      style={[styles.dayDone, fillAvailableSpace && styles.dayDoneFill]}
    >
      <View>
        <TaskIllustration
          name="celebration"
          size={DAY_DONE_ICON_SIZE}
        />
        {celebrates && !reducedMotion
          ? DAY_DONE_BURST.map((star, index) => (
              <BurstStar
                key={index}
                angle={star.angle}
                burst={burst}
                color={star.color}
                distance={star.distance}
                size={star.size}
                x={DAY_DONE_ICON_SIZE / 2}
                y={DAY_DONE_ICON_SIZE / 2}
              />
            ))
          : null}
      </View>
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

function DaypartHeader({
  label,
  now,
  leaving,
  onStart,
}: {
  label: string;
  now: boolean;
  leaving: boolean;
  /** plays the part of the day's open to-dos one at a time; left out when there is nothing to play */
  onStart?: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: leaving && !reducedMotion
      ? withTiming(0, { duration: GOAL_FILING_MS, easing: easing.enter })
      : leaving ? 0 : 1,
  }));
  return (
    <Animated.View style={[styles.daypartHeader, fadeStyle]}>
      <View accessibilityRole="header" accessible style={styles.daypartHeader}>
        <Text style={styles.daypartLabel} numberOfLines={1}>{label}</Text>
        {now ? <Text style={styles.daypartNow}>Now</Text> : null}
      </View>
      {onStart == null ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Start ${label}`}
          hitSlop={spacing.sm}
          onPress={() => {
            triggerTapHaptic();
            onStart();
          }}
          style={({ pressed }) => [styles.daypartStart, pressed && pressable.surface]}
        >
          <Icon name="play-triangle" size={DAYPART_START_ICON_SIZE} color={colors.text.brand} />
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
  const pageRef = tasksOnly ? props.scrollRef : undefined;
  const isFocused = useIsFocused();
  const playCompletionSound = useCompletionSound('todo');
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
  const navigation = useNavigation<RootStackNavigationProp>();
  const todoAccess = useFeatureAccess(FeatureKey.RoutineTodos);
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
   * sliding away; held, the slot opening and the card growing into it are
   * actually seen.
   */
  const pendingUntick = useRef<SelfCareGoal | null>(null);
  const settlingGoals = useSettlingGoals({
    holdMs: GOAL_HOLD_MS,
    // As long as the rows take to close up over the cards being filed, so the
    // cards unmount once nothing is still moving.
    leaveMs: GOAL_LEAVE_MS,
  });
  const [goalPlaces, setGoalPlaces] = useState<SelfCareGoalPlaces>(selfCareGoalPlacesNow);
  // The list waits for the stored order before it is drawn. Drawn first in the
  // default order, every row the person had moved slid across to its place a
  // moment later, on the first thing they saw. The read is a local one, done
  // long before the to-dos come back from the network.
  const [placesReady, setPlacesReady] = useState(selfCareGoalPlacesLoaded);
  const goals = tasksOnly ? goalsQuery.data ?? EMPTY_GOALS : EMPTY_GOALS;
  const remainingTaskCount = goals.filter((goal) => !goal.completedToday).length;
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
  // A tick renders several times while settling; sort only when its inputs change.
  const shownGoals = useMemo(
    () => planSelfCareGoalList(goals, goalPlaces, settlingGoals.settling, readOnly),
    [goals, goalPlaces, settlingGoals.settling, readOnly],
  );
  // Keyed on the ids, not rebuilt each render: the reorder controller and every
  // row's gesture and animated style are rebuilt whenever this changes
  // identity, and a tick renders this list several times as it settles.
  const allGoalsCompleted =
    tasksOnly &&
    !readOnly &&
    goalsQuery.isSuccess &&
    goals.length > 0 &&
    goals.every((goal) => goal.completedToday);
  const showAllDone = allGoalsCompleted && settlingGoals.settling.size === 0;
  // The cards that leave the rail once the goals still holding let go: the
  // finished ones, or every card when the day is about to be replaced by the
  // all-done state. Finished cards give up their slots as they fade, so the
  // list closes up in the same motion; cards making way for the all-done state
  // fade where they stand, since nothing replaces them on the rail.
  const clearingForAllDone =
    allGoalsCompleted &&
    settlingGoals.settling.size > 0 &&
    settlingGoals.holding.size === 0;
  const [clearedDayHere, setClearedDayHere] = useState(false);
  useEffect(() => {
    if (clearingForAllDone) setClearedDayHere(true);
    else if (!allGoalsCompleted) setClearedDayHere(false);
  }, [allGoalsCompleted, clearingForAllDone]);
  const filingIds = useMemo(
    () => readOnly ? EMPTY_IDS : leavingSelfCareGoalIds(goals, settlingGoals.settling, settlingGoals.holding),
    [goals, settlingGoals.settling, settlingGoals.holding, readOnly],
  );
  // Cards making way for the all-done state fade where they stand, headers
  // with them, so nothing on the rail moves underneath the fade.
  const listRows = useMemo(
    () => todoListRows(shownGoals, clearingForAllDone ? EMPTY_IDS : filingIds),
    [shownGoals, clearingForAllDone, filingIds],
  );
  const playableSections = useMemo(() => {
    const open = new Map<TodoListRow['section'], string[]>();
    if (!tasksOnly || readOnly || localDate !== todayLocalDate) return open;
    for (const row of listRows) {
      if (row.kind !== 'goal' || row.goal.completedToday) continue;
      const ids = open.get(row.section) ?? [];
      ids.push(row.id);
      open.set(row.section, ids);
    }
    for (const [section, ids] of open) {
      if (ids.length < ROUTINE_PLAYER_MIN_STEPS) open.delete(section);
    }
    return open;
  }, [tasksOnly, readOnly, localDate, todayLocalDate, listRows]);
  const startSection = (section: TodoListRow['section']) => {
    const goalIds = playableSections.get(section);
    if (goalIds != null) navigation.navigate('RoutinePlayer', { goalIds });
  };
  const collapsedIds = useMemo(() => {
    if (!tasksOnly || clearingForAllDone) return EMPTY_IDS;
    const leavingHeaders = listRows.filter((row) => row.kind === 'header' && row.leaving);
    if (leavingHeaders.length === 0) return filingIds;
    return new Set([...filingIds, ...leavingHeaders.map((row) => row.id)]);
  }, [tasksOnly, clearingForAllDone, listRows, filingIds]);
  const rowKey = listRows.map((row) => row.id).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rowIds = useMemo(() => listRows.map((row) => row.id), [rowKey]);
  const taskCount = shownGoals.length;
  const nowSection =
    readOnly || localDate !== todayLocalDate ? null : currentSelfCareGoalDaypart(new Date());
  const previousGoalCount = useRef(goals.length);
  useEffect(() => {
    if (!__DEV__ || !tasksOnly) return;
    const emptied = previousGoalCount.current > 0 && goals.length === 0;
    previousGoalCount.current = goals.length;
    if (emptied || (goals.length > 0 && taskCount === 0 && !allGoalsCompleted)) {
      console.warn('[todo-list] list emptied', {
        goals: goals.length,
        shown: taskCount,
      });
    }
  }, [tasksOnly, goals.length, taskCount, allGoalsCompleted]);

  const toggleCompleted = (goal: SelfCareGoal, from?: ScreenPoint) => {
    // The one guard against a second write while the first is in flight, kept
    // synchronously so two activations cannot award or celebrate twice.
    if (readOnly || togglesInFlight.current.has(goal.id)) return false;
    togglesInFlight.current.add(goal.id);
    const completed = !goal.completedToday;
    if (completed) playCompletionSound();
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
    holdMotionQuiet(GOAL_SETTLED_MS);
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
        // The win still belongs to today after leaving Routine. Home can
        // present it when active, without firing Routine's visual feedback.
        else useFirstWinOfDayStore.getState().show();
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
  const remainingStepCount = journeyReady ? journeyIds.length - doneIds.length : null;
  const doneKey = doneIds.join('|');
  // Keyed on the ids, not the rows: the rail's worklet is rebuilt whenever this
  // changes identity, and the rows are rebuilt by every parent render.
  const doneRows = useMemo(
    () => Object.fromEntries(doneIds.map((id) => [id, true])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doneKey],
  );
  /**
   * The rail is measured rather than computed: a row's height is whatever its
   * title needs, so a rail derived from a row constant drifts off the markers
   * the moment one wraps.
   */
  const [journeyHeight, setJourneyHeight] = useState<number | null>(null);
  const measureJourney = useCallback((event: LayoutChangeEvent) => {
    setJourneyHeight(event.nativeEvent.layout.height);
  }, []);
  const taskLayoutIds = useMemo(
    () => readOnly || !addNodeVisible ? rowIds : [...rowIds, ADD_GOAL_ROW_ID],
    [rowIds, readOnly, addNodeVisible],
  );
  const { controller, moveBy, restoreOrder } = useJourneyReorder({
    ids: tasksOnly ? taskLayoutIds : journeyIds,
    gap: tasksOnly ? spacing.xs : JOURNEY_ROW_GAP,
    enabled: tasksOnly ? !readOnly : true,
    positioned: true,
    estimatedHeight: tasksOnly ? GOAL_ROW_HEIGHT : undefined,
    fixedTailId: tasksOnly && !readOnly ? ADD_GOAL_ROW_ID : undefined,
    collapsed: collapsedIds,
    restingTiming: TODAY_JOURNEY_RAIL_TIMING,
    onReorder: (orderedIds) => {
      if (tasksOnly) {
        const goalOrder = todoListGoalOrder(listRows, orderedIds);
        const nextPlaces = goalOrder == null
          ? null
          : reorderedSelfCareGoalPlaces(shownGoals, goalPlaces, goalOrder);
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

  const contentHeight = controller.contentHeight;
  const targetExtent = tasksOnly ? contentHeight ?? 0 : 0;
  const listExtent = useSharedValue(targetExtent);
  const pageOffset = useScrollOffset(pageRef);
  const listRef = useAnimatedRef<Animated.View>();
  // Shrinking under a scrolled page clamps its offset and jumps the cards.
  // Release spare scroll room only when it is below the viewport, or at top.
  const releaseHiddenExtent = useCallback(() => {
    'worklet';
    const held = listExtent.value - targetExtent;
    if (held <= 0) return;
    if (pageOffset.value > 0) {
      const list = measure(listRef);
      const page = pageRef == null ? null : measure(pageRef);
      if (list == null || page == null) return;
      if (list.pageY + list.height - (page.pageY + page.height) < held) return;
    }
    listExtent.value = targetExtent;
  }, [targetExtent, listExtent, pageOffset, listRef, pageRef]);
  useAnimatedReaction(() => targetExtent, (next) => {
    if (next >= listExtent.value) listExtent.value = next;
    else releaseHiddenExtent();
  }, [targetExtent, releaseHiddenExtent]);
  useAnimatedReaction(() => pageOffset.value, () => releaseHiddenExtent(), [releaseHiddenExtent]);
  const listExtentStyle = useAnimatedStyle(() => ({ height: listExtent.value }));

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

  const addRowFadeStyle = useAnimatedStyle(() => ({
    opacity: clearingForAllDone
      ? reducedMotion ? 0 : withTiming(0, { duration: GOAL_FILING_MS, easing: easing.enter })
      : 1,
  }), [clearingForAllDone, reducedMotion]);

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

  const openSheet = () => {
    if (!todoAccess.allowed && !todoAccess.isLoading) {
      const gate = {
        feature: FeatureKey.RoutineTodos,
        placement: PaywallPlacement.RoutineTodoLimitProGate,
        sourceScreen: tasksOnly ? 'Plan' : 'Home',
        sourceAction: 'add_todo',
      };
      trackFeatureGateHit({ ...gate, access: todoAccess });
      navigation.navigate('ProPaywall', gate);
      return;
    }
    setAdding(true);
  };

  const dismissSheet = () => {
    setAdding(false);
  };

  const save = (draft: SelfCareGoalDraft) => {
    if (createGoal.isPending) return;
    createGoal.mutate(draft, { onSuccess: dismissSheet });
  };

  const closeSheet = () => {
    dismissSheet();
    createGoal.reset();
  };

  return (
    <Animated.View
      style={[styles.section, tasksOnly && styles.tasksSection]}
      {...(props.mode === 'tasks' && props.tourAddHabitTarget ? routineOverviewTarget : {})}
    >
      <SectionHeader
        icon={tasksOnly ? "todo-plan" : "calendar"}
        iconColor={tasksOnly ? colors.neutral[900] : undefined}
        titleNumberOfLines={tasksOnly && !readOnly && remainingTaskCount === 0 ? 2 : 1}
        title={tasksOnly
          ? (readOnly ? "To-dos for this day" : remainingTaskCount === 0
            ? "Congrats!"
            : `${remainingTaskCount} ${remainingTaskCount === 1 ? 'task' : 'tasks'} left for today`)
          : "My Plan"}
        subtitle={
          planPosition == null || planPosition.isFinished ? null : (
            <Text style={styles.planDay}>
              Day {planPosition.day} of {ARCHETYPE_FOR_PLAN[planPosition.planId].planName}
            </Text>
          )
        }
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
          ) : planPosition == null ? null : planPosition.isFinished ? (
            <Text style={styles.planWeek} numberOfLines={1}>
              Plan complete
            </Text>
          ) : planPosition.finishedToday ? (
            <NextDayCountdown label="Next day in" style={styles.planWeek} />
          ) : remainingStepCount == null ? null : (
            <Text
              style={styles.planWeek}
              numberOfLines={1}
            >
              {remainingStepCount === 0
                ? 'All steps done'
                : `Finish ${remainingStepCount} to advance`}
            </Text>
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
            <Skeleton key={index} height={GOAL_ROW_HEIGHT} radius={radius.xl} />
          ))}
        </Animated.View>
      ) : initialLoadError ? (
        <View style={[card.base, styles.statusCard]}>
          <Text style={styles.statusText}>
            {tasksOnly ? "Couldn’t load your to-dos." : "Couldn’t load your plan."}
          </Text>
          <ChunkyButton label="Retry" onPress={retryInitialLoad} tone={CHUNKY_TONE_QUIET} />
        </View>
      ) : null}
      {initialLoading || initialLoadError ? null : showAllDone ? (
        <AllDoneState
          celebrate={clearedDayHere}
          fillAvailableSpace
          onAddHabit={openSheet}
        />
      ) : tasksOnly ? (
        <Animated.View
          ref={listRef}
          style={[styles.journey, styles.tasksJourney, taskLayoutIds.length > 0 && listExtentStyle]}
        >
          {listRows.map((row: TodoListRow, index) => row.kind === 'header' ? (
            <JourneyDragRow
              key={row.id}
              controller={controller}
              id={row.id}
              index={index}
              scrollRef={props.scrollRef}
              style={[styles.daypartRow, index > 0 && styles.daypartSectionSpacing]}
              dragDisabled
            >
              <DaypartHeader
                label={row.label}
                now={row.section === nowSection}
                leaving={row.leaving}
                onStart={playableSections.has(row.section) ? () => startSection(row.section) : undefined}
              />
            </JourneyDragRow>
          ) : (
            <GoalRow
              key={row.id}
              controller={controller}
              index={index}
              scrollRef={props.scrollRef}
              goal={row.goal}
              filing={filingIds.has(row.id)}
              readOnly={readOnly}
              onToggle={toggleGoalCompleted}
              onOpen={setDetailGoalId}
              onMove={moveBy}
            />
          ))}
          {readOnly && taskCount === 0 ? <EmptyDayState /> : null}
          {readOnly || !addNodeVisible ? null : (
            <JourneyDragRow
              controller={controller}
              id={ADD_GOAL_ROW_ID}
              index={rowIds.length}
              scrollRef={props.scrollRef}
            >
              <Animated.View style={addRowFadeStyle}>
                <AddGoalRow onPress={openSheet} />
              </Animated.View>
            </JourneyDragRow>
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
        onStartTimer={
          detailGoal == null || detailGoal.completedToday || readOnly || localDate !== todayLocalDate
            ? undefined
            : () => {
                const goalId = detailGoal.id;
                setDetailGoalId(null);
                navigation.navigate('RoutinePlayer', { goalIds: [goalId] });
              }
        }
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
  tasksSection: {
    gap: JOURNEY_ROW_GAP,
  },
  tasksJourney: {
    gap: spacing.xs,
  },
  planDay: {
    ...typography.label.detail,
    color: colors.text.secondary,
  },
  planWeek: {
    ...typography.label.detail,
    color: colors.text.tertiary,
    flexShrink: 1,
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
  // Never a touch target itself, only the card inside it is. While the card is
  // locked — moving, or on its way off the list — a press finds nothing
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
  dayDone: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  dayDoneFill: {
    minHeight: 280,
    justifyContent: 'center',
  },
  daypartRow: {
    pointerEvents: 'box-none',
    flexDirection: 'row',
    paddingBottom: JOURNEY_ROW_GAP - spacing.xs,
  },
  daypartSectionSpacing: {
    paddingTop: JOURNEY_ROW_GAP - spacing.xs,
  },
  daypartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  daypartLabel: {
    ...typography.label.detail,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  daypartStart: {
    width: DAYPART_START_SIZE,
    height: DAYPART_START_SIZE,
    borderRadius: DAYPART_START_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 'auto',
    backgroundColor: colors.primary.blue100,
  },
  daypartNow: {
    ...typography.label.detail,
    fontFamily: fonts.semibold,
    color: colors.text.brand,
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
  goalCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  goalButton: {
    flex: 1,
  },
  goalFeaturedHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalFeaturedLabel: {
    color: colors.reward.gold,
  },
  goalFlash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    backgroundColor: colors.success[100],
  },
  // An empty ring that fills green with a white tick; the ring's colour
  // follows the fill in `useGoalCompletionMotion`.
  goalCheck: {
    width: GOAL_CHECK_SIZE,
    height: GOAL_CHECK_SIZE,
    borderRadius: GOAL_CHECK_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  goalCheckFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.success[500],
  },
  goalCheckRipple: {
    position: 'absolute',
    width: GOAL_CHECK_SIZE,
    height: GOAL_CHECK_SIZE,
    borderRadius: GOAL_CHECK_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.success[300],
  },
  errorText: {
    ...typography.body.xsmall,
    color: colors.error[700],
  },
});

/** One array for every row, so the memoised rows are not handed a new style each render. */
const GOAL_ROW_STYLE = [styles.journeyRow, styles.goalRow];
