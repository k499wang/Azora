import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Line, LinearGradient, Path, Polygon, Stop } from 'react-native-svg';
import { card, radius as cardRadius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { duration, easing } from '../../theme/motion';
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

const FRAME_STROKE = 4;
const SPOKE_STROKE = 1.25;
const SCORE_STROKE = 2.5;
const CHIP_ICON_SIZE = 14;
const TARGET_DASH = '6,5';
const SHAPE_FILL_OPACITY = 0.6;
const LEGEND_SWATCH = { width: 22, height: 10 };
const GROW_MS = 800;
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
/** The key follows the goal once it has mostly grown, so it names what just happened. */
const LEGEND_DELAY_MS = 450;

const AnimatedPath = Animated.createAnimatedComponent(Path);

function toPoints(points: Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

/**
 * The five scores as a filled shape inside a pentagon frame, each corner named
 * by a chip.
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
  // Starts where the screen already is, so only a flip while mounted animates.
  const growth = useSharedValue(showTarget ? 1 : 0);

  useEffect(() => {
    const to = showTarget ? 1 : 0;
    growth.value = reducedMotion
      ? to
      : withTiming(to, {
          duration: GROW_MS,
          easing: showTarget ? easing.settle : easing.exit,
        });
  }, [growth, reducedMotion, showTarget]);

  const goalProps = useAnimatedProps(() => {
    const t = growth.value;
    let d = '';
    for (let i = 0; i < today.length; i++) {
      const x = today[i].x + (goal[i].x - today[i].x) * t;
      const y = today[i].y + (goal[i].y - today[i].y) * t;
      d += `${i === 0 ? 'M' : 'L'}${x},${y} `;
    }
    return {
      d: `${d}Z`,
      // Invisible until it has left today's outline, so a dashed edge never
      // flickers on top of the solid one.
      opacity: Math.min(1, t * 4),
    };
  });

  return (
    <View style={styles.root}>
      <View style={{ width: size, height: layout.height }}>
        <Svg width={size} height={layout.height}>
          <Defs>
            <LinearGradient id="radarFrameFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.background.card} />
              <Stop offset="1" stopColor={colors.neutral[100]} />
            </LinearGradient>
          </Defs>
          <Polygon
            points={toPoints(vertices)}
            fill="url(#radarFrameFill)"
            stroke={colors.neutral[200]}
            strokeWidth={FRAME_STROKE * scale}
            strokeLinejoin="round"
          />
          {vertices.map((vertex, i) => (
            <Line
              key={`spoke-${i}`}
              x1={center.x}
              y1={center.y}
              x2={vertex.x}
              y2={vertex.y}
              stroke={colors.neutral[200]}
              strokeWidth={SPOKE_STROKE * scale}
            />
          ))}
          <AnimatedPath
            animatedProps={goalProps}
            fill={colors.primary.blue200}
            fillOpacity={SHAPE_FILL_OPACITY}
            stroke={colors.primary.blue300}
            strokeWidth={SCORE_STROKE * scale}
            strokeLinejoin="round"
            strokeDasharray={TARGET_DASH}
          />
          <Polygon
            points={toPoints(today)}
            fill={colors.primary.blue300}
            fillOpacity={SHAPE_FILL_OPACITY}
            stroke={colors.primary.blue500}
            strokeWidth={SCORE_STROKE * scale}
            strokeLinejoin="round"
          />
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
              <View style={styles.chip}>
                <Icon
                  name={AXIS_ICON[score.axis]}
                  size={CHIP_ICON_SIZE * scale}
                  color={colors.primary.blue500}
                />
                <Text
                  style={[styles.chipLabel, { fontSize: 13 * scale, lineHeight: 16 * scale }]}
                  numberOfLines={1}
                >
                  {score.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      {showTarget ? (
        <Animated.View
          style={styles.legend}
          entering={FadeIn.delay(LEGEND_DELAY_MS).duration(duration.base)}
          exiting={FadeOut.duration(duration.fast)}
        >
          <LegendItem label="How things feel today" color={colors.primary.blue500} />
          <LegendItem label="Your goal" color={colors.primary.blue300} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.md,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendSwatch: {
    ...LEGEND_SWATCH,
    borderRadius: cardRadius.full,
  },
  legendLabel: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
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
