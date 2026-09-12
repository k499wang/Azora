import { Text } from '../../common/Text';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { isShortScreen } from '../../../theme/breakpoints';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { scaleVisual } from '../onboardingVisualScale';

interface ConsistencyScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
/**
 * Rising overall, but not smoothly: real weeks dip. The jags keep the promise
 * honest — progress is the trend, not every single day.
 */
const POINTS = [0.18, 0.34, 0.26, 0.5, 0.4, 0.72, 1];
const CHART_HEIGHT = scaleVisual(260);
const CHART_HEIGHT_COMPACT = scaleVisual(200);
const STROKE = 6;
const ARROW = 20;
const DRAW_DURATION = 1400;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function ConsistencyScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: ConsistencyScreenProps) {
  const { height } = useWindowDimensions();
  const compact = isShortScreen(height);
  const [plotWidth, setPlotWidth] = useState(0);
  const draw = useRef(new Animated.Value(0)).current;

  const chartHeight = compact ? CHART_HEIGHT_COMPACT : CHART_HEIGHT;

  const { path, length, arrow } = useMemo(() => {
    const inset = STROKE + ARROW / 2;
    const usable = Math.max(plotWidth - inset * 2, 0);
    const top = inset;
    const bottom = chartHeight - inset;
    const coords = POINTS.map((value, index) => ({
      x: inset + (usable * index) / (POINTS.length - 1),
      y: bottom - (bottom - top) * value,
    }));
    const total = coords.reduce((sum, point, index) => {
      if (index === 0) return 0;
      const prev = coords[index - 1];
      return sum + Math.hypot(point.x - prev.x, point.y - prev.y);
    }, 0);
    // The head sits on the final segment's own heading, so it reads as the
    // line continuing forward rather than a triangle parked on the end.
    const tip = coords[coords.length - 1];
    const before = coords[coords.length - 2];
    const angle = Math.atan2(tip.y - before.y, tip.x - before.x);
    const wing = (spread: number) => ({
      x: tip.x - ARROW * Math.cos(angle - spread),
      y: tip.y - ARROW * Math.sin(angle - spread),
    });
    const left = wing(0.45);
    const right = wing(-0.45);
    return {
      path: coords
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
        .join(' '),
      length: total,
      arrow: `M${left.x} ${left.y} L${tip.x} ${tip.y} L${right.x} ${right.y}`,
    };
  }, [chartHeight, plotWidth]);

  useEffect(() => {
    if (plotWidth === 0) return;
    draw.setValue(0);
    const animation = Animated.timing(draw, {
      toValue: 1,
      duration: DRAW_DURATION,
      delay: 240,
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished && isHapticsEnabled()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
    });
    return () => animation.stop();
  }, [chartHeight, draw, plotWidth]);

  const dashOffset = draw.interpolate({
    inputRange: [0, 1],
    outputRange: [length, 0],
  });
  const arrowOpacity = draw.interpolate({
    inputRange: [0, 0.9, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <OnboardingScreenLayout
      title="You have great potential to crush your goal."
      subtitle="A daily routine compounds — most people hold focus longer by week two."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={[styles.chartWrap, compact && styles.chartWrapCompact]}>
        <Text style={styles.chartTitle}>Overall Wellbeing</Text>

        <View
          style={[styles.plot, { height: chartHeight }]}
          onLayout={(event) => setPlotWidth(event.nativeEvent.layout.width)}
        >
          {plotWidth > 0 ? (
            <Svg width={plotWidth} height={chartHeight}>
              <AnimatedPath
                d={path}
                stroke={colors.playful.sky.mid}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={length}
                strokeDashoffset={dashOffset}
              />
              <AnimatedPath
                d={arrow}
                stroke={colors.playful.sky.mid}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={arrowOpacity}
              />
            </Svg>
          ) : null}
        </View>

        <View style={styles.labelRow}>
          {DAYS.map((label, index) => {
            const isPeak = index === DAYS.length - 1;
            return (
              <View key={index} style={styles.dayColumn}>
                <Text style={[styles.dayLabel, isPeak && styles.dayLabelPeak]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.caption}>Your first week</Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  // Flowed, not `centerBody`: that centres the body over the whole content box,
  // including the space the title and subtitle occupy, so on shorter screens the
  // chart's own title crept up under the subtitle. Auto margins centre it in
  // whatever room is left *below* the copy instead.
  chartWrap: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 'auto',
    marginBottom: 'auto',
    paddingHorizontal: spacing.sm,
  },
  chartWrapCompact: {
    marginTop: spacing.sm,
  },
  chartTitle: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  plot: {
    width: '100%',
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: colors.neutral[300],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    ...typography.label.small,
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  dayLabelPeak: {
    color: colors.text.primary,
  },
  caption: {
    ...typography.body.small,
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
