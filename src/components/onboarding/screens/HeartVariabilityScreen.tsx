import { Text } from '../../common/Text';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, type LayoutChangeEvent, View } from 'react-native';
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
  Group,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { chart, chartReveal, chartText, chartWrap } from '../chartTokens';
import { createChartArrow } from '../chartArrow';

interface HeartVariabilityScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

const CHART_HEIGHT = chart.height;
const PAD_LEFT = chart.padLeft;
const PAD_RIGHT = chart.padRight;
const PAD_TOP = chart.padTop;
const PAD_BOTTOM = chart.padBottom;
const TOP_INSET = chart.topInset;
const SAMPLE_COUNT = 96;

const STRESS_BPM = 84;
const END_BPM = 61;
const BPM_MAX = 88;
const BPM_MIN = 56;

/** A smooth settling trend rather than a simulated beat-by-beat recording. */
function bpmAt(unit: number): number {
  'worklet';
  const settled = unit * unit * (3 - 2 * unit);
  return STRESS_BPM + (END_BPM - STRESS_BPM) * settled;
}

export default function HeartVariabilityScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  onSkip,
}: HeartVariabilityScreenProps) {
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
      withTiming(1, {
        duration: chartReveal.durationMs,
        easing: Easing.linear,
      }),
    );
    return () => cancelAnimation(progress);
  }, [progress, width]);

  const innerW = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const innerH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const curveY = (unit: number) => {
    'worklet';
    const ratio = (bpmAt(unit) - BPM_MIN) / (BPM_MAX - BPM_MIN);
    return PAD_TOP + innerH - ratio * (innerH - TOP_INSET);
  };

  const line = useMemo(() => {
    const p = Skia.Path.Make();
    if (innerW <= 0) return p;
    const points = Array.from({ length: SAMPLE_COUNT }, (_, i) => {
      const u = i / (SAMPLE_COUNT - 1);
      return { x: PAD_LEFT + u * innerW, y: curveY(u) };
    });

    // Smooth cubic segments keep the trend continuous as it draws.
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

  const axis = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(PAD_LEFT, PAD_TOP);
    p.lineTo(PAD_LEFT, PAD_TOP + innerH);
    p.lineTo(PAD_LEFT + innerW, PAD_TOP + innerH);
    return p;
  }, [innerW, innerH]);

  const arrowHead = useDerivedValue(() => {
    if (innerW <= 0) return Skia.Path.Make();
    const unit = progress.value;
    const x = PAD_LEFT + unit * innerW;
    const y = curveY(unit);
    const slope =
      ((STRESS_BPM - END_BPM) / (BPM_MAX - BPM_MIN)) *
      (innerH - TOP_INSET) * 6 * unit * (1 - unit);
    return createChartArrow(x, y, Math.atan2(slope, innerW));
  }, [innerW, innerH]);

  const arrowOpacity = useDerivedValue(() => (progress.value > 0 ? 1 : 0));
  const lineColor = chart.lineColor;

  return (
    <OnboardingScreenLayout
      title="Azora helps your body slow down under stress."
      subtitle="Its slow breathing exercises can help lower your heart rate and activate your body’s calming response."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.chartWrap}>
        <Text style={styles.yAxisLabel}>Heart rate (BPM)</Text>
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

              <Path
                path={arrowHead}
                style="fill"
                color={lineColor}
                opacity={arrowOpacity}
              />
            </Canvas>
          ) : null}
        </View>
        <Text style={styles.xAxisLabel}>
          Elevated under stress, then a few minutes of slower breathing
        </Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  chartWrap,
  yAxisLabel: chartText.heading,
  xAxisLabel: chartText.axisLabel,
});
