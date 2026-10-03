import {
  memo,
  useCallback,
  useEffect,
  useMemo,
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
import LipCircle, { CoinIcon, type LipTone as Tone, type MeasureNode } from './LipCircle';
import PathDayCard, { type PathDayCardContent } from './PathDayCard';
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
import type { AttentionScriptId } from '../attention/domain/attentionScripts';
import { getTechnique } from '../exercise/guidedBreathing/techniques';
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
import { card, coloredCard } from '../../theme/card';
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
const NODE_ICON = 36;
const ROOM_ICON = 48;
const BANNER_LOCK_ICON = 20;
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
}

/**
 * The plan as a path: a banner per week, a node per day, a room at the end of
 * each week. A tapped node says what it is; the days themselves are done on Home.
 */
export default function PlanPath({
  calendar,
  enrollment,
  isPro = true,
  onLockedWeekTap,
  revealTop,
  onScrollBy,
  todayRef,
}: Props) {
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

  return (
    <View style={styles.list}>
      {calendar.weeks.map((week) => (
        <WeekSection
          key={week.week}
          week={week}
          enrollment={enrollment}
          opensTomorrow={calendar.opensTomorrow}
          isLocked={!isPro && week.week >= 2}
          onOpenNode={openNode}
          onLockedWeekTap={onLockedWeekTap}
          todayRef={todayRef}
        />
      ))}
      <PathDayCard
        content={content}
        visible={visible}
        onClose={close}
      />
    </View>
  );
}

const WeekSection = memo(function WeekSection({
  week,
  enrollment,
  opensTomorrow,
  isLocked,
  onOpenNode,
  onLockedWeekTap,
  todayRef,
}: {
  week: PlanCalendarWeek;
  enrollment: ProgramEnrollmentV3;
  opensTomorrow: number | null;
  isLocked: boolean;
  onOpenNode: (measure: MeasureNode, card: NodeCard) => void;
  onLockedWeekTap?: () => void;
  todayRef?: (node: View | null) => void;
}) {
  const { planId, presetRevision } = enrollment;
  const preset = useMemo(
    () => programPresetRevision(planId, presetRevision),
    [planId, presetRevision],
  );
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
            day.state === 'ahead' || isLocked ? null : programDayLesson(enrollment, day.day);

          return (
            <DayNode
              key={day.day}
              day={day}
              offset={offset}
              tone={isLocked || day.state === 'ahead' ? GREY : lit}
              isLocked={isLocked}
              resetIcon={dayResetIcon(preset, day.day)}
              onPlace={(point) => placeNode(index, point)}
              todayRef={todayRef}
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

const ATTENTION_ICON: Record<AttentionScriptId, IconName> = {
  '54321': 'todo-grounding',
  'muscle-release': 'yoga',
};

/** What the day's Reset looks like on its coin, so the path reads as a mix of practices. */
function dayResetIcon(preset: ProgramPresetRevision | null, day: number): IconName {
  if (preset == null) return 'star';
  const activities = (programDayDefinition(preset, day)?.activityIds ?? []).flatMap((id) => {
    const activity = PROGRAM_ACTIVITIES.get(id);
    return activity == null ? [] : [activity];
  });
  const reset = activities.find((activity) => activity.delivery.modality !== 'lesson');
  switch (reset?.delivery.modality) {
    case 'breathing':
      return getTechnique(reset.delivery.techniqueId)?.icon ?? 'star';
    case 'attention':
      return ATTENTION_ICON[reset.delivery.scriptId];
    case 'reflection':
      return 'pencil';
    default:
      return activities.length > 0 ? 'book' : 'star';
  }
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

function DayNode({
  day,
  offset,
  tone,
  isLocked,
  onPlace,
  todayRef,
  onPress,
  resetIcon,
}: {
  day: PlanCalendarDay;
  offset: number;
  tone: Tone;
  resetIcon: IconName;
  isLocked: boolean;
  onPlace: (point: TrailPoint) => void;
  todayRef?: (node: View | null) => void;
  onPress: (measure: MeasureNode) => void;
}) {
  const today = day.state === 'today' && !isLocked;
  // Still the day on screen until the calendar turns, so it keeps its size.
  const current = (today || day.state === 'doneToday') && !isLocked;
  const icon: IconName = isLocked
    ? 'lock'
    : day.state === 'done' || day.state === 'doneToday'
      ? 'check-bold'
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
      style={{ transform: [{ translateX: offset }] }}
    >
      <Hop active={today}>
        <LipCircle
          size={current ? TODAY_NODE : DAY_NODE}
          aspect={COIN_ASPECT}
          depth={COIN_DEPTH}
          tone={tone}
          onPress={onPress}
        >
          <CoinIcon name={icon} size={NODE_ICON} tone={tone} />
        </LipCircle>
      </Hop>
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
        aspect={COIN_ASPECT}
        depth={COIN_DEPTH}
        tone={tone}
        onPress={onPress}
      >
        <CoinIcon name={isLocked ? 'lock' : 'room-hex'} size={ROOM_ICON} tone={tone} />
      </LipCircle>
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

  useEffect(() => {
    if (!active || reducedMotion) return;
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
    textTransform: 'uppercase',
    letterSpacing: typography.overline.letterSpacing,
    color: colors.onBlock.textMuted,
  },
  bannerPurpose: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  path: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  room: {
    marginTop: spacing.sm,
  },
});
