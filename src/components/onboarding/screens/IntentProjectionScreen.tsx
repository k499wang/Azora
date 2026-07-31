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

const CHART_HEIGHT = chart.height;
const PAD_LEFT = chart.padLeft;
const PAD_RIGHT = chart.padRight;
const PAD_TOP = chart.padTop;
const PAD_BOTTOM = chart.padBottom;
const TOP_INSET = chart.topInset;
const SAMPLE_COUNT = 64;
const CURVE_K = 0.55;
const REVEAL_DELAY_MS = 650;
const REVEAL_DURATION_MS = 1600;

interface IntentProjectionScreenProps {
  selectedIntents: string[];
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function IntentProjectionScreen({
  selectedIntents,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: IntentProjectionScreenProps) {
  const [width, setWidth] = useState(0);

  const ceiling = useMemo(() => {
    const n = Math.max(1, selectedIntents.filter((id) => id !== 'other').length);
    return Math.min(0.78 + (n - 1) * 0.04, 0.94);
  }, [selectedIntents]);

  const progress = useSharedValue(0);

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
  }, [progress, ceiling, width]);

  const handleChartLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setWidth((currentWidth) =>
      Math.abs(currentWidth - nextWidth) < 1 ? currentWidth : nextWidth,
    );
  }, []);

  const innerW = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const innerH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const curveY = (u: number) => {
    const normalizer = 1 - Math.exp(-CURVE_K * 8);
    const raw = 1 - Math.exp(-CURVE_K * u * 8);
    const v = (raw / normalizer) * ceiling;
    return PAD_TOP + innerH - (v / ceiling) * (innerH - TOP_INSET);
  };

  const line = useMemo(() => {
    const p = Skia.Path.Make();
    if (innerW <= 0) return p;
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const u = i / (SAMPLE_COUNT - 1);
      const x = PAD_LEFT + u * innerW;
      const y = curveY(u);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [innerW, innerH, ceiling]);

  const fill = useMemo(() => {
    const p = Skia.Path.Make();
    if (innerW <= 0) return p;
    const baseline = PAD_TOP + innerH;
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const u = i / (SAMPLE_COUNT - 1);
      const x = PAD_LEFT + u * innerW;
      const y = curveY(u);
      if (i === 0) {
        p.moveTo(x, baseline);
        p.lineTo(x, y);
      } else {
        p.lineTo(x, y);
      }
    }
    p.lineTo(PAD_LEFT + innerW, baseline);
    p.close();
    return p;
  }, [innerW, innerH, ceiling]);

  const revealClip = useDerivedValue(
    () => Skia.XYWHRect(PAD_LEFT, 0, Math.max(0, progress.value * innerW), CHART_HEIGHT),
    [innerW],
  );

  const axis = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(PAD_LEFT, PAD_TOP);
    p.lineTo(PAD_LEFT, PAD_TOP + innerH);
    p.lineTo(PAD_LEFT + innerW, PAD_TOP + innerH);
    return p;
  }, [innerW, innerH]);

  const lineColor = colors.primary.blue600;

  return (
    <OnboardingScreenLayout
      title="Your breath is a superpower you've never used."
      subtitle="Train it a few minutes a day and the benefits build, week after week."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <OnboardingPrimaryButton label="Continue" onPress={onContinue} />
      }
    >
      <View style={styles.chartWrap}>
        <Text style={styles.yAxisLabel}>Overall wellbeing</Text>
        <View
          style={{ width: '100%', height: CHART_HEIGHT }}
          onLayout={handleChartLayout}
        >
          {width > 0 ? (
            <Canvas style={StyleSheet.absoluteFill}>
              <Path
                path={axis}
                style="stroke"
                strokeWidth={1.5}
                strokeCap="round"
                color={colors.neutral[300]}
              />

              <Group clip={revealClip}>
                <Path path={fill} style="fill">
                  <LinearGradient
                    start={vec(0, PAD_TOP)}
                    end={vec(0, PAD_TOP + innerH)}
                    colors={[`${lineColor}44`, `${lineColor}00`]}
                  />
                </Path>

                <Path
                  path={line}
                  style="stroke"
                  strokeWidth={4}
                  strokeCap="round"
                  strokeJoin="round"
                  color={lineColor}
                />
              </Group>
            </Canvas>
          ) : null}
        </View>
        <Text style={styles.xAxisLabel}>Sessions on Azora</Text>
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
