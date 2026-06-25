import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

const CHART_HEIGHT = 230;
const PAD_LEFT = 8;
const PAD_RIGHT = 16;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;
const TOP_INSET = 10;
const SAMPLE_COUNT = 64;
const CURVE_K = 0.55;
const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8];

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
    progress.value = 0;
    progress.value = withDelay(
      280,
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.cubic) }),
    );
  }, [progress, ceiling, width]);

  const innerW = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const innerH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const line = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (innerW <= 0) return p;
    const t = progress.value;
    const normalizer = 1 - Math.exp(-CURVE_K * 8);
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const u = (i / (SAMPLE_COUNT - 1)) * t;
      const raw = 1 - Math.exp(-CURVE_K * u * 8);
      const v = (raw / normalizer) * ceiling;
      const x = PAD_LEFT + u * innerW;
      const y = PAD_TOP + innerH - (v / ceiling) * (innerH - TOP_INSET);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    return p;
  }, [innerW, innerH, ceiling]);

  const fill = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (innerW <= 0) return p;
    const t = progress.value;
    const baseline = PAD_TOP + innerH;
    const normalizer = 1 - Math.exp(-CURVE_K * 8);
    let lastX = PAD_LEFT;
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const u = (i / (SAMPLE_COUNT - 1)) * t;
      const raw = 1 - Math.exp(-CURVE_K * u * 8);
      const v = (raw / normalizer) * ceiling;
      const x = PAD_LEFT + u * innerW;
      const y = PAD_TOP + innerH - (v / ceiling) * (innerH - TOP_INSET);
      if (i === 0) {
        p.moveTo(x, baseline);
        p.lineTo(x, y);
      } else {
        p.lineTo(x, y);
      }
      lastX = x;
    }
    p.lineTo(lastX, baseline);
    p.close();
    return p;
  }, [innerW, innerH, ceiling]);

  const startX = PAD_LEFT;
  const startY = PAD_TOP + innerH;

  const endX = useDerivedValue(() => {
    if (innerW <= 0) return 0;
    return PAD_LEFT + progress.value * innerW;
  }, [innerW]);

  const endY = useDerivedValue(() => {
    if (innerW <= 0) return 0;
    const normalizer = 1 - Math.exp(-CURVE_K * 8);
    const raw = 1 - Math.exp(-CURVE_K * progress.value * 8);
    const v = (raw / normalizer) * ceiling;
    return PAD_TOP + innerH - (v / ceiling) * (innerH - TOP_INSET);
  }, [innerW, innerH, ceiling]);

  const lineColor = colors.primary.blue600;
  const dotColor = colors.primary.blue600;

  return (
    <OnboardingScreenLayout
      title="Breathing is your most underused system."
      subtitle={`It's the only autonomic system you can steer directly. A few minutes a day cuts stress within weeks.`}
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
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
          {width > 0 ? (
            <Canvas style={StyleSheet.absoluteFill}>
              <Path
                path={(() => {
                  const p = Skia.Path.Make();
                  p.moveTo(PAD_LEFT, PAD_TOP);
                  p.lineTo(PAD_LEFT, PAD_TOP + innerH);
                  p.lineTo(PAD_LEFT + innerW, PAD_TOP + innerH);
                  return p;
                })()}
                style="stroke"
                strokeWidth={1.5}
                strokeCap="round"
                color={colors.neutral[300]}
              />

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

              <Circle cx={startX} cy={startY} r={6} color={dotColor} />
              <Circle cx={endX} cy={endY} r={6} color={dotColor} />
            </Canvas>
          ) : null}
        </View>

        <View style={styles.weekAxis}>
          {WEEKS.map((w) => (
            <Text key={w} style={styles.weekLabel}>
              {w}
            </Text>
          ))}
        </View>

        <Text style={styles.caption}>Weeks of daily practice</Text>
        <Text style={styles.citation}>
          Projected wellbeing · adapted from Fincham et al., 2023 ·
          Scientific Reports
        </Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  chartWrap: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  yAxisLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.neutral[700],
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  weekAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: PAD_LEFT,
    marginTop: -spacing.sm,
  },
  weekLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text.tertiary,
    fontVariant: ['tabular-nums'],
  },
  caption: {
    ...typography.body.small,
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  citation: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text.tertiary,
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
