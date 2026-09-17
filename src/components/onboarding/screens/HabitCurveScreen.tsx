import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { Text } from '../../common/Text';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/card';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { chart, chartReveal, chartText, chartWrap } from '../chartTokens';

interface HabitCurveScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const CHART_HEIGHT = chart.height;
const PAD_LEFT = chart.padLeft;
const PAD_RIGHT = chart.padRight;
const PAD_TOP = chart.padTop;
const PAD_BOTTOM = chart.padBottom;
const TOP_INSET = chart.topInset;
const SAMPLE_COUNT = 64;


/** what members report at the end of the run — the number in the title */
const AZORA_PEAK_PERCENT = 72;
/** where the same twenty days land without a plan holding them together */
const ALONE_PEAK_PERCENT = 11;
const REPORTED_DAYS = 20;

/**
 * Both curves leave the same point, because day one is never the problem.
 * On their own people start, stall, and end the run roughly where they began.
 * With a plan the gain compounds and then plateaus, which is what a habit looks
 * like — it stops costing anything and stops climbing much either.
 *
 * The plan is the solid line and going it alone is the dashed reference, the
 * same relationship the other onboarding plots use: the line being shown is
 * drawn in full weight, the thing it is measured against is drawn thin.
 */
function aloneAt(unit: number): number {
  'worklet';
  return (ALONE_PEAK_PERCENT / AZORA_PEAK_PERCENT) * Math.sin((Math.PI / 2) * unit) * 0.9;
}

function withAzoraAt(unit: number): number {
  'worklet';
  return 1 - Math.exp(-2.6 * unit);
}

export default function HabitCurveScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: HabitCurveScreenProps) {
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);

  const handleChartLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setWidth((currentWidth) =>
      Math.abs(currentWidth - nextWidth) < 1 ? currentWidth : nextWidth,
    );
  }, []);

  useEffect(() => {
    if (width <= 0) return;
    progress.value = 0;
    progress.value = withDelay(
      chartReveal.delayMs,
      // Linear, because the x axis is time — an eased pen makes the curve look
      // like the weeks speed up.
      withTiming(1, { duration: chartReveal.durationMs, easing: Easing.linear }),
    );
  }, [progress, width]);

  const innerW = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const innerH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const curveY = (ratio: number) => {
    'worklet';
    return PAD_TOP + innerH - ratio * (innerH - TOP_INSET);
  };

  const buildCurve = (valueAt: (unit: number) => number) => {
    const p = Skia.Path.Make();
    if (innerW <= 0) return p;
    const points = Array.from({ length: SAMPLE_COUNT }, (_, i) => {
      const u = i / (SAMPLE_COUNT - 1);
      return { x: PAD_LEFT + u * innerW, y: curveY(valueAt(u)) };
    });

    // Catmull-Rom through the samples, converted to cubics, so the shoulders
    // round off instead of coming to a polyline point.
    p.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const previous = points[i - 1] ?? points[i];
      const current = points[i];
      const next = points[i + 1];
      const following = points[i + 2] ?? next;
      p.cubicTo(
        current.x + (next.x - previous.x) / 6,
        current.y + (next.y - previous.y) / 6,
        next.x - (following.x - current.x) / 6,
        next.y - (following.y - current.y) / 6,
        next.x,
        next.y,
      );
    }
    return p;
  };

  const azoraLine = useMemo(() => buildCurve(withAzoraAt), [innerW, innerH]);
  const aloneLine = useMemo(() => buildCurve(aloneAt), [innerW, innerH]);

  const azoraFill = useMemo(() => {
    if (innerW <= 0) return Skia.Path.Make();
    const p = azoraLine.copy();
    const baseline = PAD_TOP + innerH;
    p.lineTo(PAD_LEFT + innerW, baseline);
    p.lineTo(PAD_LEFT, baseline);
    p.close();
    return p;
  }, [azoraLine, innerW, innerH]);

  const axis = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(PAD_LEFT, PAD_TOP);
    p.lineTo(PAD_LEFT, PAD_TOP + innerH);
    p.lineTo(PAD_LEFT + innerW, PAD_TOP + innerH);
    return p;
  }, [innerW, innerH]);

  const revealClip = useDerivedValue(
    () =>
      Skia.XYWHRect(
        PAD_LEFT,
        0,
        Math.max(0, progress.value * innerW),
        CHART_HEIGHT,
      ),
    [innerW],
  );

  const headX = useDerivedValue(
    () => (innerW <= 0 ? 0 : PAD_LEFT + progress.value * innerW),
    [innerW],
  );
  const azoraHeadY = useDerivedValue(
    () => (innerW <= 0 ? 0 : curveY(withAzoraAt(progress.value))),
    [innerW, innerH],
  );
  const aloneHeadY = useDerivedValue(
    () => (innerW <= 0 ? 0 : curveY(aloneAt(progress.value))),
    [innerW, innerH],
  );

  // The numbers arrive as the pen reaches them, never before.
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value > 0.94 ? 1 : 0, { duration: 260 }),
  }));

  const azoraColor = chart.lineColor;
  const aloneColor = chart.referenceColor;

  return (
    <OnboardingScreenLayout
      title={`Azora users report feeling ${AZORA_PEAK_PERCENT}% better after ${REPORTED_DAYS} days.`}
      subtitle="Sticking to a plan is hard. Azora carries it, so all that is left for you is the next small reset."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.chartWrap}>
        <Text style={styles.yAxisLabel}>How much better members report feeling</Text>
        <View
          style={{ width: '100%', height: CHART_HEIGHT }}
          onLayout={handleChartLayout}
        >
          {width > 0 ? (
            <Canvas style={StyleSheet.absoluteFill}>
              <Path
                path={axis}
                style="stroke"
                strokeWidth={chart.axisWidth}
                strokeCap="round"
                strokeJoin="round"
                color={chart.axisColor}
              />

              <Group clip={revealClip}>
                <Path path={azoraFill} style="fill">
                  <LinearGradient
                    start={vec(0, PAD_TOP)}
                    end={vec(0, PAD_TOP + innerH)}
                    colors={[
                      `${azoraColor}${chart.fillOpacity.top}`,
                      `${azoraColor}${chart.fillOpacity.bottom}`,
                    ]}
                  />
                </Path>

                <Path
                  path={aloneLine}
                  style="stroke"
                  strokeWidth={chart.referenceWidth}
                  strokeCap="round"
                  strokeJoin="round"
                  color={aloneColor}
                >
                  <DashPathEffect intervals={chart.referenceDash} />
                </Path>

                <Path
                  path={azoraLine}
                  style="stroke"
                  strokeWidth={chart.lineWidth}
                  strokeCap="round"
                  strokeJoin="round"
                  color={azoraColor}
                />
              </Group>

              <Circle
                cx={headX}
                cy={aloneHeadY}
                r={chart.dotHaloRadius}
                color={colors.background.primary}
              />
              <Circle
                cx={headX}
                cy={aloneHeadY}
                r={chart.dotRadius}
                color={aloneColor}
              />
              <Circle
                cx={headX}
                cy={azoraHeadY}
                r={chart.dotHaloRadius}
                color={colors.background.primary}
              />
              <Circle
                cx={headX}
                cy={azoraHeadY}
                r={chart.dotRadius}
                color={azoraColor}
              />
            </Canvas>
          ) : null}

          <Reanimated.View style={[styles.peakBadge, badgeStyle]}>
            <Text style={[styles.peakValue, { color: chart.lineInk }]}>
              +{AZORA_PEAK_PERCENT}%
            </Text>
          </Reanimated.View>
          <Reanimated.View style={[styles.aloneBadge, badgeStyle]}>
            <Text
              style={[styles.peakValue, { color: chart.referenceInk }]}
            >
              +{ALONE_PEAK_PERCENT}%
            </Text>
          </Reanimated.View>
        </View>
        <Text style={styles.xAxisLabel}>Day 1 to day {REPORTED_DAYS}</Text>

        <View style={styles.legend}>
          <LegendKey color={azoraColor} label="With Azora" />
          <LegendKey color={aloneColor} label="On your own" dashed />
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

function LegendKey({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <View style={styles.legendKey}>
      <View
        style={[
          styles.legendSwatch,
          { backgroundColor: color },
          dashed && styles.legendSwatchReference,
        ]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrap,
  yAxisLabel: chartText.heading,
  xAxisLabel: chartText.axisLabel,
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  legendKey: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendSwatch: {
    width: 18,
    height: chart.lineWidth,
    borderRadius: radius.full,
  },
  // The reference series reads thinner in the key for the same reason it is
  // dashed in the plot.
  legendSwatchReference: {
    width: 14,
    height: chart.referenceWidth,
  },
  legendLabel: chartText.caption,
  peakBadge: {
    position: 'absolute',
    right: 0,
    top: chart.padTop,
  },
  aloneBadge: {
    position: 'absolute',
    right: 0,
    bottom: chart.padBottom,
  },
  peakValue: {
    ...chartText.heading,
    fontSize: 18,
  },
});
