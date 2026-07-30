import { Text } from '../../common/Text';
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import CardSurface from '../../common/CardSurface';
import MindMapRadar from '../MindMapRadar';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { benchmarkBreathHold } from '../../../lib/breathHoldPercentile';
import type { MindMapAxis, MindMapScore } from '../../../lib/onboardingScores';

interface DiagnosisScreenProps {
  age: number;
  scores: MindMapScore[];
  superpower: MindMapScore;
  growthArea: MindMapScore;
  holdSeconds: number | null;
  restingBpm: number | null;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

interface HighlightCard {
  id: string;
  role: string;
  subject: string;
  pill: string;
  pillColor: string;
  body: string;
}

const SUPERPOWER_COPY: Record<MindMapAxis, string> = {
  calm: 'Traffic at a standstill? Your body settles before your head does.',
  recovery: 'Long day behind you? You come back down faster than most people.',
  focus: 'Deep work in front of you? You drop in and stay there.',
  resilience: 'Plans fall apart? You steady yourself and keep moving.',
  breathEase: 'Your breath already runs slow and easy without you thinking about it.',
};

const GROWTH_COPY: Record<MindMapAxis, string> = {
  calm: 'Tense moment passes? The tension tends to stay with you long after.',
  recovery: 'Rest is not landing yet. Your body is still running warm at night.',
  focus: 'Halfway through a task and gone? Your attention is asking for a reset.',
  resilience: 'Small things going wrong? They are landing harder than you would like.',
  breathEase: 'Your breathing is running shallow and quick through most of the day.',
};

export default function DiagnosisScreen({
  age,
  scores,
  superpower,
  growthArea,
  holdSeconds,
  restingBpm,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: DiagnosisScreenProps) {
  const { width } = useWindowDimensions();
  const benchmark = useMemo(
    () => (holdSeconds != null ? benchmarkBreathHold(holdSeconds, age) : null),
    [holdSeconds, age],
  );

  const highlights = useMemo<HighlightCard[]>(() => {
    const next: HighlightCard[] = [
      {
        id: 'superpower',
        role: 'Superpower',
        subject: superpower.label,
        pill: `${Math.round(superpower.value)}%`,
        pillColor: colors.success[500],
        body: SUPERPOWER_COPY[superpower.axis],
      },
      {
        id: 'growth',
        role: 'Growth area',
        subject: growthArea.label,
        pill: `${Math.round(growthArea.value)}%`,
        pillColor: colors.orange[500],
        body: GROWTH_COPY[growthArea.axis],
      },
    ];

    if (benchmark && holdSeconds != null) {
      next.push({
        id: 'peers',
        role: 'Versus peers',
        subject: 'Breath hold',
        pill: `${holdSeconds}s`,
        pillColor: colors.primary.blue600,
        body: `${benchmark.label}. Most people your age hold around ${benchmark.peerMedianSeconds}s.`,
      });
    }

    if (restingBpm != null) {
      next.push({
        id: 'restingBpm',
        role: 'Resting heart rate',
        subject: 'Your baseline',
        pill: `${Math.round(restingBpm)} bpm`,
        pillColor: colors.primary.blue600,
        body: 'Measured from your fingertip before any breathing. Every future read compares back to this.',
      });
    }

    return next;
  }, [benchmark, holdSeconds, restingBpm, superpower, growthArea]);

  return (
    <OnboardingScreenLayout
      title="Your breathing profile"
      progress={stepIndex / stepCount}
      onBack={onBack}
      titleStyle={styles.screenTitle}
      centerCopy
      footer={<OnboardingPrimaryButton label="See my plan" onPress={onContinue} />}
    >
      <View style={styles.page}>
        <View style={styles.radarWrap}>
          <MindMapRadar scores={scores} size={width} />
        </View>

        <Text style={styles.summary}>
          <Text style={styles.summaryStrong}>{superpower.label}</Text>
          {' is your strongest dimension. '}
          <Text style={styles.summaryGrowth}>{growthArea.label}</Text>
          {' has the most room to move.'}
        </Text>

        <Text style={styles.sectionTitle}>Your highlights</Text>

        <View style={styles.highlightList}>
          {highlights.map((highlight) => (
            <CardSurface key={highlight.id} style={styles.highlightCard}>
              <View style={styles.highlightHeader}>
                <Text style={styles.highlightRole}>{highlight.role}</Text>
                <View style={styles.highlightMeta}>
                  <Text style={styles.highlightSubject}>{highlight.subject}</Text>
                  <View
                    style={[styles.highlightPill, { backgroundColor: highlight.pillColor }]}
                  >
                    <Text style={styles.highlightPillText}>{highlight.pill}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.highlightBody}>{highlight.body}</Text>
            </CardSurface>
          ))}
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 32,
    lineHeight: 39,
    letterSpacing: -0.5,
  },
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
  sectionTitle: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  highlightList: {
    gap: spacing.sm,
  },
  highlightCard: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  highlightRole: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue600,
  },
  highlightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  highlightSubject: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    flexShrink: 1,
  },
  highlightPill: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  highlightPillText: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    color: colors.neutral[0],
  },
  highlightBody: {
    ...typography.body.small,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
