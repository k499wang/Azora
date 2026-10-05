import { useWhileVisible } from '../../hooks/useWhileVisible';
import {
  memo,
  useCallback,
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
import { Canvas, DashPathEffect, Path, Skia } from '@shopify/react-native-skia';
import Svg, { Ellipse } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  measure,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedRef,
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
import { WeekBanner, weekHue } from './PlanWeekBanner';
import type { PlanWeekPin } from './usePlanWeekPin';
import { sampleUntilStable } from '../tour/tourSampling';
import { triggerTapHaptic } from '../../native/tapHaptics';
import {
  type PlanCalendar as Calendar,
  type PlanCalendarDay,
  type PlanCalendarWeek,
} from './domain/planCalendar';
import {
  pathDayDetail,
  pathNodeOffset,
  pathRoomDetail,
  type PathDayExercise,
} from './domain/planPath';
import { planWeekPurpose } from './domain/planWeekPurpose';
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
import { radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing, spring } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const DAY_NODE = spacing['6xl'];
const TODAY_NODE = Math.round(DAY_NODE * 1.2);
const ROOM_NODE = spacing['7xl'];
const HOP_HEIGHT = spacing.sm;
const HOP_REST_MS = 2600;
const PATH_STEP = spacing['3xl'];
const COIN_ASPECT = 1.15;
const COIN_DEPTH = spacing.sm;
const RING_GAP = spacing.xs;
const RING_WIDTH = spacing.sm;
const RING_REACH = RING_GAP + RING_WIDTH;
const NODE_ICON = 36;
const ROOM_ICON = 48;
const DIVIDER_LOCK_ICON = 16;
const DIVIDER_LINE = spacing.xs / 2;
/** About the tallest day card: a two-line title and action, and three exercises. */
const CARD_ROOM = 440;
const REVEAL_SETTLE_MS = 700;
const REVEAL_POLL_MS = 80;
const REVEAL_GRACE_MS = 120;
const TRAIL_WIDTH = spacing.sm;
const TRAIL_DOT_GAP = spacing.md;

interface TrailPoint {
  x: number;
  y: number;
}

const DAY_STATE_LABEL: Record<PlanCalendarDay['state'], string> = {
  done: 'done',
  doneToday: 'done today',
  today: 'today',
  ahead: 'to come',
};
type NodeCard = Omit<PathDayCardContent, 'anchor'>;

const GREY: Tone = {
  face: colors.neutral[200],
  lip: colors.neutral[300],
  icon: colors.neutral[400],
};

interface Props {
  calendar: Calendar;
  /** The plan as this user was enrolled on it, which is what each day shows. */
  enrollment: ProgramEnrollmentV3;
  isPro?: boolean;
  onLockedWeekTap?: () => void;
  /** The first y on screen not covered by the screen's own chrome. */
  revealTop?: number;
  /** Scrolls the list holding the path, so a tapped node can be given room. */
  onScrollBy?: (dy: number) => void;
  /** Handed today's node, so the screen can bring it back into view. */
  todayRef?: (node: View | null) => void;
  /** Shared with the banner pinned over the path, which takes over from the first week's. */
  pin?: PlanWeekPin;
}

/**
 * The plan as a path: one banner for the week on screen, a divider where each
 * later week starts, a node per day, a room at the end of each week. A tapped
 * node says what it is; the days themselves are done on Home.
 */
export default function PlanPath({
  calendar,
  enrollment,
  isPro = true,
  onLockedWeekTap,
  revealTop,
  onScrollBy,
  todayRef,
  pin,
}: Props) {
  const window = useWindowDimensions();
  const list = useAnimatedRef<View>();
  const placedTops = useRef<number[]>([]);
  const first = calendar.weeks.at(0);
  const firstLocked = first != null && !isPro && first.week >= 2;

  const measureOrigin = useCallback(() => {
    if (pin == null) return;
    const { origin, scrollY } = pin;
    // Measure and sample scrolling in the same UI frame so layout during a
    // scroll cannot shift the banner's content origin.
    runOnUI(() => {
      'worklet';
      const layout = measure(list);
      if (layout != null) origin.value = layout.pageY + scrollY.value;
    })();
  }, [list, pin]);

  const placeWeek = useCallback(
    (index: number, top: number) => {
      if (pin == null || placedTops.current[index] === top) return;
      const next = [...placedTops.current];
      next[index] = top;
      placedTops.current = next;
      pin.weekTops.value = next;
    },
    [pin],
  );

  // Keep the first banner's layout space; the overlay owns its visible motion
  // as soon as its origin is measured, including before it reaches the pin line.
  const origin = pin?.origin;
  const scrollY = pin?.scrollY;
  const stickTop = pin?.stickTop ?? 0;
  const [pinned, setPinned] = useState(false);
  // Before pinning, touches stay with the inline placeholder so dragging the
  // visible banner still starts the enclosing scroll view's gesture.
  useAnimatedReaction(
    () => {
      const start = origin?.value;
      return start != null && scrollY != null && start - scrollY.value <= stickTop;
    },
    (next, previous) => {
      if (next !== previous) runOnJS(setPinned)(next);
    },
    [origin, scrollY, stickTop],
  );
  const handoffStyle = useAnimatedStyle(() => {
    const start = origin?.value;
    return {
      opacity: start == null ? 1 : 0,
    };
  });

  const handleLockedPress = useCallback(() => {
    triggerTapHaptic();
    onLockedWeekTap?.();
  }, [onLockedWeekTap]);

  // Kept after closing so the card fades out with its content still in it.
  const [content, setContent] = useState<PathDayCardContent | null>(null);
  const [visible, setVisible] = useState(false);

  /**
   * A node with no room for its card on either side is scrolled up under the
   * title first, then measured again once the page has come to rest, so the
   * card opens with the whole screen below it.
   */
  const openNode = useCallback(
    async (measure: MeasureNode, next: NodeCard) => {
      triggerTapHaptic();
      const anchor = await measure();
      if (anchor == null) return;

      // A pinned banner covers the top of the page, so a node is revealed below it.
      const clearTop =
        revealTop == null
          ? null
          : pin == null
            ? revealTop
            : Math.max(revealTop, pin.stickTop + pin.bannerHeight + spacing.md);
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
        const settled = await sampleUntilStable(measure, {
          timeoutMs: REVEAL_SETTLE_MS,
          pollMs: REVEAL_POLL_MS,
          graceMs: REVEAL_GRACE_MS,
        });
        placed = settled.rect ?? anchor;
      }

      setContent({ ...next, anchor: placed });
      setVisible(true);
    },
    [onScrollBy, pin, revealTop, window.height],
  );

  const close = useCallback(() => setVisible(false), []);

  return (
    <Animated.View ref={list} onLayout={measureOrigin} style={styles.list}>
      {first == null ? null : (
        <Animated.View
          pointerEvents={pinned ? 'none' : 'auto'}
          accessibilityElementsHidden={pinned}
          importantForAccessibility={pinned ? 'no-hide-descendants' : 'auto'}
          style={handoffStyle}
        >
          <WeekBanner
            week={first}
            purpose={planWeekPurpose(enrollment.planId, first.week)}
            isLocked={firstLocked}
            hue={firstLocked ? colors.playful.stone : weekHue(first.week)}
            onLockedPress={handleLockedPress}
            minHeight={pin?.bannerHeight}
          />
        </Animated.View>
      )}
      {calendar.weeks.map((week, index) => (
        <WeekSection
          key={week.week}
          week={week}
          index={index}
          enrollment={enrollment}
          opensTomorrow={calendar.opensTomorrow}
          isLocked={!isPro && week.week >= 2}
          onOpenNode={openNode}
          onLockedPress={handleLockedPress}
          onPlace={placeWeek}
          todayRef={todayRef}
        />
      ))}
      <PathDayCard
        content={content}
        visible={visible}
        onClose={close}
      />
    </Animated.View>
  );
}

const WeekSection = memo(function WeekSection({
  week,
  index: weekIndex,
  enrollment,
  opensTomorrow,
  isLocked,
  onOpenNode,
  onLockedPress,
  onPlace,
  todayRef,
}: {
  week: PlanCalendarWeek;
  index: number;
  enrollment: ProgramEnrollmentV3;
  opensTomorrow: number | null;
  isLocked: boolean;
  onOpenNode: (measure: MeasureNode, card: NodeCard) => void;
  onLockedPress: () => void;
  onPlace: (index: number, top: number) => void;
  todayRef?: (node: View | null) => void;
}) {
  const { planId, presetRevision } = enrollment;
  const preset = useMemo(
    () => programPresetRevision(planId, presetRevision),
    [planId, presetRevision],
  );
  const hue = weekHue(week.week);
  const purpose = planWeekPurpose(planId, week.week);
  const lit: Tone = { face: hue.base, lip: hue.ink, icon: colors.text.inverse };

  const [centres, setCentres] = useState<(TrailPoint | undefined)[]>([]);
  const placeNode = useCallback((index: number, point: TrailPoint) => {
    setCentres((prev) => {
      const was = prev[index];
      if (was != null && was.x === point.x && was.y === point.y) return prev;
      const next = [...prev];
      next[index] = point;
      return next;
    });
  }, []);

  // A stretch is walked once the node it leads into is reached; today counts.
  const walked = useMemo(
    () => [
      ...week.days.map((day) => !isLocked && day.state !== 'ahead'),
      !isLocked && week.state === 'done',
    ],
    [week, isLocked],
  );

  return (
    <View
      style={styles.week}
      onLayout={(event) => onPlace(weekIndex, event.nativeEvent.layout.y)}
    >
      {weekIndex === 0 ? null : (
        <WeekDivider week={week} isLocked={isLocked} onLockedPress={onLockedPress} />
      )}
      <View style={styles.path}>
        <PathTrail points={centres} walked={walked} />
        {week.days.map((day, index) => {
          const offset = pathNodeOffset(index) * PATH_STEP;
          const lesson =
            day.state === 'ahead' || isLocked ? null : programDayLesson(enrollment, day.day);

          return (
            <DayNode
              key={day.day}
              day={day}
              offset={offset}
              tone={isLocked || day.state === 'ahead' ? GREY : lit}
              isLocked={isLocked}
              resetIcon={dayCoinIcon(preset, day.day)}
              ring={day.state === 'today' && !isLocked ? hue.tint : undefined}
              onPlace={(point) => placeNode(index, point)}
              todayRef={todayRef}
              onPress={
                isLocked
                  ? onLockedPress
                  : (measure) =>
                      onOpenNode(measure, {
                        detail: pathDayDetail({
                          day: day.day,
                          state: day.state,
                          exercises: dayExercises(preset, day.day),
                          lesson,
                          weekPurpose: purpose,
                          opensTomorrow: day.day === opensTomorrow,
                        }),
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
          onPlace={(point) => placeNode(week.days.length, point)}
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
      : [{ title: activity.title, estimatedSeconds: activity.estimatedSeconds }];
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
  onPlace,
  todayRef,
  onPress,
  resetIcon,
  ring,
}: {
  day: PlanCalendarDay;
  offset: number;
  tone: Tone;
  resetIcon: IconName;
  /** Rings the coin to tap next, in place of any label saying so. */
  ring?: string;
  isLocked: boolean;
  onPlace: (point: TrailPoint) => void;
  todayRef?: (node: View | null) => void;
  onPress: (measure: MeasureNode) => void;
}) {
  const today = day.state === 'today' && !isLocked;
  // Still the day on screen until the calendar turns, so it keeps its size.
  const current = (today || day.state === 'doneToday') && !isLocked;
  const size = current ? TODAY_NODE : DAY_NODE;
  const icon: IconName = isLocked
    ? 'coin-lock'
    : day.state === 'done' || day.state === 'doneToday'
      ? 'coin-check'
      : resetIcon;

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={
        isLocked
          ? `Day ${day.day}, locked. Subscribe to Azora Pro to unlock it`
          : `Day ${day.day}, ${DAY_STATE_LABEL[day.state]}`
      }
      ref={current ? todayRef : undefined}
      onLayout={(event) => onPlace(faceCentre(event, offset))}
      style={[{ transform: [{ translateX: offset }] }, ring != null && styles.ringed]}
    >
      {ring == null ? null : <TodayRing size={size} color={ring} />}
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
    </View>
  );
}

/** Hugs the whole coin, lip included, and stays put while the coin hops inside it. */
function TodayRing({ size, color }: { size: number; color: string }) {
  const width = size + RING_REACH * 2;
  const height = size / COIN_ASPECT + COIN_DEPTH + RING_REACH * 2;
  return (
    <Svg
      pointerEvents="none"
      width={width}
      height={height}
      style={[styles.ring, { width, height }]}
    >
      <Ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width / 2 - RING_WIDTH / 2}
        ry={height / 2 - RING_WIDTH / 2}
        fill="none"
        stroke={color}
        strokeWidth={RING_WIDTH}
      />
    </Svg>
  );
}

function RoomNode({
  week,
  done,
  tone,
  isLocked,
  onPlace,
  onPress,
}: {
  week: number;
  done: boolean;
  tone: Tone;
  isLocked: boolean;
  onPlace: (point: TrailPoint) => void;
  onPress: (measure: MeasureNode) => void;
}) {
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={
        isLocked
          ? `Week ${week} room, locked. Subscribe to Azora Pro to unlock it`
          : `Week ${week} room, ${done ? 'done' : 'to come'}`
      }
      onLayout={(event) => onPlace(faceCentre(event, 0))}
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
    </View>
  );
}

/** Layout ignores the zigzag's translate, so the offset is added back; the lip sits below the face. */
function faceCentre(event: LayoutChangeEvent, offset: number): TrailPoint {
  const { x, y, width, height } = event.nativeEvent.layout;
  return { x: x + width / 2 + offset, y: y + (height - COIN_DEPTH) / 2 };
}

/**
 * The dotted road between a week's nodes is blue up to the furthest node
 * reached and grey beyond it.
 */
function PathTrail({
  points,
  walked,
}: {
  points: (TrailPoint | undefined)[];
  walked: boolean[];
}) {
  const { road, ahead } = useMemo(() => {
    const roadPath = Skia.Path.Make();
    const aheadPath = Skia.Path.Make();
    for (let index = 1; index < walked.length; index += 1) {
      const from = points[index - 1];
      const to = points[index];
      if (from == null || to == null) continue;
      const target = walked[index] ? roadPath : aheadPath;
      const midY = (from.y + to.y) / 2;
      target.moveTo(from.x, from.y);
      target.cubicTo(from.x, midY, to.x, midY, to.x, to.y);
    }
    return { road: roadPath, ahead: aheadPath };
  }, [points, walked]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Path
          path={ahead}
          style="stroke"
          strokeWidth={TRAIL_WIDTH}
          strokeCap="round"
          color={colors.neutral[300]}
        >
          <DashPathEffect intervals={[0, TRAIL_DOT_GAP]} />
        </Path>
        <Path
          path={road}
          style="stroke"
          strokeWidth={TRAIL_WIDTH}
          strokeCap="round"
          color={colors.playful.sky.base}
        >
          <DashPathEffect intervals={[0, TRAIL_DOT_GAP]} />
        </Path>
      </Canvas>
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
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  ringed: {
    marginVertical: RING_REACH,
  },
  ring: {
    position: 'absolute',
    top: -RING_REACH,
    left: -RING_REACH,
  },
  room: {
    marginTop: spacing.sm,
  },
});
