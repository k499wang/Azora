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
  measure,
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type FrameCallback,
  type SharedValue,
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
import { useCompletionSound } from '../../hooks/useCompletionSound';
import {
  type PlanCalendar as Calendar,
  type PlanCalendarDay,
  type PlanCalendarWeek,
} from './domain/planCalendar';
import {
  isPlanWeekLocked,
  pathDayDetail,
  pathNodeOffset,
  pathRoomDetail,
  type PathDayExercise,
  type PathDayCompletion,
} from './domain/planPath';
import { planWeekPurpose } from './domain/planWeekPurpose';
import { planLessonTitle } from './domain/planLessonTitle';
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
const CAPTION_GAP = RING_REACH + spacing.sm;
const CAPTION_MAX_WIDTH = spacing['7xl'] + spacing['3xl'];
const NODE_ICON = 36;
const REVEAL_FADE_TIMING = { duration: duration.slow, easing: easing.settle };
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
const REVEAL_NONE = 0;
const REVEAL_AT_ONCE = 1;
const REVEAL_FADE = 2;

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
  /** Shared with the banner pinned over the path, which takes over from the first week's. */
  pin?: PlanWeekPin;
  /** Days finished the calendar day after the one before, known before the path is drawn. */
  goldDays: ReadonlySet<number>;
  /** Called once the path has shown itself, fully laid out. */
  onDrawn?: () => void;
  /** Fades the path in when the screen was seen waiting for it, rather than appearing at once. */
  fadeIn?: boolean;
}

/**
 * The plan as a path: one banner for the week on screen, a divider where each
 * later week starts, a node per day, a room at the end of each week. A tapped
 * node says what it is; the days themselves are done on Home.
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
  pin,
  goldDays,
  onDrawn,
  fadeIn = false,
}: Props) {
  const window = useWindowDimensions();
  const list = useAnimatedRef<View>();
  const placedTops = useRef<number[]>([]);
  const first = calendar.weeks.at(0);
  const firstLocked = first != null && isPlanWeekLocked(first.week, isPro);
  const playTap = useCompletionSound('pathTap');
  const [onScreen, setOnScreen] = useState(false);

  const origin = pin?.origin;
  const inlineHeight = pin?.inlineHeight;
  const overlayReady = pin?.overlayReady;
  const scrollY = pin?.scrollY;
  const ownShown = useSharedValue(0);
  const shown = pin?.shown ?? ownShown;
  // Set once the path is drawn; played in the UI frame that measures the
  // origin, so the pinned banner and the path appear together and in place.
  const reveal = useSharedValue(REVEAL_NONE);
  const needsMeasurement = useSharedValue(false);
  const measuringFrame = useRef<FrameCallback | null>(null);
  const pathVisible = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const revealRun = useRef(0);
  const revealGeneration = useSharedValue(0);
  const finishReveal = useCallback((generation: number) => {
    if (pathVisible.current && generation === revealRun.current) setRevealed(true);
  }, []);
  const stopMeasuring = useCallback(() => {
    // A newer layout may have requested another measurement before this JS turn.
    if (!needsMeasurement.value) measuringFrame.current?.setActive(false);
  }, [needsMeasurement]);
  const frame = useFrameCallback(() => {
    if (!needsMeasurement.value || origin == null || scrollY == null) return;
    const layout = measure(list);
    if (layout == null) return;
    // Sample scrolling in the same UI frame as layout, including after focus.
    origin.value = layout.pageY + scrollY.value;
    needsMeasurement.value = false;
    if (reveal.value !== REVEAL_NONE) {
      const generation = revealGeneration.value;
      shown.value = withTiming(
        1,
        reveal.value === REVEAL_FADE ? REVEAL_FADE_TIMING : { duration: 0 },
        (finished) => {
          if (finished) runOnJS(finishReveal)(generation);
        },
      );
      reveal.value = REVEAL_NONE;
    }
    runOnJS(stopMeasuring)();
  }, false);
  measuringFrame.current = frame;

  const measureOrigin = useCallback(() => {
    if (origin == null || scrollY == null) return;
    needsMeasurement.value = true;
    if (pathVisible.current) frame.setActive(true);
  }, [frame, needsMeasurement, origin, scrollY]);

  useWhileVisible(() => {
    pathVisible.current = true;
    setOnScreen(true);
    measureOrigin();
    return () => {
      pathVisible.current = false;
      revealRun.current += 1;
      revealGeneration.value = revealRun.current;
      cancelAnimation(shown);
      reveal.value = REVEAL_NONE;
      setOnScreen(false);
      needsMeasurement.value = false;
      frame.setActive(false);
    };
  }, [frame, measureOrigin, needsMeasurement, reveal, revealGeneration, shown]);

  // The overlay shows only once the path does, so until then the inline banner is the one seen.
  const inlineBannerStyle = useAnimatedStyle(() => ({
    opacity: origin?.value != null && overlayReady?.value === true && shown.value > 0 ? 0 : 1,
  }));

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

  // The inline banner stays visible until the measured overlay can take over.
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

  // Hidden until every trail and the banner have their measured shape, so the
  // path appears once, as it is, rather than settling into place on screen.
  const [placedTrails, setPlacedTrails] = useState<ReadonlySet<number>>(() => new Set());
  const placeTrail = useCallback((week: number) => {
    setPlacedTrails((prev) => (prev.has(week) ? prev : new Set(prev).add(week)));
  }, []);
  const bannerPlaced =
    first == null || pin == null || pin.measuredWeekCount >= calendar.weeks.length;
  const [drawn, setDrawn] = useState(false);
  if (!drawn && bannerPlaced && calendar.weeks.every((week) => placedTrails.has(week.week))) {
    setDrawn(true);
  }
  useEffect(() => {
    if (drawn) onDrawn?.();
  }, [drawn, onDrawn]);

  const fadeOnReveal = useRef(fadeIn);
  useEffect(() => {
    if (!drawn || !onScreen || revealed) return;
    const generation = ++revealRun.current;
    revealGeneration.value = generation;
    const mode = fadeOnReveal.current ? REVEAL_FADE : REVEAL_AT_ONCE;
    if (origin == null || scrollY == null) {
      shown.value = withTiming(
        1,
        mode === REVEAL_FADE ? REVEAL_FADE_TIMING : { duration: 0 },
        (finished) => {
          if (finished) runOnJS(finishReveal)(generation);
        },
      );
    } else {
      reveal.value = mode;
      measureOrigin();
    }
    return () => {
      cancelAnimation(shown);
      reveal.value = REVEAL_NONE;
    };
  }, [drawn, finishReveal, measureOrigin, onScreen, origin, reveal, revealGeneration, revealed, scrollY, shown]);
  useEffect(() => () => {
    shown.value = 0;
  }, [shown]);

  // A pinned banner covers the top of the page, so a node is revealed below it.
  const clearTop =
    revealTop == null
      ? null
      : pin == null
        ? revealTop
        : Math.max(revealTop, pin.stickTop + pin.bannerHeight + spacing.md);

  const handleLockedPress = useCallback(() => {
    triggerTapHaptic();
    playTap();
    onLockedWeekTap?.();
  }, [onLockedWeekTap, playTap]);

  // Kept after closing so the card fades out with its content still in it.
  const [content, setContent] = useState<(PathDayCardContent & { day?: number }) | null>(null);
  const [visible, setVisible] = useState(false);

  /**
   * A node with no room for its card on either side is scrolled up under the
   * title first, then measured again once the page has come to rest, so the
   * card opens with the whole screen below it.
   */
  const openNode = useCallback(
    async (measure: MeasureNode, next: NodeCard) => {
      triggerTapHaptic();
      playTap();
      const anchor = await measure();
      if (anchor == null) return;

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
    [clearTop, onScrollBy, playTap, window.height],
  );

  const close = useCallback(() => setVisible(false), []);
  const selectedDay = content?.day == null
    ? undefined
    : calendar.weeks.flatMap((week) => week.days).find((day) => day.day === content.day);
  const liveContent = content != null && selectedDay != null
    ? { ...content, detail: detailForDay(enrollment, selectedDay, calendar.opensTomorrow, completion) }
    : content;

  return (
    <Animated.View
      ref={list}
      onLayout={measureOrigin}
      pointerEvents={drawn ? 'auto' : 'none'}
      style={[styles.list, !drawn && styles.unplaced]}
    >
      {first == null ? null : (
        <Animated.View
          onLayout={(event) => {
            if (inlineHeight == null) return;
            inlineHeight.value = event.nativeEvent.layout.height;
            measureOrigin();
          }}
          pointerEvents={pinned ? 'none' : 'auto'}
          accessibilityElementsHidden={pinned}
          importantForAccessibility={pinned ? 'no-hide-descendants' : 'auto'}
          style={inlineBannerStyle}
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
          completion={completion}
          opensTomorrow={calendar.opensTomorrow}
          isLocked={isPlanWeekLocked(week.week, isPro)}
          goldDays={goldDays}
          onOpenNode={openNode}
          onLockedPress={handleLockedPress}
          onPlace={placeWeek}
          onTrailPlaced={placeTrail}
          todayRef={todayRef}
        />
      ))}
      {fadeOnReveal.current ? <RevealCover shown={shown} /> : null}
      <PathDayCard
        content={liveContent}
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
  completion,
  opensTomorrow,
  isLocked,
  goldDays,
  onOpenNode,
  onLockedPress,
  onPlace,
  onTrailPlaced,
  todayRef,
}: {
  week: PlanCalendarWeek;
  index: number;
  enrollment: ProgramEnrollmentV3;
  completion?: PathDayCompletion;
  opensTomorrow: number | null;
  isLocked: boolean;
  goldDays: ReadonlySet<number>;
  onOpenNode: (measure: MeasureNode, card: NodeCard) => void;
  onLockedPress: () => void;
  onPlace: (index: number, top: number) => void;
  onTrailPlaced: (week: number) => void;
  todayRef?: (node: View | null) => void;
}) {
  const { planId, presetRevision } = enrollment;
  const preset = useMemo(
    () => programPresetRevision(planId, presetRevision),
    [planId, presetRevision],
  );
  const hue = weekHue(week.week);
  const lit: Tone = { face: hue.base, lip: hue.ink, icon: colors.text.inverse };
  const [pathWidth, setPathWidth] = useState(0);

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

  const trailPlaced = centres.filter((point) => point != null).length === week.days.length + 1;
  useEffect(() => {
    if (trailPlaced) onTrailPlaced(week.week);
  }, [trailPlaced, onTrailPlaced, week.week]);

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
      <View
        style={styles.path}
        onLayout={(event) => setPathWidth(event.nativeEvent.layout.width)}
      >
        <PathTrail points={centres} walked={walked} />
        {week.days.map((day, index) => {
          const offset = pathNodeOffset(index) * PATH_STEP;
          const done = day.state === 'done' || day.state === 'doneToday';
          const tone =
            isLocked || day.state === 'ahead'
              ? GREY
              : done && goldDays.has(day.day)
                ? GOLD
                : lit;

          return (
            <DayNode
              key={day.day}
              day={day}
              offset={offset}
              tone={tone}
              isLocked={isLocked}
              resetIcon={dayCoinIcon(preset, day.day)}
              lessonTitle={planLessonTitle(programDayLesson(enrollment, day.day))}
              pathWidth={pathWidth}
              accent={hue.ink}
              ring={day.state === 'today' && !isLocked ? hue.tint : undefined}
              onPlace={(point) => placeNode(index, point)}
              todayRef={todayRef}
              onPress={
                isLocked
                  ? onLockedPress
                  : (measure) =>
                      onOpenNode(measure, {
                        day: day.day,
                        detail: detailForDay(enrollment, day, opensTomorrow, completion),
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

function detailForDay(
  enrollment: ProgramEnrollmentV3,
  day: PlanCalendarDay,
  opensTomorrow: number | null,
  completion?: PathDayCompletion,
) {
  const preset = programPresetRevision(enrollment.planId, enrollment.presetRevision);
  return pathDayDetail({
    day: day.day,
    state: day.state,
    exercises: dayExercises(preset, day.day),
    lesson: day.state === 'ahead' ? null : programDayLesson(enrollment, day.day),
    weekPurpose: planWeekPurpose(enrollment.planId, Math.ceil(day.day / 7)),
    opensTomorrow: day.day === opensTomorrow,
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
  onPlace,
  todayRef,
  onPress,
  resetIcon,
  lessonTitle,
  pathWidth,
  accent,
  ring,
}: {
  day: PlanCalendarDay;
  offset: number;
  tone: Tone;
  resetIcon: IconName;
  lessonTitle: string;
  pathWidth: number;
  accent: string;
  /** Rings the coin to tap next. */
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
          ? `Day ${day.day}, ${lessonTitle}, locked. Subscribe to Azora Pro to unlock it`
          : `Day ${day.day}, ${lessonTitle}, ${DAY_STATE_LABEL[day.state]}`
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
      <NodeCaption
        eyebrow={`DAY ${day.day}`}
        title={lessonTitle}
        size={size}
        offset={offset}
        pathWidth={pathWidth}
        muted={isLocked || day.state === 'ahead'}
        accent={today ? accent : undefined}
      />
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
  pathWidth,
  onPlace,
  onPress,
}: {
  week: number;
  done: boolean;
  tone: Tone;
  isLocked: boolean;
  pathWidth: number;
  onPlace: (point: TrailPoint) => void;
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
      <Text
        numberOfLines={2}
        ellipsizeMode="tail"
        style={[
          styles.captionTitle,
          { textAlign },
          muted && styles.captionMuted,
          accent != null && { color: accent },
        ]}
      >
        {title}
      </Text>
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
function PathTrail({ points, walked }: {
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
      const midY = (from.y + to.y) / 2;
      const target = walked[index] ? roadPath : aheadPath;
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

/**
 * The screen's own canvas over the path, lifting as the path reveals itself.
 * Kept from re-rendering, so its animated opacity is never handed a stale value.
 */
const RevealCover = memo(function RevealCover({ shown }: { shown: SharedValue<number> }) {
  const coverStyle = useAnimatedStyle(() => ({ opacity: 1 - shown.value }));
  return <Animated.View pointerEvents="none" style={[styles.cover, coverStyle]} />;
});

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
  unplaced: {
    opacity: 0,
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.canvas,
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
    ...typography.label.small,
    color: colors.text.primary,
  },
  captionMuted: {
    color: colors.text.secondary,
  },
});
