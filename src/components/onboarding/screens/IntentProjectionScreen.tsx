import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
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
const PAD_RIGHT = 8;
const PAD_TOP = 20;
const PAD_BOTTOM = 28;
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

  const progress = useRef(new Animated.Value(0)).current;
  const [t, setT] = useState(0);

  useEffect(() => {
    const id = progress.addListener(({ value }) => setT(value));
    Animated.timing(progress, {
      toValue: 1,
      duration: 1400,
      delay: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => progress.removeListener(id);
  }, [progress]);

  const innerW = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const innerH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const { line, fill, startX, startY, endX, endY } = useMemo(() => {
    if (innerW <= 0) {
      return { line: null, fill: null, startX: 0, startY: 0, endX: 0, endY: 0 };
    }

    const normalizer = 1 - Math.exp(-CURVE_K * 8);
    const curveAt = (u: number) => {
      const raw = 1 - Math.exp(-CURVE_K * u * 8);
      return (raw / normalizer) * ceiling;
    };

    const TOP_INSET = 10;
    const xAt = (u: number) => PAD_LEFT + u * innerW;
    const yAt = (v: number) =>
      PAD_TOP + innerH - (v / ceiling) * (innerH - TOP_INSET);

    const visible = Math.max(2, Math.ceil(SAMPLE_COUNT * t));
    const linePath = Skia.Path.Make();
    const fillPath = Skia.Path.Make();

    let lastX = xAt(0);
    let lastY = yAt(curveAt(0));

    for (let i = 0; i < visible; i++) {
      const u = (i / (SAMPLE_COUNT - 1)) * t;
      const x = xAt(u);
      const y = yAt(curveAt(u));
      if (i === 0) {
        linePath.moveTo(x, y);
        fillPath.moveTo(x, PAD_TOP + innerH);
        fillPath.lineTo(x, y);
      } else {
        linePath.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
      lastX = x;
      lastY = y;
    }
    fillPath.lineTo(lastX, PAD_TOP + innerH);
    fillPath.close();

    return {
      line: linePath,
      fill: fillPath,
      startX: xAt(0),
      startY: yAt(curveAt(0)),
      endX: lastX,
      endY: lastY,
    };
  }, [innerW, innerH, ceiling, t]);

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
      <View
        style={styles.chartWrap}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        <View style={{ width: '100%', height: CHART_HEIGHT }}>
          <Text style={styles.yAxisLabel} pointerEvents="none">
            Overall wellbeing
          </Text>
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

              {fill ? (
                <Path path={fill} style="fill">
                  <LinearGradient
                    start={vec(0, PAD_TOP)}
                    end={vec(0, PAD_TOP + innerH)}
                    colors={[
                      `${lineColor}44`,
                      `${lineColor}00`,
                    ]}
                  />
                </Path>
              ) : null}

              {line ? (
                <Path
                  path={line}
                  style="stroke"
                  strokeWidth={4}
                  strokeCap="round"
                  strokeJoin="round"
                  color={lineColor}
                />
              ) : null}

              {line ? (
                <>
                  <Circle cx={startX} cy={startY} r={6} color={dotColor} />
                  <Circle cx={endX} cy={endY} r={6} color={dotColor} />
                </>
              ) : null}
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
  },
  yAxisLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.neutral[700],
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
