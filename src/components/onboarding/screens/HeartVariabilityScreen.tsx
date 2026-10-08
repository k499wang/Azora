import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { Text } from '../../common/Text';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { spacing } from '../../../theme/spacing';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import ChartMilestone from '../ChartMilestone';
import { ChartAxes, ChartAxisTitles } from '../ChartAxes';
import { chart, chartText, chartWrap } from '../chartTokens';
import { plotBox, smoothPath } from '../chartPaths';
import { popStyle, useChartPop, useChartReveal } from '../useChartReveal';

interface HeartVariabilityScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

const SAMPLE_COUNT = 96;

const STRESS_BPM = 84;
const END_BPM = 61;
/** where the same few minutes drift without the exercise: barely down */
const UNTREATED_END_BPM = 80;
const UNTREATED_WOBBLE_BPM = 1;
const BPM_MAX = 88;
const BPM_MIN = 56;

const MILESTONES = [
  { unit: 0.35, label: 'Slowing' },
  { unit: 0.62, label: 'Settling' },
];
const COMPARISON_LABEL_AT = 0.8;

function settle(unit: number): number {
  return unit * unit * (3 - 2 * unit);
}

/** A smooth settling trend rather than a simulated beat-by-beat recording. */
function bpmAt(unit: number): number {
  return STRESS_BPM + (END_BPM - STRESS_BPM) * settle(unit);
}

function untreatedBpmAt(unit: number): number {
  return (
    STRESS_BPM +
    (UNTREATED_END_BPM - STRESS_BPM) * settle(unit) +
    UNTREATED_WOBBLE_BPM * Math.sin(2 * Math.PI * unit)
  );
}

export default function HeartVariabilityScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
  onSkip,
}: HeartVariabilityScreenProps) {
  const { width, onLayout, progress } = useChartReveal();
  const box = useMemo(() => plotBox(width), [width]);

  const xAt = (unit: number) => box.left + unit * box.width;
  const yAt = (bpm: number) =>
    box.top +
    box.height -
    ((bpm - BPM_MIN) / (BPM_MAX - BPM_MIN)) * (box.height - chart.topInset);

  const traceOf = (bpmOf: (unit: number) => number) =>
    smoothPath(
      Array.from({ length: SAMPLE_COUNT }, (_, i) => {
        const u = i / (SAMPLE_COUNT - 1);
        return { x: xAt(u), y: yAt(bpmOf(u)) };
      }),
    );

  const line = useMemo(() => traceOf(bpmAt), [box]);
  const untreatedLine = useMemo(() => traceOf(untreatedBpmAt), [box]);

  const revealClip = useDerivedValue(
    () =>
      Skia.XYWHRect(box.left, 0, Math.max(0, progress.value * box.width), chart.height),
    [box],
  );

  const comparisonShown = useChartPop(progress, COMPARISON_LABEL_AT);
  const comparisonPop = useAnimatedStyle(() => popStyle(comparisonShown.value));

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
        <View style={styles.plot} onLayout={onLayout}>
          {width > 0 ? (
            <>
              <Canvas style={StyleSheet.absoluteFill}>
                <Group clip={revealClip}>
                  <Path
                    path={untreatedLine}
                    style="stroke"
                    strokeWidth={chart.milestone.comparisonWidth}
                    strokeCap="round"
                    strokeJoin="round"
                    color={chart.milestone.comparisonColor}
                  />
                  <Path
                    path={line}
                    style="stroke"
                    strokeWidth={chart.milestone.lineWidth}
                    strokeCap="round"
                    strokeJoin="round"
                    color={chart.milestone.lineColor}
                  />
                </Group>

                <ChartAxes width={width} />
              </Canvas>

              <ChartAxisTitles y="Heart rate" x="Time" yTitlePosition="above" />

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.comparisonLabel,
                  { top: yAt(untreatedBpmAt(1)) + chart.milestone.comparisonWidth / 2 + spacing.sm },
                  comparisonPop,
                ]}
              >
                <Text style={chartText.tick}>Without slow breathing</Text>
              </Animated.View>

              {MILESTONES.map(({ unit, label }) => (
                <ChartMilestone
                  key={label}
                  x={xAt(unit)}
                  y={yAt(bpmAt(unit))}
                  label={label}
                  marker="ring"
                  progress={progress}
                  revealAt={unit}
                />
              ))}
              <ChartMilestone
                x={xAt(1)}
                y={yAt(END_BPM)}
                label="Calm"
                marker="end"
                progress={progress}
                revealAt={1}
              />
            </>
          ) : null}
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  chartWrap,
  plot: {
    width: '100%',
    height: chart.height,
  },
  comparisonLabel: {
    position: 'absolute',
    right: chart.padRight,
  },
});
