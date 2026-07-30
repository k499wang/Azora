import { Text } from '../../common/Text';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  Animated, Easing, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import Icon, { type IconName } from '../../common/icons/Icon';
import CardSurface from '../../common/CardSurface';
import MindMapRadar from '../MindMapRadar';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { useScoreMorph } from '../../../hooks/useScoreMorph';
import { benchmarkBreathHold } from '../../../lib/breathHoldPercentile';
import { estimateLungAge } from '../../../lib/lungAge';
import type { MindMapScore } from '../../../lib/onboardingScores';

interface DiagnosisScreenProps {
  age: number;
  scores: MindMapScore[];
  superpower: MindMapScore;
  growthArea: MindMapScore;
  holdSeconds: number | null;
  restingBpm: number | null;
  bpmDrop: number | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

interface MetricCard {
  id: string;
  icon: IconName;
  label: string;
  value: string;
  unit: string;
  note: string;
}

const REVEAL_DURATION_MS = 1100;
const REVEAL_DELAY_MS = 220;
const STAGGER_MS = 110;
const ENTER_DURATION_MS = 420;

export default function DiagnosisScreen({
  age,
  scores,
  superpower,
  growthArea,
  holdSeconds,
  restingBpm,
  bpmDrop,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: DiagnosisScreenProps) {
  const { width } = useWindowDimensions();
  const collapsed = useMemo(
    () => scores.map((score) => ({ ...score, value: 0 })),
    [scores],
  );
  const { scores: revealed } = useScoreMorph({
    from: collapsed,
    to: scores,
    durationMs: REVEAL_DURATION_MS,
    delayMs: REVEAL_DELAY_MS,
  });

  const benchmark = useMemo(
    () => (holdSeconds != null ? benchmarkBreathHold(holdSeconds, age) : null),
    [holdSeconds, age],
  );

  const cards = useMemo<MetricCard[]>(() => {
    const next: MetricCard[] = [];

    if (holdSeconds != null) {
      const lungAge = estimateLungAge(holdSeconds, age);
      next.push({
        id: 'lungAge',
        icon: 'lungs',
        label: 'Lung age',
        value: `${lungAge.years}`,
        unit: 'yrs',
        note: lungAge.label,
      });
    }

    if (restingBpm != null) {
      next.push({
        id: 'restingBpm',
        icon: 'heart',
        label: 'Resting heart rate',
        value: `${Math.round(restingBpm)}`,
        unit: 'bpm',
        note: 'measured on your first read',
      });
    }

    if (bpmDrop != null && bpmDrop >= 1) {
      next.push({
        id: 'bpmDrop',
        icon: 'waves',
        label: 'Heart rate settled',
        value: `${Math.round(bpmDrop)}`,
        unit: 'bpm',
        note: 'in under two minutes of breathing',
      });
    }

    return next;
  }, [holdSeconds, age, restingBpm, bpmDrop]);

  return (
    <OnboardingScreenLayout
      title="Your breathing profile"
      subtitle="Five dimensions, scored from your answers and your own measurements."
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      animateCopy
      footer={<OnboardingPrimaryButton label="See my plan" onPress={onContinue} />}
    >
      <View style={styles.page}>
        <View style={styles.radarWrap}>
          <MindMapRadar scores={revealed} size={width} />
        </View>

        <Text style={styles.summary}>
          <Text style={styles.summaryStrong}>{superpower.label}</Text>
          {' is your strongest dimension. '}
          <Text style={styles.summaryGrowth}>{growthArea.label}</Text>
          {' has the most room to move.'}
        </Text>

        {holdSeconds != null && benchmark ? (
          <StaggeredEntrance index={0}>
            <CardSurface style={styles.heroCard}>
              <Text style={styles.heroLabel}>Breath hold</Text>
              <View style={styles.heroValueRow}>
                <Text style={styles.heroValue}>{holdSeconds}</Text>
                <Text style={styles.heroUnit}>sec</Text>
              </View>
              <View style={styles.heroPill}>
                <Icon name="laurel" size={16} color={colors.primary.blue600} />
                <Text style={styles.heroPillText}>{benchmark.label}</Text>
              </View>
              <Text style={styles.heroNote}>
                {`A typical untrained hold at ${age} is around ${benchmark.peerMedianSeconds}s.`}
              </Text>
            </CardSurface>
          </StaggeredEntrance>
        ) : null}

        <View style={styles.grid}>
          {cards.map((card, index) => (
            <StaggeredEntrance
              key={card.id}
              index={index + 1}
              style={styles.gridItem}
            >
              <CardSurface style={styles.metricCard}>
                <View style={styles.metricIcon}>
                  <Icon name={card.icon} size={18} color={colors.primary.blue500} />
                </View>
                <Text style={styles.metricLabel}>{card.label}</Text>
                <View style={styles.metricValueRow}>
                  <Text style={styles.metricValue}>{card.value}</Text>
                  <Text style={styles.metricUnit}>{card.unit}</Text>
                </View>
                <Text style={styles.metricNote}>{card.note}</Text>
              </CardSurface>
            </StaggeredEntrance>
          ))}
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

interface StaggeredEntranceProps {
  index: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

function StaggeredEntrance({ index, style, children }: StaggeredEntranceProps) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      delay: index * STAGGER_MS,
      duration: ENTER_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.sm,
  },
  radarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.lg,
  },
  summary: {
    ...typography.body.small,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  summaryStrong: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue600,
  },
  summaryGrowth: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.orange[600],
  },
  heroCard: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  heroLabel: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.text.tertiary,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  heroValue: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 68,
    lineHeight: 74,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
    color: colors.text.primary,
  },
  heroUnit: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
    paddingBottom: spacing.sm,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary.blue100,
  },
  heroPillText: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue600,
  },
  heroNote: {
    ...typography.body.small,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: '46%',
  },
  metricCard: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue100,
  },
  metricLabel: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  metricValue: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
    color: colors.text.primary,
  },
  metricUnit: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.tertiary,
    paddingBottom: 3,
  },
  metricNote: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
    lineHeight: 17,
  },
});
