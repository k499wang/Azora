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
  DashPathEffect,
  Group,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { chart, chartText } from '../chartTokens';

const CHART_HEIGHT = chart.height;
const PAD_LEFT = chart.padLeft;
const PAD_RIGHT = chart.padRight;
const PAD_TOP = chart.padTop;
const PAD_BOTTOM = chart.padBottom;
const REFERENCE_Y = PAD_TOP + 40;
const REVEAL_DELAY_MS = 650;
const REVEAL_DURATION_MS = 1600;

interface ModernBreathingScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function ModernBreathingScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: ModernBreathingScreenProps) {
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
      withTiming(1, {
        duration: REVEAL_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
      }),
    );
  }, [progress, width]);

  const innerW = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const innerH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const axis = useMemo(() => {
    const path = Skia.Path.Make();
    path.moveTo(PAD_LEFT, PAD_TOP);
    path.lineTo(PAD_LEFT, PAD_TOP + innerH);
    path.lineTo(PAD_LEFT + innerW, PAD_TOP + innerH);
    return path;
  }, [innerH, innerW]);

  const referenceLine = useMemo(() => {
    const path = Skia.Path.Make();
    path.moveTo(PAD_LEFT, REFERENCE_Y);
    path.lineTo(PAD_LEFT + innerW, REFERENCE_Y);
    return path;
  }, [innerW]);

  const breathingDepthLine = useMemo(() => {
    const path = Skia.Path.Make();
    if (innerW <= 0) return path;

    const startY = PAD_TOP + 78;
    const endY = PAD_TOP + innerH - 54;
    path.moveTo(PAD_LEFT, startY);
    path.cubicTo(
      PAD_LEFT + innerW * 0.24,
      startY + 6,
      PAD_LEFT + innerW * 0.44,
      startY + 30,
      PAD_LEFT + innerW * 0.62,
      startY + 58,
    );
    path.cubicTo(
      PAD_LEFT + innerW * 0.78,
      startY + 84,
      PAD_LEFT + innerW * 0.9,
      endY - 8,
      PAD_LEFT + innerW,
      endY,
    );
    return path;
  }, [innerH, innerW]);

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

  return (
    <OnboardingScreenLayout
      title="Unfortunately, most of us breathe poorly."
      subtitle="Modern stress and long hours sitting can train us into shorter, shallower breaths."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.chartWrap}>
        <Text style={styles.heading}>Focus &amp; sleep quality</Text>
        <View
          style={styles.plot}
          onLayout={handleChartLayout}
          accessibilityRole="image"
          accessibilityLabel="Graph comparing everyday breathing depth, which decreases, with steady natural breathing depth."
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
                <Path
                  path={referenceLine}
                  style="stroke"
                  strokeWidth={2}
                  strokeCap="round"
                  color={colors.neutral[400]}
                >
                  <DashPathEffect intervals={[8, 7]} />
                </Path>
                <Path
                  path={breathingDepthLine}
                  style="stroke"
                  strokeWidth={4}
                  strokeCap="round"
                  strokeJoin="round"
                  color={colors.primary.blue600}
                />
              </Group>
            </Canvas>
          ) : null}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.depthSwatch} />
            <Text style={styles.legendText}>Everyday breathing</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.referenceSwatch} />
            <Text style={styles.legendText}>Natural breathing</Text>
          </View>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  chartWrap: {
    width: '100%',
    marginTop: -spacing.xs,
    paddingHorizontal: chart.horizontalPadding,
    gap: chart.gap,
  },
  heading: chartText.heading,
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendText: {
    ...chartText.tick,
    color: colors.text.secondary,
  },
  plot: {
    width: '100%',
    height: CHART_HEIGHT,
  },
  referenceSwatch: {
    width: 24,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.neutral[400],
  },
  depthSwatch: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary.blue600,
  },
});
