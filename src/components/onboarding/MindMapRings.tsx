import { Text } from '../common/Text';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { Easing, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Icon from '../common/icons/Icon';
import type { IconName } from '../common/icons/paths';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import type { MindMapAxis, MindMapScore } from '../../lib/onboardingScores';
import { planChangeLabel } from '../../lib/paywallPersonalization';

interface MindMapRingsProps {
  scores: MindMapScore[];
  /** Where the plan is headed, drawn as a lighter arc behind each score. */
  targetScores?: MindMapScore[];
}

interface MindMapRingProps {
  score: MindMapScore;
  target?: number;
  size: number;
}

interface LegendItemProps {
  label: string;
  color: string;
  /** Ends the swatch in the goal marker, as the goal arc ends in one. */
  marked?: boolean;
}

const RINGS_PER_ROW = 2;
const MAX_RING_SIZE = 144;
const TRACK_WIDTH = 10;
const DISC_INSET = 6;
const ICON_SIZE = 28;
const SWEEP_DURATION_MS = 900;
const DOING_WELL_THRESHOLD = 60;
const LEGEND_SWATCH_WIDTH = 22;
const GOAL_MARKER_BORDER = 3;
const GOAL_MARKER_RADIUS = TRACK_WIDTH / 2 + 1;
/**
 * How far the marker, border included, pokes past the ring's edge. The canvas
 * bleeds out by this much so the marker is never clipped and the ring itself
 * stays the same size with or without a goal.
 */
const CANVAS_BLEED = GOAL_MARKER_RADIUS + GOAL_MARKER_BORDER / 2 - TRACK_WIDTH / 2;
const GOAL_MARKER_FADE_MS = 250;

const AXIS_ICON: Record<MindMapAxis, IconName> = {
  calm: 'lotus',
  recovery: 'bed-clock',
  focus: 'mood-focus',
  mood: 'face-happy',
  vitality: 'coffee-outline',
};

const RING_TONE = {
  disc: colors.primary.blue100,
  track: colors.primary.blue200,
  /** Grey under a goal, so the pale goal arc reads against it rather than into it. */
  planTrack: colors.neutral[200],
  arc: colors.primary.blue500,
  targetArc: colors.primary.blue300,
  pill: colors.primary.blue600,
  goalMarker: colors.primary.blue600,
  goalMarkerFill: colors.background.card,
};

function ringStatus(value: number): string {
  return value >= DOING_WELL_THRESHOLD ? 'Doing well' : 'Could be better';
}

function MindMapRing({ score, target, size }: MindMapRingProps) {
  const center = size / 2 + CANVAS_BLEED;
  const arcRadius = size / 2 - TRACK_WIDTH / 2;
  const discRadius = arcRadius - TRACK_WIDTH / 2 - DISC_INSET;

  const arcPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc(
      Skia.XYWHRect(center - arcRadius, center - arcRadius, arcRadius * 2, arcRadius * 2),
      -90,
      360,
    );
    return path;
  }, [arcRadius, center]);

  const goalAngle = (((target ?? 0) / 100) * 360 - 90) * (Math.PI / 180);
  const goalX = center + arcRadius * Math.cos(goalAngle);
  const goalY = center + arcRadius * Math.sin(goalAngle);

  const sweep = useSharedValue(0);
  const targetSweep = useSharedValue(0);
  const markerOpacity = useSharedValue(0);
  useEffect(() => {
    const timing = { duration: SWEEP_DURATION_MS, easing: Easing.out(Easing.cubic) };
    sweep.value = withTiming(score.value / 100, timing);
    targetSweep.value = withTiming((target ?? 0) / 100, timing);
    markerOpacity.value = withDelay(
      SWEEP_DURATION_MS,
      withTiming(1, { duration: GOAL_MARKER_FADE_MS }),
    );
  }, [markerOpacity, score.value, sweep, target, targetSweep]);

  return (
    <View style={[styles.ring, { width: size, height: size }]}>
      <Canvas style={styles.canvas}>
        <Circle
          cx={center}
          cy={center}
          r={arcRadius}
          style="stroke"
          strokeWidth={TRACK_WIDTH}
          color={target != null ? RING_TONE.planTrack : RING_TONE.track}
        />
        {target != null && (
          <Path
            path={arcPath}
            end={targetSweep}
            style="stroke"
            strokeWidth={TRACK_WIDTH}
            strokeCap="round"
            color={RING_TONE.targetArc}
          />
        )}
        <Path
          path={arcPath}
          end={sweep}
          style="stroke"
          strokeWidth={TRACK_WIDTH}
          strokeCap="round"
          color={RING_TONE.arc}
        />
        {target != null && (
          <Group opacity={markerOpacity}>
            <Circle cx={goalX} cy={goalY} r={GOAL_MARKER_RADIUS} color={RING_TONE.goalMarkerFill} />
            <Circle
              cx={goalX}
              cy={goalY}
              r={GOAL_MARKER_RADIUS}
              style="stroke"
              strokeWidth={GOAL_MARKER_BORDER}
              color={RING_TONE.goalMarker}
            />
          </Group>
        )}
        <Circle cx={center} cy={center} r={discRadius} color={RING_TONE.disc} />
      </Canvas>

      <View style={styles.ringCenter}>
        <Icon name={AXIS_ICON[score.axis]} size={ICON_SIZE} color={colors.text.primary} />
        <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
          {score.label}
        </Text>
      </View>

      <View style={styles.pill}>
        <Text style={styles.pillLabel} numberOfLines={1}>
          {target != null ? planChangeLabel(score.value) : ringStatus(score.value)}
        </Text>
      </View>
    </View>
  );
}

function LegendItem({ label, color, marked = false }: LegendItemProps) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]}>
        {marked && <View style={styles.legendMarker} />}
      </View>
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

export default function MindMapRings({ scores, targetScores }: MindMapRingsProps) {
  const [width, setWidth] = useState(0);
  const ringSize = Math.min(
    MAX_RING_SIZE,
    Math.floor((width - spacing.lg * (RINGS_PER_ROW - 1)) / RINGS_PER_ROW),
  );

  const rows: MindMapScore[][] = [];
  for (let i = 0; i < scores.length; i += RINGS_PER_ROW) {
    rows.push(scores.slice(i, i + RINGS_PER_ROW));
  }

  return (
    <View style={styles.grid} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {ringSize > 0 &&
        rows.map((row) => (
          <View key={row[0].axis} style={styles.row}>
            {row.map((score) => (
              <MindMapRing
                key={score.axis}
                score={score}
                target={targetScores?.find((t) => t.axis === score.axis)?.value}
                size={ringSize}
              />
            ))}
          </View>
        ))}
      {targetScores != null && (
        <View style={styles.legend}>
          <LegendItem label="How things feel today" color={RING_TONE.arc} />
          <LegendItem label="Your goal" color={RING_TONE.targetArc} marked />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.xl,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  ring: {
    alignItems: 'center',
    overflow: 'visible',
  },
  canvas: {
    position: 'absolute',
    top: -CANVAS_BLEED,
    right: -CANVAS_BLEED,
    bottom: -CANVAS_BLEED,
    left: -CANVAS_BLEED,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  label: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  pill: {
    position: 'absolute',
    bottom: -spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: RING_TONE.pill,
  },
  pillLabel: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    color: colors.text.inverse,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendSwatch: {
    width: LEGEND_SWATCH_WIDTH,
    height: TRACK_WIDTH,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  legendMarker: {
    width: TRACK_WIDTH + 2,
    height: TRACK_WIDTH + 2,
    marginRight: -1,
    borderRadius: radius.full,
    borderWidth: GOAL_MARKER_BORDER,
    borderColor: RING_TONE.goalMarker,
    backgroundColor: RING_TONE.goalMarkerFill,
  },
  legendLabel: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.text.secondary,
  },
});
