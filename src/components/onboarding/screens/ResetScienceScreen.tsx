import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, type LayoutChangeEvent, View } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { Text } from '../../common/Text';
import { colors } from '../../../theme/colors';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { chart, chartReveal, chartText, chartWrap } from '../chartTokens';

interface ResetScienceScreenProps {
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
const SAMPLE_COUNT = 96;

/**
 * One line, falling. Nothing on this screen is read — it is glanced at, and the
 * glance has to land the whole claim on its own: down is better, and the
 * exercise is what took it down. So no oscillation, no second trace, no axis a
 * viewer has to be taught. `HeartVariabilityScreen` plots the beat-to-beat
 * detail later, once the user has a reason to care about it.
 */
const START_STRESS = 1;
const END_STRESS = 0.16;
// Most of the drop lands early, then it flattens — the shape of relief.
const SETTLE_RATE = 3.4;

/**
 * The evidence the curve is drawn from, cited rather than counted.
 *
 * A bare tally ("backed by N studies") is a claim nobody can check and every
 * app store treats as a health claim. Naming the papers is the same reassurance
 * and it is verifiable, so this is the list to argue with — not a number.
 */
const CITATIONS = [
  'Ma et al., Frontiers in Psychology, 2017',
  'Balban et al., Cell Reports Medicine, 2023',
];


function stressAt(unit: number): number {
  'worklet';
  return END_STRESS + (START_STRESS - END_STRESS) * Math.exp(-SETTLE_RATE * unit);
}

export default function ResetScienceScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: ResetScienceScreenProps) {
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
      // Linear, because the x axis is time — an eased pen makes the trace look
      // like it speeds up mid-recording.
      withTiming(1, { duration: chartReveal.durationMs, easing: Easing.linear }),
    );
  }, [progress, width]);

  const innerW = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const innerH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const curveY = (unit: number) => {
    'worklet';
    return PAD_TOP + innerH - stressAt(unit) * (innerH - TOP_INSET);
  };

  const line = useMemo(() => {
    const p = Skia.Path.Make();
    if (innerW <= 0) return p;
    const points = Array.from({ length: SAMPLE_COUNT }, (_, i) => {
      const u = i / (SAMPLE_COUNT - 1);
      return { x: PAD_LEFT + u * innerW, y: curveY(u) };
    });

    // Catmull-Rom through the samples, converted to cubics, so the shoulder of
    // the curve rounds off instead of coming to a polyline point.
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
  }, [innerW, innerH]);

  const fill = useMemo(() => {
    if (innerW <= 0) return Skia.Path.Make();
    const p = line.copy();
    const baseline = PAD_TOP + innerH;
    p.lineTo(PAD_LEFT + innerW, baseline);
    p.lineTo(PAD_LEFT, baseline);
    p.close();
    return p;
  }, [line, innerW, innerH]);

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

  const penX = useDerivedValue(() => {
    if (innerW <= 0) return 0;
    return PAD_LEFT + progress.value * innerW;
  }, [innerW]);

  const penY = useDerivedValue(() => {
    if (innerW <= 0) return 0;
    return curveY(progress.value);
  }, [innerW, innerH]);

  const lineColor = chart.lineColor;
  const startY = curveY(0);

  return (
    <OnboardingScreenLayout
      title="Azora is proven to calm an overwhelmed mind."
      subtitle="Research links slow breathing with lower physiological arousal and higher heart-rate variability."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.chartWrap}>
        <Text style={styles.yAxisLabel}>Your stress</Text>
        <View
          style={{ width: '100%', height: CHART_HEIGHT }}
          onLayout={handleChartLayout}
        >
          {width > 0 ? (
            <>
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
                  <Path path={fill} style="fill">
                    <LinearGradient
                      start={vec(0, PAD_TOP)}
                      end={vec(0, PAD_TOP + innerH)}
                      colors={[
                        `${lineColor}${chart.fillOpacity.top}`,
                        `${lineColor}${chart.fillOpacity.bottom}`,
                      ]}
                    />
                  </Path>

                  <Path
                    path={line}
                    style="stroke"
                    strokeWidth={chart.lineWidth}
                    strokeCap="round"
                    strokeJoin="round"
                    color={lineColor}
                  />
                </Group>

                <Circle
                  cx={PAD_LEFT}
                  cy={startY}
                  r={chart.dotHaloRadius}
                  color={colors.background.primary}
                />
                <Circle
                  cx={PAD_LEFT}
                  cy={startY}
                  r={chart.dotRadius}
                  color={lineColor}
                />
                <Circle
                  cx={penX}
                  cy={penY}
                  r={chart.dotHaloRadius}
                  color={colors.background.primary}
                />
                <Circle
                  cx={penX}
                  cy={penY}
                  r={chart.dotRadius}
                  color={lineColor}
                />
              </Canvas>
            </>
          ) : null}
        </View>
        <Text style={styles.xAxisLabel}>One 90-second Azora exercise</Text>
        <Text style={styles.studyNote}>{CITATIONS.join('  ·  ')}</Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  chartWrap,
  yAxisLabel: chartText.heading,
  studyNote: chartText.note,
  xAxisLabel: chartText.axisLabel,
});
