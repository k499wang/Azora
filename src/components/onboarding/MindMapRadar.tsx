import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import { card, radius as cardRadius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { easing, spring } from '../../theme/motion';
import { startUiTimer } from '../../lib/ui/uiThreadTimer';
import { triggerTapHaptic } from '../../native/tapHaptics';
import { FlashTwinkle } from '../common/RewardSparkles';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { MindMapAxis, MindMapScore } from '../../lib/onboardingScores';
import Icon from '../common/icons/Icon';
import type { IconName } from '../common/icons/paths';
import { Text } from '../common/Text';
import { getRadarLayout, type Point } from './mindMapRadarLayout';

interface MindMapRadarProps {
  scores: MindMapScore[];
  /** Where the plan is headed, drawn as a lighter shape behind the scores. */
  targetScores: MindMapScore[];
  /**
   * Flipping this on grows the goal out of today's shape; off shrinks it back.
   * The radar stays mounted across the flip, so the pentagon never moves.
   */
  showTarget: boolean;
  size: number;
}

const AXIS_ICON: Record<MindMapAxis, IconName> = {
  calm: 'lotus',
  recovery: 'bed-clock',
  focus: 'mood-focus',
  mood: 'face-happy',
  vitality: 'coffee-outline',
};

/** each corner in its own colour, so the five read as five things, not one list */
const AXIS_HUE = {
  calm: colors.playful.teal,
  recovery: colors.playful.violet,
  focus: colors.playful.sky,
  mood: colors.playful.amber,
  vitality: colors.playful.coral,
} satisfies Record<
  MindMapAxis,
  { soft: string; tint: string; mid: string; base: string; ink: string }
>;

const FRAME_STROKE = 2;
/** the darker pentagon the frame rests on, like a button on its lip */
const FRAME_LIP = 5;
const FRAME_CORNER = 18;
/** faint rings in place of spokes; shares of the frame, decoration only */
const RING_SHARES = [0.38, 0.69] as const;
const RING_STROKE = 1.5;
const SHAPE_CORNER = 10;
const SHAPE_OUTLINE = 3;
/** today, once the goal has grown around it */
const GHOST_FILL_OPACITY = 0.18;
const CHIP_ICON_SIZE = 14;
const GROW_MS = 800;
/**
 * The goal grows one corner after another, each on `spring.pop`'s overshoot, and
 * each pops a star as it peaks.
 */
const CORNER_STAGGER_MS = 110;
const STAR_SIZE = 22;
const SPRING_FREQUENCY = Math.sqrt(spring.pop.stiffness / spring.pop.mass);
const SPRING_DAMPING_RATIO =
  spring.pop.damping / (2 * Math.sqrt(spring.pop.stiffness * spring.pop.mass));
const SPRING_RINGING =
  SPRING_FREQUENCY * Math.sqrt(1 - SPRING_DAMPING_RATIO * SPRING_DAMPING_RATIO);
/** when a corner is furthest past its goal: its star's moment */
const CORNER_PEAK_MS = (1000 * Math.PI) / SPRING_RINGING;
/** long enough for the last corner's wobble to die out */
const CORNER_SETTLE_MS = 5000 / (SPRING_DAMPING_RATIO * SPRING_FREQUENCY);

/** `spring.pop` from rest to 1, `ms` after it starts; one clock drives every corner. */
function springAt(ms: number): number {
  'worklet';
  if (ms <= 0) return 0;
  const t = ms / 1000;
  const decay = Math.exp(-SPRING_DAMPING_RATIO * SPRING_FREQUENCY * t);
  return (
    1 -
    decay *
      (Math.cos(SPRING_RINGING * t) +
        ((SPRING_DAMPING_RATIO * SPRING_FREQUENCY) / SPRING_RINGING) *
          Math.sin(SPRING_RINGING * t))
  );
}
/**
 * Scores are drawn on a curved scale rather than a straight one, so a middling
 * score sits well inside the frame and the goal visibly pushes out from it. The
 * same scale draws both shapes, and no numbers are shown against it. The floor
 * keeps the lowest score a shape rather than a dot at the centre.
 */
const RADAR_CURVE = 2.6;
const RADAR_FLOOR = 0.06;

function drawnShare(value: number): number {
  const clamped = Math.max(0, Math.min(100, value)) / 100;
  return RADAR_FLOOR + (1 - RADAR_FLOOR) * clamped ** RADAR_CURVE;
}
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

/** where corner `i` sits `t` of the way from today to the goal */
function between(today: Point[], goal: Point[], t: number[]): Point[] {
  'worklet';
  return today.map((point, i) => ({
    x: point.x + (goal[i].x - point.x) * t[i],
    y: point.y + (goal[i].y - point.y) * t[i],
  }));
}

/** Where corner `i` starts and ends its curve: `radius` back along each edge. */
function cornerEnds(points: Point[], i: number, radius: number) {
  'worklet';
  const n = points.length;
  const previous = points[(i - 1 + n) % n];
  const corner = points[i];
  const next = points[(i + 1) % n];
  const inLength = Math.max(0.001, Math.hypot(corner.x - previous.x, corner.y - previous.y));
  const outLength = Math.max(0.001, Math.hypot(next.x - corner.x, next.y - corner.y));
  const r = Math.min(radius, inLength / 2, outLength / 2);
  return {
    start: {
      x: corner.x + ((previous.x - corner.x) * r) / inLength,
      y: corner.y + ((previous.y - corner.y) * r) / inLength,
    },
    end: {
      x: corner.x + ((next.x - corner.x) * r) / outLength,
      y: corner.y + ((next.y - corner.y) * r) / outLength,
    },
  };
}

/** A polygon with its corners rounded off, like a cushion rather than a star. */
function roundedPath(points: Point[], radius: number): string {
  'worklet';
  let d = '';
  for (let i = 0; i < points.length; i++) {
    const { start, end } = cornerEnds(points, i, radius);
    d += `${i === 0 ? 'M' : 'L'}${start.x},${start.y} Q${points[i].x},${points[i].y} ${end.x},${end.y} `;
  }
  return `${d}Z`;
}

/**
 * Corner `i`'s slice of the rounded shape: from the centre out to the middle of
 * each edge either side of it. The five slices tile the shape exactly, so each
 * corner can carry its own colour.
 */
function slicePath(points: Point[], i: number, centre: Point, radius: number): string {
  'worklet';
  const n = points.length;
  const previous = points[(i - 1 + n) % n];
  const corner = points[i];
  const next = points[(i + 1) % n];
  const { start, end } = cornerEnds(points, i, radius);
  return (
    `M${centre.x},${centre.y} ` +
    `L${(previous.x + corner.x) / 2},${(previous.y + corner.y) / 2} ` +
    `L${start.x},${start.y} Q${corner.x},${corner.y} ${end.x},${end.y} ` +
    `L${(corner.x + next.x) / 2},${(corner.y + next.y) / 2} Z`
  );
}

function scaledToward(points: Point[], centre: Point, share: number): Point[] {
  return points.map((point) => ({
    x: centre.x + (point.x - centre.x) * share,
    y: centre.y + (point.y - centre.y) * share,
  }));
}

/**
 * The five scores as a rounded shape inside a cushioned pentagon, each corner
 * named by a chip in its own colour.
 *
 * Both shapes are five slices, one per corner in the colour of that corner's
 * chip. The goal grows out of today, and today fades to a soft shadow inside it.
 * There is no key: the title above names the phase, and grey against colour
 * says which shape is which.
 */
export default function MindMapRadar({
  scores,
  targetScores,
  showTarget,
  size,
}: MindMapRadarProps) {
  const layout = getRadarLayout(size, scores.length);
  const { center, vertices, scale } = layout;
  const shapeFor = (values: MindMapScore[]) =>
    vertices.map((vertex, i) => {
      const share = drawnShare(values[i]?.value ?? 0);
      return {
        x: center.x + (vertex.x - center.x) * share,
        y: center.y + (vertex.y - center.y) * share,
      };
    });
  const today = shapeFor(scores);
  const goal = shapeFor(targetScores);

  const reducedMotion = useReducedMotion();
  const cornerCount = scores.length;
  const growTotalMs = (cornerCount - 1) * CORNER_STAGGER_MS + CORNER_SETTLE_MS;
  // Starts where the screen already is, so only a flip while mounted animates.
  // `clock` runs the corners out one after another; `kept` takes the goal back.
  const clock = useSharedValue(showTarget ? growTotalMs : 0);
  const kept = useSharedValue(showTarget ? 1 : 0);
  const wasShowingTarget = useRef(showTarget);
  /** each flip to the goal replays the stars, so they are keyed by it */
  const [reveals, setReveals] = useState(0);
  useEffect(() => {
    const flippedOn = showTarget && !wasShowingTarget.current;
    wasShowingTarget.current = showTarget;
    if (reducedMotion) {
      clock.value = showTarget ? growTotalMs : 0;
      kept.value = showTarget ? 1 : 0;
      return;
    }
    if (!showTarget) {
      kept.value = withTiming(0, { duration: GROW_MS, easing: easing.exit });
      return;
    }
    if (!flippedOn) return;

    kept.value = 1;
    clock.value = 0;
    clock.value = withTiming(growTotalMs, { duration: growTotalMs, easing: Easing.linear });
    setReveals((count) => count + 1);
    const cancels = Array.from({ length: cornerCount }, (_, corner) =>
      startUiTimer(corner * CORNER_STAGGER_MS + CORNER_PEAK_MS, triggerTapHaptic),
    );
    return () => cancels.forEach((cancel) => cancel());
  }, [clock, cornerCount, growTotalMs, kept, reducedMotion, showTarget]);

  /** how far each corner has grown from today toward the goal */
  const cornerGrowth = useDerivedValue(() =>
    today.map((_, i) => springAt(clock.value - i * CORNER_STAGGER_MS) * kept.value),
  );
  const grown = useDerivedValue(
    () => cornerGrowth.value.reduce((sum, t) => sum + t, 0) / today.length,
  );
  const shapeCorner = SHAPE_CORNER * scale;

  const outlineProps = useAnimatedProps(() => ({
    d: roundedPath(between(today, goal, cornerGrowth.value), shapeCorner),
    // Hidden until it has left today's outline, so two edges never shimmer on
    // top of each other.
    opacity: Math.min(1, grown.value * 4),
  }));
  const todayProps = useAnimatedProps(() => ({
    opacity: 1 - Math.min(1, grown.value * 1.5),
  }));

  const frameCorner = FRAME_CORNER * scale;
  const lip = FRAME_LIP * scale;

  return (
    <View style={styles.root}>
      <View style={{ width: size, height: layout.height }}>
        <Svg width={size} height={layout.height}>
          <Path
            d={roundedPath(vertices.map((v) => ({ x: v.x, y: v.y + lip })), frameCorner)}
            fill={colors.neutral[300]}
          />
          <Path
            d={roundedPath(vertices, frameCorner)}
            fill={colors.background.card}
            stroke={colors.neutral[200]}
            strokeWidth={FRAME_STROKE * scale}
          />
          {RING_SHARES.map((share) => (
            <Path
              key={share}
              d={roundedPath(scaledToward(vertices, center, share), frameCorner * share)}
              fill="none"
              stroke={colors.neutral[200]}
              strokeWidth={RING_STROKE * scale}
            />
          ))}
          {scores.map((score, i) => (
            <GoalSlice
              key={score.axis}
              index={i}
              today={today}
              goal={goal}
              centre={center}
              corner={shapeCorner}
              growth={cornerGrowth}
              grown={grown}
              color={AXIS_HUE[score.axis].mid}
            />
          ))}
          <AnimatedPath
            animatedProps={outlineProps}
            fill="none"
            stroke={colors.background.card}
            strokeWidth={SHAPE_OUTLINE * scale}
          />
          <Path
            d={roundedPath(today, shapeCorner)}
            fill={colors.neutral[700]}
            fillOpacity={GHOST_FILL_OPACITY}
          />
          <AnimatedG animatedProps={todayProps}>
            {scores.map((score, i) => (
              <Path
                key={score.axis}
                d={slicePath(today, i, center, shapeCorner)}
                fill={AXIS_HUE[score.axis].mid}
              />
            ))}
            <Path
              d={roundedPath(today, shapeCorner)}
              fill="none"
              stroke={colors.background.card}
              strokeWidth={SHAPE_OUTLINE * scale}
            />
          </AnimatedG>
        </Svg>

        {scores.map((score, i) => {
          const chip = layout.chips[i];
          return (
            <View
              key={score.axis}
              pointerEvents="none"
              style={[
                styles.chipSlot,
                {
                  left: chip.left,
                  top: chip.top,
                  width: layout.chipWidth,
                  height: layout.chipHeight,
                  alignItems: chip.align,
                },
              ]}
            >
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: AXIS_HUE[score.axis].soft,
                    borderColor: AXIS_HUE[score.axis].tint,
                  },
                ]}
              >
                <Icon
                  name={AXIS_ICON[score.axis]}
                  size={CHIP_ICON_SIZE * scale}
                  color={AXIS_HUE[score.axis].ink}
                />
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      fontSize: 13 * scale,
                      lineHeight: 16 * scale,
                      color: AXIS_HUE[score.axis].ink,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {score.label}
                </Text>
              </View>
            </View>
          );
        })}
        {reveals === 0 || reducedMotion
          ? null
          : goal.map((point, corner) => (
              <FlashTwinkle
                key={`${reveals}-${corner}`}
                x={point.x}
                y={point.y}
                size={STAR_SIZE * scale}
                color={AXIS_HUE[scores[corner].axis].base}
                delay={corner * CORNER_STAGGER_MS + CORNER_PEAK_MS}
              />
            ))}
      </View>
    </View>
  );
}

interface CornerProps {
  index: number;
  today: Point[];
  goal: Point[];
  growth: SharedValue<number[]>;
}

/** One corner's slice of the goal, in that corner's colour. */
function GoalSlice({
  index,
  today,
  goal,
  centre,
  corner,
  growth,
  grown,
  color,
}: CornerProps & { centre: Point; corner: number; grown: SharedValue<number>; color: string }) {
  const animatedProps = useAnimatedProps(() => ({
    d: slicePath(between(today, goal, growth.value), index, centre, corner),
    opacity: Math.min(1, grown.value * 4),
  }));

  return <AnimatedPath animatedProps={animatedProps} fill={color} />;
}


const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.md,
  },
  chipSlot: {
    position: 'absolute',
    justifyContent: 'center',
  },
  chip: {
    ...card.base,
    ...card.shadow,
    borderRadius: cardRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: '100%',
    paddingHorizontal: spacing.sm,
  },
  chipLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
});
