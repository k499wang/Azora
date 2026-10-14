import { useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { Text } from '../../common/Text';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { spacing } from '../../../theme/spacing';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import ChartMilestone from '../ChartMilestone';
import { ChartAxes, ChartAxisTitles } from '../ChartAxes';
import { chart, chartText, chartWrap } from '../chartTokens';
import { plotBox, smoothPath } from '../chartPaths';
import { popStyle, useChartPop, useChartReveal } from '../useChartReveal';

interface GreatDaysScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const SAMPLE_COUNT = 96;

/** An illustration on a 0–1 scale, not a measurement, so the axis carries no numbers. */
const START = 0.22;
const END = 0.92;
const FLAT_WOBBLE = 0.035;

const MILESTONES = [
  { unit: 0.17, label: '5 days' },
  { unit: 0.47, label: '14 days' },
];
const COMPARISON_LABEL_AT = 0.8;

function settle(unit: number): number {
  return unit * unit * (3 - 2 * unit);
}

/** Rises early, levels off around two weeks, then climbs again to day 30. */
function withHabitsAt(unit: number): number {
  return START + (END - START) * (0.55 * settle(Math.min(1, unit * 1.6)) + 0.45 * unit * unit);
}

function withoutHabitsAt(unit: number): number {
  return START + 0.03 + FLAT_WOBBLE * Math.sin(2 * Math.PI * unit * 1.4);
}

export default function GreatDaysScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: GreatDaysScreenProps) {
  const { width, onLayout, progress } = useChartReveal();
  const box = useMemo(() => plotBox(width), [width]);

  const xAt = (unit: number) => box.left + unit * box.width;
  const yAt = (value: number) =>
    box.top + box.height - value * (box.height - chart.topInset);

  const traceOf = (valueOf: (unit: number) => number) =>
    smoothPath(
      Array.from({ length: SAMPLE_COUNT }, (_, i) => {
        const u = i / (SAMPLE_COUNT - 1);
        return { x: xAt(u), y: yAt(valueOf(u)) };
      }),
    );

  const line = useMemo(() => traceOf(withHabitsAt), [box]);
  const flatLine = useMemo(() => traceOf(withoutHabitsAt), [box]);

  const revealClip = useDerivedValue(
    () =>
      Skia.XYWHRect(box.left, 0, Math.max(0, progress.value * box.width), chart.height),
    [box],
  );

  const comparisonShown = useChartPop(progress, COMPARISON_LABEL_AT);
  const comparisonPop = useAnimatedStyle(() => popStyle(comparisonShown.value));

  return (
    <OnboardingScreenLayout
      title="Azora builds long-term habits that stick"
      subtitle="Good habits help you reach your goals, one small step a day."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.chartWrap}>
        <View style={styles.plot} onLayout={onLayout}>
          {width > 0 ? (
            <>
              <Canvas style={StyleSheet.absoluteFill}>
                <Group clip={revealClip}>
                  <Path
                    path={flatLine}
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

              <ChartAxisTitles y="Happiness" yTitlePosition="above" />

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.comparisonLabel,
                  { top: yAt(withoutHabitsAt(1)) + chart.milestone.comparisonWidth / 2 + spacing.sm },
                  comparisonPop,
                ]}
              >
                <Text style={chartText.tick}>Without new habits</Text>
              </Animated.View>

              {MILESTONES.map(({ unit, label }) => (
                <ChartMilestone
                  key={label}
                  x={xAt(unit)}
                  y={yAt(withHabitsAt(unit))}
                  label={label}
                  marker="ring"
                  progress={progress}
                  revealAt={unit}
                />
              ))}
              <ChartMilestone
                x={xAt(1)}
                y={yAt(withHabitsAt(1))}
                label="30 days"
                marker="end"
                progress={progress}
                revealAt={1}
              />
            </>
          ) : null}
        </View>
        <Text style={styles.researchNote}>
          Good habits do the heavy lifting toward your goals. In a study that followed 96
          people building a new daily habit, it got more automatic with every repeat, and
          missing one day did not undo the progress. [1]
        </Text>
        <Text
          style={styles.citation}
          accessibilityRole="link"
          accessibilityLabel="Read the habit formation study by Lally and colleagues"
          onPress={() => {
            void Linking.openURL('https://doi.org/10.1002/ejsp.674');
          }}
        >
          [1] Lally et al. (2010) · European Journal of Social Psychology
        </Text>
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
  researchNote: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  citation: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
