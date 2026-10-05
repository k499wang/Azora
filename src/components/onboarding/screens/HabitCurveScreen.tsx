import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  DashPathEffect,
  Group,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { Text } from '../../common/Text';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/card';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { chart, chartReveal, chartText, chartWrap } from '../chartTokens';
import { createChartArrow } from '../chartArrow';
import { FEEL_BETTER_DAYS, FEEL_BETTER_PERCENT } from '../../../data/socialProof';

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


/** where the same twenty days land without a plan holding them together */
const ALONE_PEAK_PERCENT = 11;

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
  return (ALONE_PEAK_PERCENT / FEEL_BETTER_PERCENT) * Math.sin((Math.PI / 2) * unit) * 0.9;
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
    return () => cancelAnimation(progress);
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

  const arrowHead = useDerivedValue(() => {
    if (innerW <= 0) return Skia.Path.Make();
    const unit = progress.value;
    const x = PAD_LEFT + unit * innerW;
    const y = curveY(withAzoraAt(unit));
    const angle = Math.atan2(
      -(innerH - TOP_INSET) * 2.6 * Math.exp(-2.6 * unit),
      innerW,
    );
    return createChartArrow(x, y, angle);
  }, [innerW, innerH]);

  const arrowOpacity = useDerivedValue(() => (progress.value > 0 ? 1 : 0));

  const azoraColor = chart.lineColor;
  const aloneColor = chart.referenceColor;

  return (
    <OnboardingScreenLayout
      title={`Azora users report feeling ${FEEL_BETTER_PERCENT}% better after ${FEEL_BETTER_DAYS} days.`}
      subtitle="Sticking to a plan is hard. Azora carries it, so all that is left for you is the next small step."
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

              <Path
                path={arrowHead}
                style="fill"
                color={azoraColor}
                opacity={arrowOpacity}
              />
            </Canvas>
          ) : null}
        </View>
        <Text style={styles.xAxisLabel}>Day 1 to day {FEEL_BETTER_DAYS}</Text>

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
});
