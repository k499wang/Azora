import { useWhileVisible } from '../../hooks/useWhileVisible';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import type { IconName } from '../../components/common/icons/paths';
import LipToken, { CoinIcon, type LipTone as Tone, type MeasureNode } from './LipToken';
import { dayCoinIcon } from './pathCoinIcon';
import PathDayCard, { type PathDayCardContent } from './PathDayCard';
import { weekHue } from './weekHue';
import { measureWithinDeadline, sampleUntilStable } from '../tour/tourSampling';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { useCompletionSound } from '../../hooks/useCompletionSound';
import {
  type PlanCalendar as Calendar,
  type PlanCalendarDay,
  type PlanCalendarWeek,
} from './domain/planCalendar';
import {
  isPlanWeekLocked,
  pathDayDetail,
  pathRoomDetail,
  type PathDayExercise,
  type PathDayCompletion,
} from './domain/planPath';
import {
  trailDots,
  trailStretches,
  type TrailNode,
  type TrailStretch,
} from './domain/pathTrail';
import { planLessonTitle } from './domain/planLessonTitle';
import {
  ROOM_NODE, PATH_STEP, COIN_ASPECT, COIN_DEPTH,
  RING_WIDTH, RING_REACH, HERE_ROOM, PATH_PADDING, ROOM_MARGIN,
  pathDaySize, pathWeekTrailNodes,
} from './domain/pathLayout';
import { pathNodeOffset } from './domain/planPath';
import {
  PROGRAM_ACTIVITIES,
  programDayDefinition,
  programPresetRevision,
  type ProgramPresetRevision,
} from '../program/domain/programCatalogue';
import {
  programDayLesson,
  type ProgramEnrollmentV3,
} from '../program/domain/programEnrollment';
import { programDayAsksForTodo } from '../program/domain/programTodoStep';
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing, spring } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const HOP_HEIGHT = spacing.sm;
const HOP_REST_MS = 2600;
const GLOW_SCALE = 1.08;
const GLOW_DIM = 0.55;
const GLOW_PULSE_MS = 900;
const HERE_TAIL = spacing.sm;
const HERE_COLOR = colors.playful.sky.base;
const HERE_GAP = spacing.xs;
const HERE_BOB = spacing.sm;
const HERE_BOB_MS = 700;
const CAPTION_GAP = RING_REACH + spacing.sm;
const CAPTION_MAX_WIDTH = spacing['7xl'] + spacing['3xl'];
const NODE_ICON = 36;
const ROOM_ICON = 48;
const DIVIDER_LOCK_ICON = 16;
const DIVIDER_LINE = spacing.xs / 2;
/** About the tallest day card: a two-line title, three exercises and a start button. */
const CARD_ROOM = 470;
const REVEAL_SETTLE_MS = 700;
const REVEAL_POLL_MS = 80;
const REVEAL_GRACE_MS = 120;
const TRAIL_DOT = spacing.sm;
const TRAIL_PITCH = spacing.md;

const DAY_STATE_LABEL: Record<PlanCalendarDay['state'], string> = {
  done: 'done',
  doneToday: 'done today',
  today: 'today',
  ahead: 'to come',
};
type NodeCard = Omit<PathDayCardContent, 'anchor'> & { day?: number };

const GREY: Tone = {
  face: colors.neutral[200],
  lip: colors.neutral[300],
  icon: colors.neutral[400],
};

const GOLD: Tone = {
  face: colors.reward.gold,
  lip: colors.reward.goldLip,
  icon: colors.text.inverse,
  sheen: colors.reward.goldSheen,
};

interface Props {
  calendar: Calendar;
  /** The plan as this user was enrolled on it, which is what each day shows. */
  enrollment: ProgramEnrollmentV3;
  completion?: PathDayCompletion;
  isPro?: boolean;
  onLockedWeekTap?: () => void;
  /** The first y on screen not covered by the screen's own chrome. */
  revealTop?: number;
  /** Scrolls the list holding the path, so a tapped node can be given room. */
  onScrollBy?: (dy: number) => void;
  /** Handed today's node, so the screen can bring it back into view. */
  todayRef?: (node: View | null) => void;
  onTodayLayout?: () => void;
  /** Days finished the calendar day after the one before, known before the path is drawn. */
  goldDays: ReadonlySet<number>;
  /** Called once the path has shown itself, fully laid out. */
  onDrawn?: () => void;
  /** Opens today's next unfinished task from today's card; null once the day is done. */
  onStartToday?: (() => void) | null;
}

/**
 * The plan as a path: a divider where each later week starts, a node per day,
 * and a room at the end of each week. A tapped
 * node says what it is, and today's can start the day's next task.
 */
export default function PlanPath({
  calendar,
  enrollment,
  completion,
  isPro = true,
  onLockedWeekTap,
  revealTop,
  onScrollBy,
  todayRef,
  onTodayLayout,
  goldDays,
  onDrawn,
  onStartToday,
}: Props) {
  const window = useWindowDimensions();
  const playTap = useCompletionSound('pathTap', { finishOnBlur: true });
  const drawn = useRef(false);
  const [pathWidth, setPathWidth] = useState(0);
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setPathWidth(width);
  }, []);
  useEffect(() => {
    if (pathWidth > 0 && !drawn.current) {
      drawn.current = true;
      onDrawn?.();
    }
  }, [onDrawn, pathWidth]);

  const clearTop = revealTop ?? null;

  const handleLockedPress = useCallback(() => {
    triggerTapHaptic();
    playTap();
    onLockedWeekTap?.();
  }, [onLockedWeekTap, playTap]);

  // Kept after closing so the card fades out with its content still in it.
  const [content, setContent] = useState<(PathDayCardContent & { day?: number }) | null>(null);
  const [visible, setVisible] = useState(false);
  const opening = useRef<AbortController | null>(null);
  useEffect(() => () => opening.current?.abort(), []);

  /**
   * A node with no room for its card on either side is scrolled up under the
   * title first, then measured again once the page has come to rest, so the
   * card opens with the whole screen below it.
   */
  const openNode = useCallback(
    async (measure: MeasureNode, next: NodeCard) => {
      triggerTapHaptic();
      playTap();
      opening.current?.abort();
      const request = new AbortController();
      opening.current = request;
      const validMeasure = async () => {
        const rect = await measure();
        return rect != null && Object.values(rect).every(Number.isFinite) && rect.width > 0 && rect.height > 0 ? rect : null;
      };
      const anchor = await measureWithinDeadline(validMeasure, REVEAL_SETTLE_MS, request.signal);
      if (anchor == null || request.signal.aborted) return;

      const roomBelow = window.height - (anchor.y + anchor.height);
      const roomAbove = anchor.y - (clearTop ?? 0);
      let placed = anchor;
      if (
        onScrollBy != null &&
        clearTop != null &&
        roomBelow < CARD_ROOM &&
        roomAbove < CARD_ROOM
      ) {
        onScrollBy(anchor.y - clearTop);
        const settled = await sampleUntilStable(validMeasure, {
          signal: request.signal,
          timeoutMs: REVEAL_SETTLE_MS,
          pollMs: REVEAL_POLL_MS,
          graceMs: REVEAL_GRACE_MS,
        });
        placed = settled.rect ?? anchor;
      }

      if (request.signal.aborted) return;
      setContent({ ...next, anchor: placed });
      setVisible(true);
    },
    [clearTop, onScrollBy, playTap, window.height],
  );

  const close = useCallback(() => { opening.current?.abort(); setVisible(false); }, []);
  const selectedDay = content?.day == null
    ? undefined
    : calendar.weeks.flatMap((week) => week.days).find((day) => day.day === content.day);
  const startToday = selectedDay?.state === 'today' ? onStartToday ?? undefined : undefined;
  const liveContent = content != null && selectedDay != null
    ? { ...content, detail: detailForDay(enrollment, selectedDay, completion) }
    : content;

  return (
    <View
      collapsable={false}
      onLayout={handleLayout}
      style={[styles.list, pathWidth === 0 && styles.measuring]}
    >
      {calendar.weeks.map((week, index) => (
        <WeekSection
          key={week.week}
          week={week}
          index={index}
          enrollment={enrollment}
          completion={completion}
          isLocked={isPlanWeekLocked(week.week, isPro)}
          goldDays={goldDays}
          onOpenNode={openNode}
          onLockedPress={handleLockedPress}
          pathWidth={pathWidth}
          todayRef={todayRef}
          onTodayLayout={onTodayLayout}
        />
      ))}
      <PathDayCard
        content={liveContent}
        visible={visible}
        onClose={close}
        onStart={startToday}
      />
    </View>
  );
}

const WeekSection = memo(function WeekSection({
  week,
  index: weekIndex,
  enrollment,
  completion,
  isLocked,
  goldDays,
  onOpenNode,
  onLockedPress,
  pathWidth,
  todayRef,
  onTodayLayout,
}: {
  week: PlanCalendarWeek;
  index: number;
  enrollment: ProgramEnrollmentV3;
  completion?: PathDayCompletion;
  isLocked: boolean;
  goldDays: ReadonlySet<number>;
  onOpenNode: (measure: MeasureNode, card: NodeCard) => void;
  onLockedPress: () => void;
  pathWidth: number;
  todayRef?: (node: View | null) => void;
  onTodayLayout?: () => void;
}) {
  const { planId, presetRevision } = enrollment;
  const preset = useMemo(
    () => programPresetRevision(planId, presetRevision),
    [planId, presetRevision],
  );
  const hue = weekHue(week.week);
  const lit: Tone = {
    face: hue.base,
    lip: hue.ink,
    icon: colors.text.inverse,
    sheen: hue.mid,
  };
  const centres = useMemo(
    () => pathWeekTrailNodes(week, isLocked, pathWidth),
    [week, isLocked, pathWidth],
  );

  const gold = useMemo(
    () =>
      week.days.map(
        (day) =>
          !isLocked &&
          (day.state === 'done' || day.state === 'doneToday') &&
          goldDays.has(day.day),
      ),
    [week, isLocked, goldDays],
  );
  // A stretch is walked once the node it leads into is reached; today counts.
  const stretches = useMemo(
    () =>
      trailStretches(
        [
          ...week.days.map((day) => !isLocked && day.state !== 'ahead'),
          !isLocked && week.state === 'done',
        ],
        gold,
      ),
    [week, isLocked, gold],
  );

  return (
    <View style={styles.week}>
      {weekIndex === 0 ? null : (
        <WeekDivider week={week} isLocked={isLocked} onLockedPress={onLockedPress} />
      )}
      <View style={styles.path}>
        <PathTrail points={centres} stretches={stretches} />
        {week.days.map((day, index) => {
          const offset = pathNodeOffset(index) * PATH_STEP;
          const tone =
            isLocked || day.state === 'ahead' ? GREY : gold[index] ? GOLD : lit;

          return (
            <DayNode
              key={day.day}
              day={day}
              offset={offset}
              tone={tone}
              isLocked={isLocked}
              dayIcon={dayCoinIcon(preset, day.day)}
              lessonTitle={planLessonTitle(programDayLesson(enrollment, day.day))}
              pathWidth={pathWidth}
              accent={hue.ink}
              ring={day.state === 'today' && !isLocked ? hue.tint : undefined}
              todayRef={todayRef}
              onTodayLayout={onTodayLayout}
              onPress={
                isLocked
                  ? onLockedPress
                  : (measure) =>
                      onOpenNode(measure, {
                        day: day.day,
                        detail: detailForDay(enrollment, day, completion),
                      })
              }
            />
          );
        })}
        <RoomNode
          week={week.week}
          done={week.state === 'done'}
          tone={!isLocked && week.state === 'done' ? lit : GREY}
          isLocked={isLocked}
          pathWidth={pathWidth}
          onPress={
            isLocked
              ? onLockedPress
              : (measure) =>
                  onOpenNode(measure, {
                    detail: pathRoomDetail(week.week, week.state === 'done'),
                  })
          }
        />
      </View>
    </View>
  );
});

function detailForDay(
  enrollment: ProgramEnrollmentV3,
  day: PlanCalendarDay,
  completion?: PathDayCompletion,
) {
  const preset = programPresetRevision(enrollment.planId, enrollment.presetRevision);
  return pathDayDetail({
    day: day.day,
    state: day.state,
    exercises: dayExercises(preset, day.day),
    lesson: programDayLesson(enrollment, day.day),
    todoRequired: programDayAsksForTodo(enrollment, day.day),
    completion,
  });
}

/** The day's exercises as the plan authors them, before any fallback on Home. */
function dayExercises(
  preset: ProgramPresetRevision | null,
  day: number,
): PathDayExercise[] {
  if (preset == null) return [];
  return (programDayDefinition(preset, day)?.activityIds ?? []).flatMap((id) => {
    const activity = PROGRAM_ACTIVITIES.get(id);
    return activity == null
      ? []
      : [{ activityId: id, title: activity.title, estimatedSeconds: activity.estimatedSeconds }];
  });
}

/** Where a later week starts on the path; the banner above takes its name once it passes under. */
function WeekDivider({
  week,
  isLocked,
  onLockedPress,
}: {
  week: PlanCalendarWeek;
  isLocked: boolean;
  onLockedPress: () => void;
}) {
  return (
    <Pressable
      onPress={isLocked ? onLockedPress : undefined}
      accessibilityRole={isLocked ? 'button' : 'header'}
      accessibilityLabel={
        isLocked
          ? `Week ${week.week}, ${week.phaseName}, locked. Subscribe to Azora Pro to unlock the rest of your plan`
          : `Week ${week.week}, ${week.phaseName}`
      }
      style={styles.divider}
    >
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>
        Week {week.week} · {week.phaseName}
      </Text>
      {isLocked ? (
        <Icon name="lock" size={DIVIDER_LOCK_ICON} color={colors.text.tertiary} />
      ) : null}
      <View style={styles.dividerLine} />
    </Pressable>
  );
}

function DayNode({
  day,
  offset,
  tone,
  isLocked,
  todayRef,
  onTodayLayout,
  onPress,
  dayIcon,
  lessonTitle,
  pathWidth,
  accent,
  ring,
}: {
  day: PlanCalendarDay;
  offset: number;
  tone: Tone;
  dayIcon: IconName;
  lessonTitle: string;
  pathWidth: number;
  accent: string;
  /** Rings the coin to tap next. */
  ring?: string;
  isLocked: boolean;
  todayRef?: (node: View | null) => void;
  onTodayLayout?: () => void;
  onPress: (measure: MeasureNode) => void;
}) {
  const today = day.state === 'today' && !isLocked;
  // Still the day on screen until the calendar turns, so it keeps its size.
  const current = (today || day.state === 'doneToday') && !isLocked;
  const size = pathDaySize(day, isLocked);
  const done = day.state === 'done' || day.state === 'doneToday';
  const icon = isLocked ? 'coin-lock' : done ? 'coin-check' : dayIcon;

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={
        isLocked
          ? `Day ${day.day}, ${lessonTitle}, locked. Subscribe to Azora Pro to unlock it`
          : `Day ${day.day}, ${lessonTitle}, ${DAY_STATE_LABEL[day.state]}`
      }
      ref={current ? todayRef : undefined}
      collapsable={false}
      onLayout={current ? onTodayLayout : undefined}
      style={[{ transform: [{ translateX: offset }] }, ring != null && styles.ringed]}
    >
      {ring == null ? null : <TodayRing size={size} color={ring} active={today} />}
      <Hop active={today}>
        <LipToken
          size={size}
          aspect={COIN_ASPECT}
          depth={COIN_DEPTH}
          tone={tone}
          onPress={onPress}
        >
          <CoinIcon name={icon} size={NODE_ICON} tone={tone} />
        </LipToken>
      </Hop>
      <NodeCaption
        eyebrow={`DAY ${day.day}`}
        title={lessonTitle}
        size={size}
        offset={offset}
        pathWidth={pathWidth}
        muted={isLocked || day.state === 'ahead'}
        accent={today ? accent : undefined}
      />
      {ring == null ? null : <HereBubble />}
    </View>
  );
}

/**
 * A glow hugging the whole coin, lip included, that breathes while the coin
 * hops inside it.
 */
function TodayRing({ size, color, active }: { size: number; color: string; active: boolean }) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);
  const width = size + RING_REACH * 2;
  const height = size / COIN_ASPECT + COIN_DEPTH + RING_REACH * 2;

  useWhileVisible(() => {
    if (!active || reducedMotion) return () => {};
    pulse.value = withRepeat(
      withTiming(1, { duration: GLOW_PULSE_MS, easing: easing.breathe }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(pulse);
      pulse.value = 0;
    };
  }, [active, pulse, reducedMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 1 - pulse.value * (1 - GLOW_DIM),
    transform: [{ scale: 1 + pulse.value * (GLOW_SCALE - 1) }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.ring, { width, height }, glowStyle]}>
      <Svg width={width} height={height}>
        <Ellipse
          cx={width / 2}
          cy={height / 2}
          rx={width / 2 - RING_WIDTH / 2}
          ry={height / 2 - RING_WIDTH / 2}
          fill={color}
          stroke={color}
          strokeWidth={RING_WIDTH}
        />
      </Svg>
    </Animated.View>
  );
}

/** Points down at today's coin from above its glow, bouncing gently. */
function HereBubble() {
  const reducedMotion = useReducedMotion();
  const bob = useSharedValue(0);

  useWhileVisible(() => {
    if (reducedMotion) return () => {};
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: HERE_BOB_MS, easing: easing.breathe }),
        withSpring(0, spring.bounce),
      ),
      -1,
    );
    return () => {
      cancelAnimation(bob);
      bob.value = 0;
    };
  }, [bob, reducedMotion]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -bob.value * HERE_BOB }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.here, bobStyle]}>
      <View style={styles.herePill}>
        <Text style={styles.hereLabel}>You're here</Text>
      </View>
      <View style={styles.hereTail} />
    </Animated.View>
  );
}

function RoomNode({
  week,
  done,
  tone,
  isLocked,
  pathWidth,
  onPress,
}: {
  week: number;
  done: boolean;
  tone: Tone;
  isLocked: boolean;
  pathWidth: number;
  onPress: (measure: MeasureNode) => void;
}) {
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={
        isLocked
          ? `Week ${week}, new room, locked. Subscribe to Azora Pro to unlock it`
          : `Week ${week}, ${done ? 'room complete' : 'new room, to come'}`
      }
      style={styles.room}
    >
      <LipToken
        size={ROOM_NODE}
        shape="hex"
        aspect={COIN_ASPECT}
        depth={COIN_DEPTH}
        tone={tone}
        onPress={onPress}
      >
        <CoinIcon name={isLocked ? 'coin-lock' : 'coin-sofa'} size={ROOM_ICON} tone={tone} />
      </LipToken>
      <NodeCaption
        eyebrow={`WEEK ${week}`}
        title={done ? 'Room complete' : 'New room'}
        size={ROOM_NODE}
        offset={0}
        pathWidth={pathWidth}
        muted={isLocked || !done}
      />
    </View>
  );
}

/** Labels occupy the open side of the zigzag without changing coin or trail geometry. */
function NodeCaption({
  eyebrow,
  title,
  size,
  offset,
  pathWidth,
  muted,
  accent,
}: {
  eyebrow: string;
  title: string;
  size: number;
  offset: number;
  pathWidth: number;
  muted: boolean;
  accent?: string;
}) {
  const left = offset > 0;
  const width = Math.max(0, Math.min(
    CAPTION_MAX_WIDTH,
    pathWidth / 2 + Math.abs(offset) - size / 2 - CAPTION_GAP - spacing.sm,
  ));
  const textAlign = left ? 'right' : 'left';

  return (
    <View
      pointerEvents="none"
      style={[
        styles.caption,
        { width, [left ? 'right' : 'left']: size + CAPTION_GAP },
      ]}
    >
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.captionEyebrow, { textAlign }, accent != null && { color: accent }]}
      >
        {eyebrow}
      </Text>
      {/*
        No `adjustsFontSizeToFit`: on iOS it ignores `minimumFontScale` and may
        shrink to 4pt, which left some titles tiny beside full-size ones. Every
        lesson title fits two lines at full size in the narrowest slot.
      */}
      <Text numberOfLines={2} ellipsizeMode="tail" style={[
        styles.captionTitle,
        { textAlign },
        muted && styles.captionMuted,
        accent != null && { color: accent },
      ]}>
        {title}
      </Text>
    </View>
  );
}

const TRAIL_COLOR: Record<TrailStretch, string> = {
  ahead: colors.neutral[300],
  walked: colors.playful.sky.base,
  gold: colors.reward.gold,
};

/**
 * The dotted road between a week's nodes is blue up to the furthest node
 * reached, gold between two gold coins, and grey beyond.
 */
function PathTrail({ points, stretches }: {
  points: (TrailNode | undefined)[];
  stretches: TrailStretch[];
}) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      {stretches.flatMap((stretch, index) => {
        const from = points[index - 1];
        const to = points[index];
        if (from == null || to == null) return [];
        return trailDots(from, to, TRAIL_PITCH, TRAIL_PITCH / 2).map((dot, dotIndex) => (
          <View
            key={`${index}-${dotIndex}`}
            style={[
              styles.trailDot,
              {
                left: dot.x - TRAIL_DOT / 2,
                top: dot.y - TRAIL_DOT / 2,
                backgroundColor: TRAIL_COLOR[stretch],
              },
            ]}
          />
        ));
      })}
    </View>
  );
}

/** A small hop now and then, resting in between, so today's node reads as the one waiting. */
function Hop({ active, children }: { active: boolean; children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const lift = useSharedValue(0);

  useWhileVisible(() => {
    if (!active || reducedMotion) return () => {};
    lift.value = withRepeat(
      withSequence(
        withDelay(
          HOP_REST_MS,
          withTiming(-HOP_HEIGHT, { duration: duration.fast, easing: easing.enter }),
        ),
        withSpring(0, spring.bounce),
      ),
      -1,
    );
    return () => {
      cancelAnimation(lift);
      lift.value = 0;
    };
  }, [active, lift, reducedMotion]);

  const hopStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));

  return <Animated.View style={hopStyle}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.xl,
  },
  measuring: { opacity: 0 },
  week: {
    gap: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: DIVIDER_LINE,
    borderRadius: radius.full,
    backgroundColor: colors.border.subtle,
  },
  dividerLabel: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: typography.overline.letterSpacing,
    color: colors.text.tertiary,
  },
  path: {
    alignItems: 'center',
    gap: PATH_STEP,
    paddingVertical: PATH_PADDING,
  },
  trailDot: {
    position: 'absolute',
    width: TRAIL_DOT,
    height: TRAIL_DOT,
    borderRadius: TRAIL_DOT / 2,
  },
  ringed: {
    marginTop: RING_REACH + HERE_ROOM,
    marginBottom: RING_REACH,
  },
  ring: {
    position: 'absolute',
    top: -RING_REACH,
    left: -RING_REACH,
  },
  here: {
    position: 'absolute',
    bottom: '100%',
    left: -spacing['3xl'],
    right: -spacing['3xl'],
    alignItems: 'center',
    marginBottom: RING_REACH + HERE_GAP,
  },
  herePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + spacing.xs / 2,
    borderRadius: radius.full,
    backgroundColor: HERE_COLOR,
  },
  // A border triangle tucked a point under the pill, so no seam opens as it bounces.
  hereTail: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: HERE_TAIL,
    borderRightWidth: HERE_TAIL,
    borderTopWidth: HERE_TAIL,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: HERE_COLOR,
  },
  hereLabel: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  room: {
    marginTop: ROOM_MARGIN,
  },
  caption: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  captionEyebrow: {
    ...typography.overline,
    letterSpacing: 0.6,
    color: colors.text.secondary,
  },
  captionTitle: {
    ...typography.heading.heading1,
    lineHeight: typography.heading.heading1.fontSize + spacing.xs,
    color: colors.text.primary,
  },
  captionMuted: {
    color: colors.text.secondary,
  },
});
