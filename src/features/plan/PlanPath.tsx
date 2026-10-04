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
import { Canvas, DashPathEffect, Path, Skia } from '@shopify/react-native-skia';
import Svg, { Ellipse } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  FadeIn,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import type { IconName } from '../../components/common/icons/paths';
import LipToken, { CoinIcon, type LipTone as Tone, type MeasureNode } from './LipToken';
import { dayCoinIcon } from './pathCoinIcon';
import PathDayCard, { type PathDayCardContent } from './PathDayCard';
import { sampleUntilStable } from '../tour/tourSampling';
import { triggerMediumHaptic, triggerTapHaptic } from '../../native/tapHaptics';
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
import { card, coloredCard, radius } from '../../theme/card';
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
const BANNER_LOCK_ICON = 20;
const DIVIDER_LOCK_ICON = 16;
const DIVIDER_LINE = spacing.xs / 2;
/** How far back past a week's start the page must go before the banner gives that week up. */
const SWITCH_SLACK = spacing.md;
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

/** Each week takes the next hue, so scrolling the path reads as moving through it. */
const WEEK_HUES = [
  colors.playful.sky,
  colors.playful.teal,
  colors.playful.violet,
  colors.playful.coral,
] as const;

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
  /** The screen's scroll offset; with `stickTop`, the banner pins there and follows the week on screen. */
  scrollY?: SharedValue<number>;
  stickTop?: number;
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
  scrollY,
  stickTop,
}: Props) {
  const window = useWindowDimensions();
  const list = useRef<View>(null);
  // Window y of the list's top at scroll offset zero; null until measured.
  const origin = useSharedValue<number | null>(null);
  const weekTops = useSharedValue<number[]>([]);
  const placedTops = useRef<number[]>([]);
  // The first week's banner height: the switch line must not move when the banner changes week.
  const restHeight = useSharedValue(0);
  const shownIndex = useSharedValue(0);
  const bannerRoom = useRef(0);
  const [spacer, setSpacer] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = calendar.weeks.at(Math.min(activeIndex, calendar.weeks.length - 1));
  const activeLocked = active != null && !isPro && active.week >= 2;

  const measureOrigin = useCallback(() => {
    if (scrollY == null) return;
    list.current?.measureInWindow((_x, y) => {
      origin.value = y + scrollY.value;
    });
  }, [origin, scrollY]);

  const placeWeek = useCallback(
    (index: number, top: number) => {
      if (placedTops.current[index] === top) return;
      const next = [...placedTops.current];
      next[index] = top;
      placedTops.current = next;
      weekTops.value = next;
    },
    [weekTops],
  );

  // Only the first week's banner sizes the gap it sits in, so a taller one later never shifts the path.
  const handleBannerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      bannerRoom.current = Math.max(bannerRoom.current, height);
      if (activeIndex !== 0) return;
      restHeight.value = height;
      setSpacer(height);
    },
    [activeIndex, restHeight],
  );

  const handleLockedPress = useCallback(() => {
    triggerTapHaptic();
    onLockedWeekTap?.();
  }, [onLockedWeekTap]);

  // The banner is the week whose start has passed under it. A week already
  // shown is only given up once its start is clearly back below the line, so
  // resting on the line or a bounce at the edge cannot flick between two weeks.
  useAnimatedReaction(
    () => {
      const start = origin.value;
      if (scrollY == null || stickTop == null || start == null) return 0;
      const line = stickTop + restHeight.value - start + scrollY.value;
      const tops = weekTops.value;
      let index = 0;
      for (let at = 1; at < tops.length; at += 1) {
        const reach = at <= shownIndex.value ? line + SWITCH_SLACK : line;
        if (tops[at] <= reach) index = at;
      }
      return index;
    },
    (next, previous) => {
      if (next === previous) return;
      shownIndex.value = next;
      runOnJS(setActiveIndex)(next);
      if (previous != null) runOnJS(triggerMediumHaptic)();
    },
    [scrollY, stickTop],
  );

  const pinStyle = useAnimatedStyle(() => {
    const start = origin.value;
    if (scrollY == null || stickTop == null || start == null) {
      return { transform: [{ translateY: 0 }] };
    }
    return {
      transform: [{ translateY: Math.max(stickTop - (start - scrollY.value), 0) }],
    };
  });
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
          : scrollY == null || stickTop == null
            ? revealTop
            : Math.max(revealTop, stickTop + bannerRoom.current + spacing.md);
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
    [onScrollBy, revealTop, scrollY, stickTop, window.height],
  );

  const close = useCallback(() => setVisible(false), []);

  return (
    <View
      ref={list}
      onLayout={measureOrigin}
      style={[styles.list, spacer > 0 && { paddingTop: spacer + spacing.lg }]}
    >
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
      {active == null ? null : (
        <Animated.View style={[styles.pinned, pinStyle]} onLayout={handleBannerLayout}>
          <WeekBanner
            week={active}
            purpose={planWeekPurpose(enrollment.planId, active.week)}
            isLocked={activeLocked}
            hue={activeLocked ? colors.playful.stone : weekHue(active.week)}
            onLockedPress={handleLockedPress}
          />
        </Animated.View>
      )}
      <PathDayCard
        content={content}
        visible={visible}
        onClose={close}
      />
    </View>
  );
}

function weekHue(week: number) {
  return WEEK_HUES[(week - 1) % WEEK_HUES.length];
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
        <PathTrail points={centres} walked={walked} color={hue.base} />
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

function WeekBanner({
  week,
  purpose,
  isLocked,
  hue,
  onLockedPress,
}: {
  week: PlanCalendarWeek;
  purpose: string | null;
  isLocked: boolean;
  hue: { base: string; ink: `#${string}` };
  onLockedPress: () => void;
}) {
  const { backgroundColor, borderColor, borderWidth } = coloredCard(hue);
  const face = useSharedValue(backgroundColor as string);
  const edge = useSharedValue(borderColor as string);

  // Colour slides to the new week's rather than cutting, so passing into a week reads as arriving.
  useEffect(() => {
    face.value = withTiming(backgroundColor as string, { duration: duration.base });
    edge.value = withTiming(borderColor as string, { duration: duration.base });
  }, [backgroundColor, borderColor, edge, face]);

  const tintStyle = useAnimatedStyle(() => ({
    backgroundColor: face.value,
    borderColor: edge.value,
  }));

  return (
    <Pressable
      onPress={isLocked ? onLockedPress : undefined}
      accessibilityRole={isLocked ? 'button' : 'header'}
      accessibilityLabel={
        isLocked
          ? `Week ${week.week}, ${week.phaseName}, locked. Subscribe to Azora Pro to unlock the rest of your plan`
          : `Week ${week.week}, ${week.phaseName}`
      }
      style={card.blockShadow}
    >
      <Animated.View style={[card.block, { borderWidth }, styles.banner, tintStyle]}>
        <Animated.View
          key={week.week}
          entering={FadeIn.duration(duration.base)}
          style={styles.bannerText}
        >
          <Text style={styles.bannerEyebrow}>
            Week {week.week} · {week.phaseName}
          </Text>
          {purpose == null ? null : <Text style={styles.bannerPurpose}>{purpose}</Text>}
          {isLocked ? null : <WeekProgress done={week.daysDone} total={week.days.length} />}
        </Animated.View>
        {isLocked ? (
          <Icon name="lock" size={BANNER_LOCK_ICON} color={colors.text.inverse} />
        ) : null}
      </Animated.View>
    </Pressable>
  );
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

/** How much of the week is behind them, filling as days are done. */
function WeekProgress({ done, total }: { done: number; total: number }) {
  const share = total === 0 ? 0 : Math.min(done / total, 1);
  const fill = useSharedValue(share);

  useEffect(() => {
    fill.value = withTiming(share, { duration: duration.fill, easing: easing.settle });
  }, [fill, share]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View
      accessible
      accessibilityLabel={`${done} of ${total} days done`}
      style={styles.progress}
    >
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, fillStyle]} />
      </View>
      <Text style={styles.progressCount}>
        {done}/{total}
      </Text>
    </View>
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
 * The road between a week's nodes: solid up to the furthest node reached,
 * dotted grey beyond it, so the line only ever shows ground actually covered.
 */
function PathTrail({
  points,
  walked,
  color,
}: {
  points: (TrailPoint | undefined)[];
  walked: boolean[];
  color: string;
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
          color={color}
        />
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
  pinned: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
  banner: {
    borderBottomWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  bannerText: {
    flex: 1,
    gap: spacing.xs,
  },
  bannerEyebrow: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: typography.overline.letterSpacing,
    color: colors.onBlock.textMuted,
  },
  bannerPurpose: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.onBlock.fill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.text.inverse,
  },
  progressCount: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
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
