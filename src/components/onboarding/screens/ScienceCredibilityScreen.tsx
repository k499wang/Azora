import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Polygon, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface ScienceCredibilityScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const GRAPH_WIDTH = 290;
const GRAPH_HEIGHT = 200;
const PADDING_LEFT = 14;
const PADDING_RIGHT = 18;
const PADDING_TOP = 46;
const PADDING_BOTTOM = 26;

const MILESTONES = [
  { day: 5, label: '5 days' },
  { day: 14, label: '14 days' },
  { day: 30, label: '30 days' },
];

const SAMPLES = 80;
const curve = (t: number) => 1 - Math.exp(-t * 3);
const CURVE_MAX = curve(1);

function pointAt(t: number) {
  const innerW = GRAPH_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const innerH = GRAPH_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const x = PADDING_LEFT + t * innerW;
  const y = PADDING_TOP + innerH * (1 - curve(t) / CURVE_MAX);
  return { x, y };
}

export default function ScienceCredibilityScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: ScienceCredibilityScreenProps) {
  const graphProgress = useRef(new Animated.Value(0)).current;
  const milestoneAnims = useRef(MILESTONES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    Animated.timing(graphProgress, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.stagger(
      280,
      milestoneAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 360,
          delay: 600,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [graphProgress, milestoneAnims]);

  const linePoints = Array.from({ length: SAMPLES + 1 }, (_, i) => pointAt(i / SAMPLES));
  const lineD = linePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  const areaD = `${lineD} L ${GRAPH_WIDTH - PADDING_RIGHT} ${GRAPH_HEIGHT - PADDING_BOTTOM} L ${PADDING_LEFT} ${GRAPH_HEIGHT - PADDING_BOTTOM} Z`;

  const milestonePoints = MILESTONES.map((m) => ({
    ...m,
    ...pointAt(m.day / 30),
  }));

  const axisY = GRAPH_HEIGHT - PADDING_BOTTOM;

  return (
    <OnboardingScreenLayout
      title="This isn't wellness woo. It's physiology."
      subtitle="Every technique in Azora is grounded in peer-reviewed research."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.container}>
        <View style={styles.graphCard}>
          <View style={[styles.graphCanvas, { width: GRAPH_WIDTH, height: GRAPH_HEIGHT }]}>
            <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}>
              <Defs>
                <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={colors.primary.blue600} stopOpacity={0.32} />
                  <Stop offset="100%" stopColor={colors.primary.blue600} stopOpacity={0.02} />
                </LinearGradient>
              </Defs>

              <Path
                d={`M ${PADDING_LEFT} ${PADDING_TOP - 6} L ${PADDING_LEFT} ${axisY} L ${GRAPH_WIDTH - PADDING_RIGHT + 6} ${axisY}`}
                fill="none"
                stroke={colors.border.subtle}
                strokeWidth={1}
                strokeLinecap="round"
              />
              <Polygon
                points={`${GRAPH_WIDTH - PADDING_RIGHT + 6},${axisY} ${GRAPH_WIDTH - PADDING_RIGHT + 1},${axisY - 3.5} ${GRAPH_WIDTH - PADDING_RIGHT + 1},${axisY + 3.5}`}
                fill={colors.text.tertiary}
              />
            </Svg>

            <Animated.View
              style={[
                styles.areaClip,
                {
                  width: graphProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, GRAPH_WIDTH],
                  }),
                  height: GRAPH_HEIGHT,
                },
              ]}
            >
              <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}>
                <Path d={areaD} fill="url(#areaGradient)" />
                <Path
                  d={lineD}
                  fill="none"
                  stroke={colors.primary.blue600}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>

            <Text style={styles.yAxisLabel}>
              Calm{' '}days
            </Text>
            <Text style={styles.xAxisLabel}>Timeline</Text>

            {milestonePoints.map((m, i) => {
              const isLast = i === milestonePoints.length - 1;
              const anim = milestoneAnims[i];
              return (
                <Animated.View
                  key={m.day}
                  pointerEvents="none"
                  style={[
                    styles.milestone,
                    {
                      left: m.x - 60,
                      top: m.y - 38,
                      width: 120,
                      opacity: anim,
                      transform: [
                        {
                          translateY: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [6, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.milestoneLabel}>{m.label}</Text>
                </Animated.View>
              );
            })}

            {milestonePoints.map((m, i) => {
              const isLast = i === milestonePoints.length - 1;
              const anim = milestoneAnims[i];
              const size = isLast ? 26 : 12;
              return (
                <Animated.View
                  key={`dot-${m.day}`}
                  pointerEvents="none"
                  style={[
                    styles.dotWrap,
                    {
                      left: m.x - size / 2,
                      top: m.y - size / 2,
                      width: size,
                      height: size,
                      opacity: anim,
                      transform: [
                        {
                          scale: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {isLast ? (
                    <Svg width={size} height={size} viewBox="0 0 26 26">
                      <Path
                        d="M13 1.5l2.7 2.4 3.5-.7.9 3.5 3.2 1.7-1.5 3.3 1 3.5-3.3 1.5-1 3.5-3.6-.4L13 22l-1.9-2.3-3.6.4-1-3.5-3.3-1.5 1-3.5L2.7 8.4l3.2-1.7.9-3.5 3.5.7L13 1.5z"
                        fill={colors.warning[500]}
                      />
                      <Path
                        d="M13 7.6l1.5 3 3.4.5-2.5 2.4.6 3.4L13 15.3l-3 1.6.6-3.4-2.5-2.4 3.4-.5L13 7.6z"
                        fill={colors.background.elevated}
                      />
                    </Svg>
                  ) : (
                    <View style={styles.dot} />
                  )}
                </Animated.View>
              );
            })}
          </View>
        </View>

        <Text style={styles.caption}>
          Within four weeks of consistent breathwork, <Text style={styles.captionStrong}>95% of users</Text> have reported feeling more calm.
        </Text>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  graphCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  graphCanvas: {
    alignSelf: 'center',
    position: 'relative',
  },
  areaClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  yAxisLabel: {
    position: 'absolute',
    top: 0,
    left: 18,
    ...typography.body.small,
    fontSize: 11,
    lineHeight: 13,
    color: colors.text.tertiary,
  },
  xAxisLabel: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    ...typography.body.small,
    fontSize: 11,
    color: colors.text.tertiary,
  },
  milestone: {
    position: 'absolute',
    alignItems: 'center',
  },
  milestoneLabel: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 16,
    color: colors.text.primary,
  },
  dotWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.background.elevated,
    borderWidth: 3,
    borderColor: colors.primary.blue600,
  },
  caption: {
    ...typography.body.small,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  captionStrong: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
