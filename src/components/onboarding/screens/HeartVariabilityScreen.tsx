import { Text } from '../../common/Text';
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
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { chart, chartText } from '../chartTokens';

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

const START_BPM = 80;
const END_BPM = 61;
// Settling is exponential, not linear: the rate sheds most of the drop in the
// first few breaths and then flattens out.
const SETTLE_RATE = 2.4;

// Long, slow breaths that stretch further apart as the breathing settles.
const BREATH_CYCLES = 5.75;
const PERIOD_STRETCH = 0.35;
// Respiratory sinus arrhythmia is asymmetric — the inhale climb is a little
// sharper than the exhale fall — and the swing widens as the breath lengthens.
const WAVE_SKEW = 0.08;
const START_SWING = 1.5;
const END_SWING = 2.4;

const BPM_MAX = 83;
const BPM_MIN = 58;

const REVEAL_DELAY_MS = 650;
const REVEAL_DURATION_MS = 2600;

function bpmAt(unit: number): number {
  'worklet';
  const baseline =
    END_BPM + (START_BPM - END_BPM) * Math.exp(-SETTLE_RATE * unit);
  const swing = START_SWING + (END_SWING - START_SWING) * unit;

  // Frequency falls linearly across the trace, so the phase is its integral.
  const frequency = BREATH_CYCLES / (1 - PERIOD_STRETCH / 2);
  const phase =
    2 *
    Math.PI *
    frequency *
    (unit - (PERIOD_STRETCH * unit * unit) / 2);
  const wave = Math.sin(phase + WAVE_SKEW * Math.sin(phase));

  return baseline + swing * wave;
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
      REVEAL_DELAY_MS,
      // Linear, because the x axis is time — an eased pen makes the trace look
      // like it speeds up mid-recording.
      withTiming(1, {
        duration: REVEAL_DURATION_MS,
        easing: Easing.linear,
      }),
    );
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

    // Catmull-Rom through the samples, converted to cubics, so the peaks and
    // troughs round off instead of coming to a polyline point.
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

  const startX = PAD_LEFT;
  const startY = curveY(0);

  const endX = useDerivedValue(() => {
    if (innerW <= 0) return 0;
    return PAD_LEFT + progress.value * innerW;
  }, [innerW]);

  const endY = useDerivedValue(() => {
    if (innerW <= 0) return 0;
    return curveY(progress.value);
  }, [innerW, innerH]);

  const lineColor = colors.primary.blue600;
  const dotColor = colors.primary.blue600;

  return (
    <OnboardingScreenLayout
      title="Your stress shows up in your heart."
      subtitle="Azora's exercises can encourage a healthier heart and help your body relax."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.chartWrap}>
        <Text style={styles.yAxisLabel}>Heart Rate (BPM)</Text>
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

              <Circle
                cx={startX}
                cy={startY}
                r={chart.dotHaloRadius}
                color={colors.background.primary}
              />
              <Circle
                cx={startX}
                cy={startY}
                r={chart.dotRadius}
                color={dotColor}
              />
              <Circle
                cx={endX}
                cy={endY}
                r={chart.dotHaloRadius}
                color={colors.background.primary}
              />
              <Circle
                cx={endX}
                cy={endY}
                r={chart.dotRadius}
                color={dotColor}
              />
            </Canvas>
          ) : null}
        </View>
        <Text style={styles.xAxisLabel}>
          Two minutes of Azora’s Guided Reset
        </Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  chartWrap: {
    width: '100%',
    gap: chart.gap,
    marginTop: -spacing.xs,
    paddingHorizontal: chart.horizontalPadding,
  },
  yAxisLabel: chartText.heading,
  xAxisLabel: chartText.axisLabel,
});
