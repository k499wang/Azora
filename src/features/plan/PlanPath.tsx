import {
  Fragment,
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
import { useNavigation } from '@react-navigation/native';
import { Canvas, DashPathEffect, Path, Skia } from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import type { IconName } from '../../components/common/icons/paths';
import { CHUNKY_LIP_DEPTH } from '../../components/common/ChunkyButton';
import type { MainTabNavigationProp } from '../../app/navigation';
import PathDayCard, { type PathDayCardContent, type PathNodeAnchor } from './PathDayCard';
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
import { lessonForDay } from '../lessons/domain/lessonCatalogue';
import {
  latestProgramPreset,
  PROGRAM_ACTIVITIES,
  programDayDefinition,
  type ProgramPresetRevision,
} from '../program/domain/programCatalogue';
import { card, coloredCard, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const DAY_NODE = spacing['6xl'];
const TODAY_NODE = Math.round(DAY_NODE * 1.2);
const ROOM_NODE = spacing['7xl'];
const HALO_GROWTH = spacing.md;
const PATH_STEP = spacing['3xl'];
const NODE_ICON = 36;
const ROOM_ICON = 48;
const BANNER_LOCK_ICON = 20;
const BUBBLE_MAX_WIDTH = 260;
const BUBBLE_TAIL = 14;
/** Keeps the tail clear of the bubble's rounded corners. */
const BUBBLE_TAIL_REACH = BUBBLE_MAX_WIDTH / 2 - spacing.xl;
/** About the tallest day card: a two-line title and action, and three exercises. */
const CARD_ROOM = 440;
const REVEAL_SETTLE_MS = 700;
const REVEAL_POLL_MS = 80;
const REVEAL_GRACE_MS = 120;
const TRAIL_WIDTH = spacing.sm;
const TRAIL_DOT_GAP = spacing.md;

type MeasureNode = () => Promise<PathNodeAnchor | null>;

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

interface Tone {
  face: string;
  lip: string;
  icon: string;
}

const GREY: Tone = {
  face: colors.neutral[200],
  lip: colors.neutral[300],
  icon: colors.neutral[400],
};

interface Props {
  calendar: Calendar;
  isPro?: boolean;
  onLockedWeekTap?: () => void;
  /** The first y on screen not covered by the screen's own chrome. */
  revealTop?: number;
  /** Scrolls the list holding the path, so a tapped node can be given room. */
  onScrollBy?: (dy: number) => void;
}

/**
 * The plan as a path: a banner per week, a node per day, a room at the end of
 * each week. A tapped node says what it is; the days themselves are done on Home.
 */
export default function PlanPath({
  calendar,
  isPro = true,
  onLockedWeekTap,
  revealTop,
  onScrollBy,
}: Props) {
  const navigation = useNavigation<MainTabNavigationProp<'Insights'>>();
  const window = useWindowDimensions();
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

      const roomBelow = window.height - (anchor.y + anchor.height);
      const roomAbove = anchor.y - (revealTop ?? 0);
      let placed = anchor;
      if (
        onScrollBy != null &&
        revealTop != null &&
        roomBelow < CARD_ROOM &&
        roomAbove < CARD_ROOM
      ) {
        onScrollBy(anchor.y - revealTop);
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
    [onScrollBy, revealTop, window.height],
  );

  const close = useCallback(() => setVisible(false), []);

  const goToToday = useCallback(() => {
    setVisible(false);
    navigation.navigate('Home');
  }, [navigation]);

  return (
    <View style={styles.list}>
      {calendar.weeks.map((week) => (
        <WeekSection
          key={week.week}
          week={week}
          planId={calendar.planId}
          opensTomorrow={calendar.opensTomorrow}
          isLocked={!isPro && week.week >= 2}
          onOpenNode={openNode}
          onLockedWeekTap={onLockedWeekTap}
        />
      ))}
      <PathDayCard
        content={content}
        visible={visible}
        onClose={close}
        onGoToToday={goToToday}
      />
    </View>
  );
}

const WeekSection = memo(function WeekSection({
  week,
  planId,
  opensTomorrow,
  isLocked,
  onOpenNode,
  onLockedWeekTap,
}: {
  week: PlanCalendarWeek;
  planId: Calendar['planId'];
  opensTomorrow: number | null;
  isLocked: boolean;
  onOpenNode: (measure: MeasureNode, card: NodeCard) => void;
  onLockedWeekTap?: () => void;
}) {
  const preset = useMemo(() => latestProgramPreset(planId), [planId]);
  const hue = colors.playful.sky;
  const purpose = planWeekPurpose(planId, week.week);
  const lit: Tone = { face: hue.base, lip: hue.ink, icon: colors.text.inverse };

  const handleLockedPress = useCallback(() => {
    triggerTapHaptic();
    onLockedWeekTap?.();
  }, [onLockedWeekTap]);

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
    <View style={styles.week}>
      <WeekBanner
        week={week}
        purpose={purpose}
        isLocked={isLocked}
        hue={isLocked ? colors.playful.stone : hue}
        onLockedPress={handleLockedPress}
      />
      <View style={styles.path}>
        <PathTrail points={centres} walked={walked} color={hue.base} />
        {week.days.map((day, index) => {
          const offset = pathNodeOffset(index) * PATH_STEP;
          const lesson =
            day.state === 'ahead' || isLocked ? null : lessonForDay(planId, day.day);

          return (
            <Fragment key={day.day}>
              {day.state === 'today' && lesson != null && !isLocked ? (
                <TodayBubble
                  eyebrow="Today"
                  title={lesson.title}
                  tailOffset={offset}
                  ink={hue.ink}
                />
              ) : null}
              {day.state === 'doneToday' && opensTomorrow != null && !isLocked ? (
                <TodayBubble
                  eyebrow="Done for today"
                  title={`Day ${opensTomorrow} unlocks tomorrow`}
                  tailOffset={offset}
                  ink={hue.ink}
                />
              ) : null}
              <DayNode
                day={day}
                offset={offset}
                tone={isLocked || day.state === 'ahead' ? GREY : lit}
                halo={hue.soft}
                isLocked={isLocked}
                onPlace={(point) => placeNode(index, point)}
                onPress={
                  isLocked
                    ? handleLockedPress
                    : (measure) =>
                        onOpenNode(measure, {
                          hue,
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
            </Fragment>
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
              ? handleLockedPress
              : (measure) =>
                  onOpenNode(measure, {
                    hue,
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
      <View style={[card.block, coloredCard(hue), styles.banner]}>
        <View style={styles.bannerText}>
          <Text style={styles.bannerEyebrow}>
            Week {week.week} · {week.phaseName}
          </Text>
          {purpose == null ? null : <Text style={styles.bannerPurpose}>{purpose}</Text>}
        </View>
        {isLocked ? (
          <Icon name="lock" size={BANNER_LOCK_ICON} color={colors.text.inverse} />
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Today's lesson, and only today's. Every title on the path turned it into a
 * list to read; one names the day on offer and leaves the rest to come back for.
 * Once today is finished it says when the next day opens instead.
 */
function TodayBubble({
  eyebrow,
  title,
  tailOffset,
  ink,
}: {
  eyebrow: string;
  title: string;
  tailOffset: number;
  ink: string;
}) {
  const tailX = Math.max(-BUBBLE_TAIL_REACH, Math.min(BUBBLE_TAIL_REACH, tailOffset));

  return (
    <View accessible accessibilityLabel={`${eyebrow}: ${title}`} style={styles.bubble}>
      <View style={[card.base, card.shadow, styles.bubbleBody]}>
        <Text style={[styles.bubbleEyebrow, { color: ink }]}>{eyebrow}</Text>
        <Text style={styles.bubbleTitle}>{title}</Text>
      </View>
      <View
        style={[
          styles.bubbleTail,
          { transform: [{ translateX: tailX }, { rotate: '45deg' }] },
        ]}
      />
    </View>
  );
}

function DayNode({
  day,
  offset,
  tone,
  halo,
  isLocked,
  onPlace,
  onPress,
}: {
  day: PlanCalendarDay;
  offset: number;
  tone: Tone;
  halo: string;
  isLocked: boolean;
  onPlace: (point: TrailPoint) => void;
  onPress: (measure: MeasureNode) => void;
}) {
  const today = day.state === 'today' && !isLocked;
  // Still the day on screen until the calendar turns, so it keeps its size.
  const current = (today || day.state === 'doneToday') && !isLocked;
  const icon: IconName = isLocked
    ? 'lock'
    : day.state === 'done' || day.state === 'doneToday'
      ? 'check-bold'
      : today
        ? 'star'
        : 'star-outline';

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={
        isLocked
          ? `Day ${day.day}, locked. Subscribe to Azora Pro to unlock it`
          : `Day ${day.day}, ${DAY_STATE_LABEL[day.state]}`
      }
      onLayout={(event) => onPlace(faceCentre(event, offset))}
      style={{ transform: [{ translateX: offset }] }}
    >
      {today ? <TodayHalo color={halo} /> : null}
      <LipCircle
        size={current ? TODAY_NODE : DAY_NODE}
        tone={tone}
        onPress={onPress}
      >
        <Icon name={icon} size={NODE_ICON} color={tone.icon} />
      </LipCircle>
    </View>
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
      <LipCircle
        size={ROOM_NODE}
        tone={tone}
        onPress={onPress}
      >
        <Icon name={isLocked ? 'lock' : 'room-hex'} size={ROOM_ICON} color={tone.icon} />
      </LipCircle>
    </View>
  );
}

/** Layout ignores the zigzag's translate, so the offset is added back; the lip sits below the face. */
function faceCentre(event: LayoutChangeEvent, offset: number): TrailPoint {
  const { x, y, width, height } = event.nativeEvent.layout;
  return { x: x + width / 2 + offset, y: y + (height - CHUNKY_LIP_DEPTH) / 2 };
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

/** ChunkyButton's face-on-a-lip as a circle that can say where it is when pressed. */
function LipCircle({
  size,
  tone,
  onPress,
  children,
}: {
  size: number;
  tone: Tone;
  onPress: (measure: MeasureNode) => void;
  children?: ReactNode;
}) {
  const ref = useRef<View>(null);

  const measure: MeasureNode = () =>
    new Promise((resolve) => {
      if (ref.current == null) {
        resolve(null);
        return;
      }
      ref.current.measureInWindow((x, y, width, height) =>
        resolve({ x, y, width, height }),
      );
    });

  const handlePress = () => onPress(measure);

  return (
    <Pressable onPress={handlePress}>
      {({ pressed }) => (
        <View ref={ref} style={[styles.lip, { width: size, backgroundColor: tone.lip }]}>
          <View
            style={[
              styles.face,
              { width: size, height: size, backgroundColor: tone.face },
              pressed && styles.facePressed,
            ]}
          >
            {children}
          </View>
        </View>
      )}
    </Pressable>
  );
}

function TodayHalo({ color }: { color: string }) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: duration.fill * 2, easing: easing.breathe }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse, reducedMotion]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.halo, { backgroundColor: color }, haloStyle]}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.xl,
  },
  week: {
    gap: spacing.lg,
  },
  banner: {
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
    color: colors.onBlock.textMuted,
  },
  bannerPurpose: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  path: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  lip: {
    borderRadius: radius.full,
    paddingBottom: CHUNKY_LIP_DEPTH,
  },
  face: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facePressed: {
    transform: [{ translateY: CHUNKY_LIP_DEPTH }],
  },
  halo: {
    position: 'absolute',
    top: -HALO_GROWTH / 2,
    left: -HALO_GROWTH / 2,
    width: TODAY_NODE + HALO_GROWTH,
    height: TODAY_NODE + HALO_GROWTH,
    borderRadius: radius.full,
  },
  room: {
    marginTop: spacing.sm,
  },
  bubble: {
    maxWidth: BUBBLE_MAX_WIDTH,
    alignItems: 'center',
  },
  bubbleBody: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    alignItems: 'center',
  },
  bubbleEyebrow: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
  },
  bubbleTitle: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  bubbleTail: {
    width: BUBBLE_TAIL,
    height: BUBBLE_TAIL,
    marginTop: -BUBBLE_TAIL / 2,
    backgroundColor: colors.background.card,
  },
});
